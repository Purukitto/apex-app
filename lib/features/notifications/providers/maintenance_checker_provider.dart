import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../../../core/database/app_database.dart';
import '../../../core/providers/database_provider.dart';
import '../../../core/services/local_notification_service.dart';
import '../../../core/utils/logger.dart';
import '../../garage/providers/bikes_provider.dart';
import '../../service/providers/maintenance_alerts_provider.dart';
import '../../service/providers/service_provider.dart';

const _uuid = Uuid();

/// Watches maintenance schedules and generates notifications
/// for overdue or near-due services.
final maintenanceCheckerProvider = Provider<void>((ref) {
  final bikesAsync = ref.watch(bikesStreamProvider);
  final bikes = bikesAsync.value;
  if (bikes == null || bikes.isEmpty) return;

  final db = ref.read(databaseProvider);
  final uid = Supabase.instance.client.auth.currentUser?.id;
  if (uid == null) return;

  for (final bike in bikes) {
    final schedulesAsync = ref.watch(schedulesStreamProvider(bike.id));
    final schedules = schedulesAsync.value;
    if (schedules == null) continue;

    final bikeName = bike.nickName ?? '${bike.make} ${bike.model}';

    for (final schedule in schedules) {
      if (!schedule.isActive) continue;

      final health = calculateHealth(
        schedule: schedule,
        currentOdo: bike.currentOdo,
      );

      // Create notification when health drops below 20% (critical)
      if (health <= 20.0) {
        _maybeCreateNotification(
          db: db,
          userId: uid,
          bikeId: bike.id,
          scheduleId: schedule.id,
          partName: schedule.partName,
          bikeName: bikeName,
          health: health,
        );
      }
    }
  }
});

/// Insert a notification into Drift if one doesn't already exist
/// for this bike+schedule combination (dedupe).
Future<void> _maybeCreateNotification({
  required AppDatabase db,
  required String userId,
  required String bikeId,
  required String scheduleId,
  required String partName,
  required String bikeName,
  required double health,
}) async {
  final dedupeKey = '${bikeId}_${scheduleId}_maintenance';

  // Check for existing non-dismissed notification with this dedupe key
  final existing =
      await (db.select(db.notifications)..where(
            (n) => n.dedupeKey.equals(dedupeKey) & n.dismissedAt.isNull(),
          ))
          .get();

  if (existing.isNotEmpty) return;

  final now = DateTime.now();
  final type = health <= 0 ? 'error' : 'warning';
  final title = health <= 0
      ? '$partName service overdue'
      : '$partName service due soon';
  final message =
      '$bikeName — ${partName.toLowerCase()} maintenance is ${health <= 0 ? "overdue" : "due soon"}.';

  await db.notificationsDao.upsert(
    NotificationsCompanion(
      id: Value(_uuid.v4()),
      userId: Value(userId),
      type: Value(type),
      title: Value(title),
      message: Value(message),
      bikeId: Value(bikeId),
      scheduleId: Value(scheduleId),
      source: const Value('maintenance_checker'),
      dedupeKey: Value(dedupeKey),
      createdAt: Value(now),
      isSynced: const Value(false),
      lastModified: Value(now),
    ),
  );

  AppLogger.i('Maintenance notification created: $title');

  // Trigger immediate local notification for overdue
  if (health <= 0) {
    await LocalNotificationService.triggerDistanceNotification(
      partName: partName,
      bikeName: bikeName,
    );
  }
}

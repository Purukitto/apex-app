import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

import '../../../core/database/app_database.dart';
import '../../../core/providers/database_provider.dart';
import '../../../core/utils/logger.dart';

/// Watches all maintenance logs for a specific bike.
final maintenanceLogsStreamProvider =
    StreamProvider.family<List<MaintenanceLog>, String>((ref, bikeId) {
      final db = ref.watch(databaseProvider);
      return db.maintenanceDao.watchLogsForBike(bikeId);
    });

const _uuid = Uuid();

/// Default page size for service history.
const kServiceHistoryPageSize = 20;

/// Watches all maintenance schedules for a specific bike.
final schedulesStreamProvider =
    StreamProvider.family<List<MaintenanceSchedule>, String>((ref, bikeId) {
      final db = ref.watch(databaseProvider);
      return db.maintenanceDao.watchSchedulesForBike(bikeId);
    });

/// Watches all service history for a specific bike.
final serviceHistoryStreamProvider =
    StreamProvider.family<List<ServiceHistoryData>, String>((ref, bikeId) {
      final db = ref.watch(databaseProvider);
      return db.maintenanceDao.watchHistoryForBike(bikeId);
    });

/// Watches service history for a schedule with a limit.
final scheduleHistoryPaginatedProvider =
    StreamProvider.family<
      List<ServiceHistoryData>,
      ({String scheduleId, int limit})
    >((ref, args) {
      final db = ref.watch(databaseProvider);
      return db.maintenanceDao.watchHistoryForSchedule(
        args.scheduleId,
        limit: args.limit,
      );
    });

/// Watches all service history for a specific schedule (no limit).
final scheduleHistoryStreamProvider =
    StreamProvider.family<List<ServiceHistoryData>, String>((ref, scheduleId) {
      final db = ref.watch(databaseProvider);
      return db.maintenanceDao.watchHistoryForSchedule(scheduleId);
    });

/// Service mutation actions.
final serviceActionsProvider = Provider<ServiceActions>((ref) {
  return ServiceActions(ref);
});

class ServiceActions {
  ServiceActions(this._ref);

  final Ref _ref;

  AppDatabase get _db => _ref.read(databaseProvider);

  Future<void> completeService({
    required String scheduleId,
    required String bikeId,
    required String serviceType,
    required double serviceOdo,
    double? cost,
    String? notes,
  }) async {
    final now = DateTime.now();
    final today = DateFormat('yyyy-MM-dd').format(now);

    // Insert service history entry
    await _db.maintenanceDao.upsertHistory(
      ServiceHistoryCompanion(
        id: Value(_uuid.v4()),
        bikeId: Value(bikeId),
        scheduleId: Value(scheduleId),
        serviceDate: Value(today),
        serviceOdo: Value(serviceOdo),
        cost: Value(cost),
        notes: Value(notes),
        createdAt: Value(now),
        isSynced: const Value(false),
        lastModified: Value(now),
      ),
    );

    // Insert maintenance log (ad-hoc record, synced to Supabase)
    await _db.maintenanceDao.upsertLog(
      MaintenanceLogsCompanion(
        id: Value(_uuid.v4()),
        bikeId: Value(bikeId),
        serviceType: Value(serviceType),
        odoAtService: Value(serviceOdo),
        datePerformed: Value(today),
        notes: Value(notes),
        createdAt: Value(now),
        isSynced: const Value(false),
        lastModified: Value(now),
      ),
    );

    // Update schedule's last service info — use UPDATE not upsert so a partial
    // companion never hits SQLite NOT NULL constraints on absent columns.
    await _db.maintenanceDao.updateScheduleServiceInfo(
      scheduleId,
      lastServiceDate: today,
      lastServiceOdo: serviceOdo,
      lastModified: now,
    );

    // Update bike odometer if service reading is higher
    await _updateBikeOdoIfHigher(bikeId, serviceOdo);

    AppLogger.i('Service completed for schedule $scheduleId at $serviceOdo km');
  }

  Future<void> _updateBikeOdoIfHigher(String bikeId, double odo) async {
    final bike = await _db.bikesDao.getById(bikeId);
    if (bike != null && odo > bike.currentOdo) {
      await _db.bikesDao.updateOdometer(bikeId, odo);
    }
  }

  Future<void> deleteHistoryEntry(String id) async {
    await _db.maintenanceDao.deleteHistoryById(id);
    AppLogger.i('Service history entry deleted: $id');
  }
}

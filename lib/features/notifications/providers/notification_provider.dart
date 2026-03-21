import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/database/app_database.dart';
import '../../../core/providers/database_provider.dart';
import '../../../core/utils/logger.dart';

/// Stream of active (non-dismissed) notifications for the current user.
final notificationsProvider = StreamProvider<List<Notification>>((ref) {
  final db = ref.watch(databaseProvider);
  final uid = Supabase.instance.client.auth.currentUser?.id;
  if (uid == null) return const Stream.empty();
  return db.notificationsDao.watchActive(uid);
});

/// Stream of unread notification count.
final unreadCountProvider = StreamProvider<int>((ref) {
  final db = ref.watch(databaseProvider);
  final uid = Supabase.instance.client.auth.currentUser?.id;
  if (uid == null) return const Stream.empty();
  return db.notificationsDao.watchUnreadCount(uid);
});

/// Notification mutation actions.
final notificationActionsProvider = Provider<NotificationActions>((ref) {
  return NotificationActions(ref);
});

class NotificationActions {
  NotificationActions(this._ref);

  final Ref _ref;

  AppDatabase get _db => _ref.read(databaseProvider);

  Future<void> markAsRead(String id) async {
    await _db.notificationsDao.markAsRead(id);
    AppLogger.d('Notification marked as read: $id');
  }

  Future<void> dismiss(String id) async {
    await _db.notificationsDao.dismiss(id);
    AppLogger.d('Notification dismissed: $id');
  }

  Future<void> markAllAsRead() async {
    final uid = Supabase.instance.client.auth.currentUser?.id;
    if (uid == null) return;
    await _db.notificationsDao.markAllAsRead(uid);
    AppLogger.d('All notifications marked as read');
  }

  Future<void> dismissAll() async {
    final uid = Supabase.instance.client.auth.currentUser?.id;
    if (uid == null) return;
    await _db.notificationsDao.dismissAll(uid);
    AppLogger.d('All notifications dismissed');
  }
}

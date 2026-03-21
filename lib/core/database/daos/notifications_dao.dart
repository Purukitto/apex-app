import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables/notifications_table.dart';

part 'notifications_dao.g.dart';

@DriftAccessor(tables: [Notifications])
class NotificationsDao extends DatabaseAccessor<AppDatabase>
    with _$NotificationsDaoMixin {
  NotificationsDao(super.db);

  /// Watch active (non-dismissed) notifications for a user.
  Stream<List<Notification>> watchActive(String userId) {
    return (select(notifications)
          ..where((n) => n.userId.equals(userId) & n.dismissedAt.isNull())
          ..orderBy([(n) => OrderingTerm.desc(n.createdAt)]))
        .watch();
  }

  /// Watch unread count for a user.
  Stream<int> watchUnreadCount(String userId) {
    final count = countAll();
    final query = selectOnly(notifications)
      ..where(
        notifications.userId.equals(userId) &
            notifications.readAt.isNull() &
            notifications.dismissedAt.isNull(),
      )
      ..addColumns([count]);
    return query.watchSingle().map((row) => row.read(count)!);
  }

  /// Get a single notification by ID.
  Future<Notification?> getById(String id) {
    return (select(
      notifications,
    )..where((n) => n.id.equals(id))).getSingleOrNull();
  }

  /// Insert or update a notification.
  Future<void> upsert(NotificationsCompanion entry) {
    return into(notifications).insertOnConflictUpdate(entry);
  }

  /// Get all rows that haven't been synced.
  Future<List<Notification>> getDirtyRows() {
    return (select(
      notifications,
    )..where((n) => n.isSynced.equals(false))).get();
  }

  /// Mark a row as synced.
  Future<void> markSynced(String id) {
    return (update(notifications)..where((n) => n.id.equals(id))).write(
      const NotificationsCompanion(isSynced: Value(true)),
    );
  }

  /// Mark a notification as read.
  Future<void> markAsRead(String id) {
    return (update(notifications)..where((n) => n.id.equals(id))).write(
      NotificationsCompanion(
        readAt: Value(DateTime.now()),
        isSynced: const Value(false),
        lastModified: Value(DateTime.now()),
      ),
    );
  }

  /// Dismiss a notification.
  Future<void> dismiss(String id) {
    return (update(notifications)..where((n) => n.id.equals(id))).write(
      NotificationsCompanion(
        dismissedAt: Value(DateTime.now()),
        isSynced: const Value(false),
        lastModified: Value(DateTime.now()),
      ),
    );
  }

  /// Mark all notifications as read for a user.
  Future<void> markAllAsRead(String userId) {
    final now = DateTime.now();
    return (update(
      notifications,
    )..where((n) => n.userId.equals(userId) & n.readAt.isNull())).write(
      NotificationsCompanion(
        readAt: Value(now),
        isSynced: const Value(false),
        lastModified: Value(now),
      ),
    );
  }

  /// Dismiss all notifications for a user.
  Future<void> dismissAll(String userId) {
    final now = DateTime.now();
    return (update(
      notifications,
    )..where((n) => n.userId.equals(userId) & n.dismissedAt.isNull())).write(
      NotificationsCompanion(
        dismissedAt: Value(now),
        isSynced: const Value(false),
        lastModified: Value(now),
      ),
    );
  }

  /// Delete a notification by ID.
  Future<int> deleteById(String id) {
    return (delete(notifications)..where((n) => n.id.equals(id))).go();
  }
}

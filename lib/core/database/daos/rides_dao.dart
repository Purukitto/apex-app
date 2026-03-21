import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables/rides_table.dart';

part 'rides_dao.g.dart';

@DriftAccessor(tables: [Rides])
class RidesDao extends DatabaseAccessor<AppDatabase> with _$RidesDaoMixin {
  RidesDao(super.db);

  /// Watch all rides for a user, ordered by start time descending.
  Stream<List<Ride>> watchForUser(String userId) {
    return (select(rides)
          ..where((r) => r.userId.equals(userId))
          ..orderBy([(r) => OrderingTerm.desc(r.startTime)]))
        .watch();
  }

  /// Watch rides for a user with pagination.
  Stream<List<Ride>> watchForUserPaginated(
    String userId, {
    required int limit,
    int offset = 0,
  }) {
    return (select(rides)
          ..where((r) => r.userId.equals(userId))
          ..orderBy([(r) => OrderingTerm.desc(r.startTime)])
          ..limit(limit, offset: offset))
        .watch();
  }

  /// Watch rides for a specific bike.
  Stream<List<Ride>> watchForBike(String bikeId) {
    return (select(rides)
          ..where((r) => r.bikeId.equals(bikeId))
          ..orderBy([(r) => OrderingTerm.desc(r.startTime)]))
        .watch();
  }

  /// Get a single ride by ID.
  Future<Ride?> getById(String id) {
    return (select(rides)..where((r) => r.id.equals(id))).getSingleOrNull();
  }

  /// Count rides for a bike (deletion guard).
  Future<int> countForBike(String bikeId) async {
    final count = countAll();
    final query = selectOnly(rides)
      ..where(rides.bikeId.equals(bikeId))
      ..addColumns([count]);
    final result = await query.getSingle();
    return result.read(count)!;
  }

  /// Insert or update a ride.
  Future<void> upsert(RidesCompanion entry) {
    return into(rides).insertOnConflictUpdate(entry);
  }

  /// Get all rows that haven't been synced.
  Future<List<Ride>> getDirtyRows() {
    return (select(rides)..where((r) => r.isSynced.equals(false))).get();
  }

  /// Mark a row as synced.
  Future<void> markSynced(String id) {
    return (update(rides)..where((r) => r.id.equals(id)))
        .write(const RidesCompanion(isSynced: Value(true)));
  }

  /// Delete a ride by ID.
  Future<int> deleteById(String id) {
    return (delete(rides)..where((r) => r.id.equals(id))).go();
  }

  /// Count total rides for a user.
  Future<int> countForUser(String userId) async {
    final count = countAll();
    final query = selectOnly(rides)
      ..where(rides.userId.equals(userId))
      ..addColumns([count]);
    final result = await query.getSingle();
    return result.read(count)!;
  }

  /// Sum of distanceKm for all rides of a user.
  Future<double> totalDistanceForUser(String userId) async {
    final sum = rides.distanceKm.sum();
    final query = selectOnly(rides)
      ..where(rides.userId.equals(userId))
      ..addColumns([sum]);
    final result = await query.getSingle();
    return result.read(sum) ?? 0.0;
  }

  /// Watch the most recent rides for a user (for dashboard).
  Stream<List<Ride>> watchRecentForUser(String userId, {int limit = 5}) {
    return (select(rides)
          ..where((r) => r.userId.equals(userId))
          ..orderBy([(r) => OrderingTerm.desc(r.startTime)])
          ..limit(limit))
        .watch();
  }
}

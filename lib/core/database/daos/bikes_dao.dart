import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables/bikes_table.dart';

part 'bikes_dao.g.dart';

@DriftAccessor(tables: [Bikes])
class BikesDao extends DatabaseAccessor<AppDatabase> with _$BikesDaoMixin {
  BikesDao(super.db);

  /// Watch all bikes for a user, ordered by creation date descending.
  Stream<List<Bike>> watchForUser(String userId) {
    return (select(bikes)
          ..where((b) => b.userId.equals(userId))
          ..orderBy([(b) => OrderingTerm.desc(b.createdAt)]))
        .watch();
  }

  /// Get a single bike by ID.
  Future<Bike?> getById(String id) {
    return (select(bikes)..where((b) => b.id.equals(id))).getSingleOrNull();
  }

  /// Insert or update a bike.
  Future<void> upsert(BikesCompanion entry) {
    return into(bikes).insertOnConflictUpdate(entry);
  }

  /// Update only the odometer (and mark dirty) for an existing bike.
  Future<void> updateOdometer(String bikeId, double newOdo) {
    return (update(bikes)..where((b) => b.id.equals(bikeId))).write(
      BikesCompanion(
        currentOdo: Value(newOdo),
        isSynced: const Value(false),
        lastModified: Value(DateTime.now()),
      ),
    );
  }

  /// Get all rows that haven't been synced.
  Future<List<Bike>> getDirtyRows() {
    return (select(bikes)..where((b) => b.isSynced.equals(false))).get();
  }

  /// Mark a row as synced.
  Future<void> markSynced(String id) {
    return (update(bikes)..where((b) => b.id.equals(id))).write(
      const BikesCompanion(isSynced: Value(true)),
    );
  }

  /// Update fuel stats on a bike (avg mileage + last fuel price).
  Future<void> updateFuelStats(
    String bikeId, {
    double? avgMileage,
    double? lastFuelPrice,
  }) {
    return (update(bikes)..where((b) => b.id.equals(bikeId))).write(
      BikesCompanion(
        avgMileage: Value(avgMileage),
        lastFuelPrice: Value(lastFuelPrice),
        isSynced: const Value(false),
        lastModified: Value(DateTime.now()),
      ),
    );
  }

  /// Update specific fields on an existing bike (proper UPDATE, not upsert).
  Future<void> updateFields(String bikeId, BikesCompanion companion) {
    return (update(bikes)..where((b) => b.id.equals(bikeId))).write(companion);
  }

  /// Delete a bike by ID.
  Future<int> deleteById(String id) {
    return (delete(bikes)..where((b) => b.id.equals(id))).go();
  }

  /// Get all bike IDs for a user.
  Future<List<String>> getBikeIdsForUser(String userId) async {
    final rows = await (select(
      bikes,
    )..where((b) => b.userId.equals(userId))).get();
    return rows.map((b) => b.id).toList();
  }
}

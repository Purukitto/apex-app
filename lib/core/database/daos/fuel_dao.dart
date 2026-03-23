import 'package:drift/drift.dart';

import '../app_database.dart';
import '../tables/fuel_logs_table.dart';
import '../tables/bikes_table.dart';
import '../../utils/fuel_calculations.dart';

part 'fuel_dao.g.dart';

@DriftAccessor(tables: [FuelLogs, Bikes])
class FuelDao extends DatabaseAccessor<AppDatabase> with _$FuelDaoMixin {
  FuelDao(super.db);

  /// Watch all fuel logs for a bike, ordered by date descending.
  Stream<List<FuelLog>> watchForBike(String bikeId, {int? limit}) {
    final query = select(fuelLogs)
      ..where((f) => f.bikeId.equals(bikeId))
      ..orderBy([(f) => OrderingTerm.desc(f.date)]);
    if (limit != null) query.limit(limit);
    return query.watch();
  }

  /// Get a single fuel log by ID.
  Future<FuelLog?> getById(String id) {
    return (select(fuelLogs)..where((f) => f.id.equals(id))).getSingleOrNull();
  }

  /// Get all fuel logs for a bike.
  Future<List<FuelLog>> getForBike(String bikeId) {
    return (select(fuelLogs)
          ..where((f) => f.bikeId.equals(bikeId))
          ..orderBy([(f) => OrderingTerm.desc(f.date)]))
        .get();
  }

  /// Insert or update a fuel log.
  Future<void> upsert(FuelLogsCompanion entry) {
    return into(fuelLogs).insertOnConflictUpdate(entry);
  }

  /// Get all rows that haven't been synced.
  Future<List<FuelLog>> getDirtyRows() {
    return (select(fuelLogs)..where((f) => f.isSynced.equals(false))).get();
  }

  /// Mark a row as synced.
  Future<void> markSynced(String id) {
    return (update(fuelLogs)..where((f) => f.id.equals(id))).write(
      const FuelLogsCompanion(isSynced: Value(true)),
    );
  }

  /// Delete a fuel log by ID.
  Future<int> deleteById(String id) {
    return (delete(fuelLogs)..where((f) => f.id.equals(id))).go();
  }

  /// Count fuel logs for a bike (deletion guard).
  Future<int> countForBike(String bikeId) async {
    final count = countAll();
    final query = selectOnly(fuelLogs)
      ..where(fuelLogs.bikeId.equals(bikeId))
      ..addColumns([count]);
    final result = await query.getSingle();
    return result.read(count)!;
  }

  /// Recalculate and update bike's avg_mileage and last_fuel_price
  /// from its fuel logs. Ports the React calculateMileage + getLastFuelPrice.
  Future<void> recalculateBikeStats(String bikeId) async {
    final logs = await getForBike(bikeId);

    final entries = logs
        .map(
          (log) => FuelLogEntry(
            odometer: log.odometer,
            litres: log.litres,
            pricePerLitre: log.pricePerLitre,
            isFullTank: log.isFullTank,
            date: log.date,
            createdAt: log.createdAt,
          ),
        )
        .toList();

    final avgMileage = calculateMileage(entries);
    final lastPrice = getLastFuelPrice(entries);

    await (update(bikes)..where((b) => b.id.equals(bikeId))).write(
      BikesCompanion(
        avgMileage: Value(avgMileage),
        lastFuelPrice: Value(lastPrice),
        isSynced: const Value(false),
        lastModified: Value(DateTime.now()),
      ),
    );
  }
}

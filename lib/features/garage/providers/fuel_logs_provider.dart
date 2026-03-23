import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../core/database/app_database.dart';
import '../../../core/providers/database_provider.dart';
import '../../../core/utils/logger.dart';

const _uuid = Uuid();

/// Default page size for fuel logs.
const kFuelLogsPageSize = 20;

/// Watches fuel logs for a specific bike with a limit.
/// Pass limit via the record key: (bikeId, limit).
final fuelLogsPaginatedProvider =
    StreamProvider.family<List<FuelLog>, ({String bikeId, int limit})>((
      ref,
      args,
    ) {
      final db = ref.watch(databaseProvider);
      return db.fuelDao.watchForBike(args.bikeId, limit: args.limit);
    });

/// Watches all fuel logs for a specific bike (used by recalculation/stats).
final fuelLogsStreamProvider = StreamProvider.family<List<FuelLog>, String>((
  ref,
  bikeId,
) {
  final db = ref.watch(databaseProvider);
  return db.fuelDao.watchForBike(bikeId);
});

/// Fuel log mutation actions.
final fuelActionsProvider = Provider<FuelActions>((ref) {
  return FuelActions(ref);
});

class FuelActions {
  FuelActions(this._ref);

  final Ref _ref;

  AppDatabase get _db => _ref.read(databaseProvider);

  Future<void> addFuelLog({
    required String bikeId,
    required double odometer,
    required double litres,
    required double pricePerLitre,
    required double totalCost,
    required bool isFullTank,
    required String date,
  }) async {
    final id = _uuid.v4();
    final now = DateTime.now();

    await _db.fuelDao.upsert(
      FuelLogsCompanion(
        id: Value(id),
        bikeId: Value(bikeId),
        odometer: Value(odometer),
        litres: Value(litres),
        pricePerLitre: Value(pricePerLitre),
        totalCost: Value(totalCost),
        isFullTank: Value(isFullTank),
        date: Value(date),
        createdAt: Value(now),
        isSynced: const Value(false),
        lastModified: Value(now),
      ),
    );

    await _updateBikeOdoIfHigher(bikeId, odometer);
    await _db.fuelDao.recalculateBikeStats(bikeId);
    AppLogger.i('Fuel log added for bike $bikeId');
  }

  Future<void> updateFuelLog({
    required String id,
    required String bikeId,
    required double odometer,
    required double litres,
    required double pricePerLitre,
    required double totalCost,
    required bool isFullTank,
    required String date,
  }) async {
    final now = DateTime.now();

    await _db.fuelDao.upsert(
      FuelLogsCompanion(
        id: Value(id),
        bikeId: Value(bikeId),
        odometer: Value(odometer),
        litres: Value(litres),
        pricePerLitre: Value(pricePerLitre),
        totalCost: Value(totalCost),
        isFullTank: Value(isFullTank),
        date: Value(date),
        isSynced: const Value(false),
        lastModified: Value(now),
      ),
    );

    await _updateBikeOdoIfHigher(bikeId, odometer);
    await _db.fuelDao.recalculateBikeStats(bikeId);
    AppLogger.i('Fuel log updated: $id');
  }

  /// Update the bike's odometer if the fuel log reading is higher.
  Future<void> _updateBikeOdoIfHigher(String bikeId, double odo) async {
    final bike = await _db.bikesDao.getById(bikeId);
    if (bike != null && odo > bike.currentOdo) {
      await _db.bikesDao.updateOdometer(bikeId, odo);
    }
  }

  Future<void> deleteFuelLog(String id, String bikeId) async {
    await _db.fuelDao.deleteById(id);
    await _db.fuelDao.recalculateBikeStats(bikeId);
    AppLogger.i('Fuel log deleted: $id');
  }
}

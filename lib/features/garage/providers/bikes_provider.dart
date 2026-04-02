import 'dart:async';

import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../../../core/database/app_database.dart';
import '../../../core/network/supabase_client.dart';
import '../../../core/providers/database_provider.dart';
import '../../../core/utils/logger.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../data/global_bike_search_service.dart';

const _uuid = Uuid();

/// Watches all bikes for the currently authenticated user.
/// Re-evaluates when auth state changes so we never get stuck on a stale null UID.
final bikesStreamProvider = StreamProvider<List<Bike>>((ref) {
  final db = ref.watch(databaseProvider);
  // Watch auth state so this provider re-creates when user signs in/out.
  final authState = ref.watch(authStateProvider);
  final session = authState.asData?.value.session;
  final uid = session?.user.id;
  if (uid == null) return const Stream.empty();
  return db.bikesDao.watchForUser(uid);
});

/// Counts related entities for a bike (rides, fuel logs, maintenance logs).
/// Used by the delete dialog to determine deletion guards.
final bikeRelatedCountsProvider =
    FutureProvider.family<BikeRelatedCounts, String>((ref, bikeId) async {
      final db = ref.read(databaseProvider);
      final results = await Future.wait([
        db.ridesDao.countForBike(bikeId),
        db.fuelDao.countForBike(bikeId),
        db.maintenanceDao.countLogsForBike(bikeId),
      ]);
      return BikeRelatedCounts(
        rides: results[0],
        fuelLogs: results[1],
        maintenanceLogs: results[2],
      );
    });

class BikeRelatedCounts {
  const BikeRelatedCounts({
    required this.rides,
    required this.fuelLogs,
    required this.maintenanceLogs,
  });

  final int rides;
  final int fuelLogs;
  final int maintenanceLogs;

  bool get hasRides => rides > 0;
  bool get hasLogs => fuelLogs > 0 || maintenanceLogs > 0;
}

/// Debounced global bike search provider.
final globalBikeSearchProvider =
    NotifierProvider.autoDispose<
      GlobalBikeSearchNotifier,
      AsyncValue<List<GlobalBikeSpec>>
    >(GlobalBikeSearchNotifier.new);

class GlobalBikeSearchNotifier
    extends Notifier<AsyncValue<List<GlobalBikeSpec>>> {
  Timer? _debounce;

  @override
  AsyncValue<List<GlobalBikeSpec>> build() {
    ref.onDispose(() => _debounce?.cancel());
    return const AsyncData([]);
  }

  Future<void> search(String query) async {
    _debounce?.cancel();

    if (query.length < 3) {
      state = const AsyncData([]);
      return;
    }

    // 500ms debounce
    _debounce = Timer(const Duration(milliseconds: 500), () async {
      state = const AsyncLoading();
      try {
        final client = ref.read(supabaseClientProvider);
        final results = await GlobalBikeSearchService.searchBikes(
          client,
          query,
        );
        state = AsyncData(results);
      } catch (e, st) {
        state = AsyncError(e, st);
      }
    });
  }

  void clear() {
    _debounce?.cancel();
    state = const AsyncData([]);
  }
}

/// Bike mutation actions.
final bikeActionsProvider = Provider<BikeActions>((ref) {
  return BikeActions(ref);
});

class BikeActions {
  BikeActions(this._ref);

  final Ref _ref;

  AppDatabase get _db => _ref.read(databaseProvider);

  Future<void> addBike({
    required String make,
    required String model,
    int? year,
    String? nickName,
    required double currentOdo,
    String? imageUrl,
    String? specsEngine,
    String? specsPower,
  }) async {
    final uid = Supabase.instance.client.auth.currentUser?.id;
    if (uid == null) throw Exception('Not authenticated');

    final bikeId = _uuid.v4();
    final now = DateTime.now();

    await _db.bikesDao.upsert(
      BikesCompanion(
        id: Value(bikeId),
        userId: Value(uid),
        make: Value(make),
        model: Value(model),
        year: Value(year),
        currentOdo: Value(currentOdo),
        nickName: Value(nickName),
        imageUrl: Value(imageUrl),
        specsEngine: Value(specsEngine),
        specsPower: Value(specsPower),
        createdAt: Value(now),
        isSynced: const Value(false),
        lastModified: Value(now),
      ),
    );

    await _db.maintenanceDao.initializeDefaultSchedules(
      bikeId,
      currentOdo: currentOdo,
    );
    AppLogger.i('Bike added: $make $model ($bikeId)');
  }

  Future<void> updateBike(
    String bikeId, {
    required String make,
    required String model,
    int? year,
    String? nickName,
    required double currentOdo,
    String? imageUrl,
    String? specsEngine,
    String? specsPower,
  }) async {
    final now = DateTime.now();

    await _db.bikesDao.updateFields(
      bikeId,
      BikesCompanion(
        make: Value(make),
        model: Value(model),
        year: Value(year),
        currentOdo: Value(currentOdo),
        nickName: Value(nickName),
        imageUrl: Value(imageUrl),
        specsEngine: Value(specsEngine),
        specsPower: Value(specsPower),
        isSynced: const Value(false),
        lastModified: Value(now),
      ),
    );

    AppLogger.i('Bike updated: $bikeId');
  }

  Future<void> deleteBike(String bikeId) async {
    await _db.bikesDao.deleteById(bikeId);
    AppLogger.i('Bike deleted: $bikeId');
  }
}

import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/database/app_database.dart';
import '../../../core/network/supabase_client.dart';
import '../../../core/providers/database_provider.dart';
import '../../../core/utils/logger.dart';

/// Watches all rides for the currently authenticated user.
final ridesStreamProvider = StreamProvider<List<Ride>>((ref) {
  final db = ref.watch(databaseProvider);
  final uid = Supabase.instance.client.auth.currentUser?.id;
  if (uid == null) return const Stream.empty();
  return db.ridesDao.watchForUser(uid);
});

/// Total ride count for the user.
final rideCountProvider = FutureProvider<int>((ref) async {
  final db = ref.read(databaseProvider);
  final uid = Supabase.instance.client.auth.currentUser?.id;
  if (uid == null) return 0;
  return db.ridesDao.countForUser(uid);
});

/// Paginated rides list notifier for infinite scroll.
final ridesListProvider = NotifierProvider<RidesListNotifier, RidesListState>(
  RidesListNotifier.new,
);

class RidesListState {
  const RidesListState({
    this.rides = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.limit = 20,
  });

  final List<Ride> rides;
  final bool isLoading;
  final bool hasMore;
  final int limit;
}

class RidesListNotifier extends Notifier<RidesListState> {
  @override
  RidesListState build() {
    _startWatching(20);
    return const RidesListState(isLoading: true);
  }

  void _startWatching(int limit) {
    final db = ref.read(databaseProvider);
    final uid = Supabase.instance.client.auth.currentUser?.id;
    if (uid == null) {
      state = const RidesListState(isLoading: false);
      return;
    }

    db.ridesDao.watchForUserPaginated(uid, limit: limit).listen((rides) {
      state = RidesListState(
        rides: rides,
        isLoading: false,
        hasMore: rides.length >= limit,
        limit: limit,
      );
    });
  }

  void loadMore() {
    if (state.isLoading || !state.hasMore) return;
    final newLimit = state.limit + 20;
    state = RidesListState(
      rides: state.rides,
      isLoading: true,
      hasMore: state.hasMore,
      limit: newLimit,
    );
    _startWatching(newLimit);
  }
}

/// Ride mutation actions.
final rideActionsProvider = Provider<RideActions>((ref) {
  return RideActions(ref);
});

class RideActions {
  RideActions(this._ref);

  final Ref _ref;

  AppDatabase get _db => _ref.read(databaseProvider);

  Future<void> updateRide(
    String rideId, {
    String? rideName,
    String? notes,
    String? imageUrl,
  }) async {
    final now = DateTime.now();

    final existing = await _db.ridesDao.getById(rideId);
    if (existing == null) return;

    await _db.ridesDao.upsert(
      RidesCompanion(
        id: Value(rideId),
        bikeId: Value(existing.bikeId),
        userId: Value(existing.userId),
        startTime: Value(existing.startTime),
        endTime: Value(existing.endTime),
        distanceKm: Value(existing.distanceKm),
        maxLeanLeft: Value(existing.maxLeanLeft),
        maxLeanRight: Value(existing.maxLeanRight),
        routePath: Value(existing.routePath),
        rideName: Value(rideName),
        notes: Value(notes),
        imageUrl: Value(imageUrl),
        createdAt: Value(existing.createdAt),
        isSynced: const Value(false),
        lastModified: Value(now),
      ),
    );

    AppLogger.i('Ride updated: $rideId');
  }

  Future<void> deleteRide(String rideId) async {
    // Delete from Drift
    await _db.ridesDao.deleteById(rideId);

    // Also delete from Supabase directly (sync engine doesn't track deletes)
    try {
      final supabase = _ref.read(supabaseClientProvider);
      await supabase.from('rides').delete().eq('id', rideId);
    } catch (e) {
      AppLogger.w('Remote delete failed for ride $rideId', e);
    }

    AppLogger.i('Ride deleted: $rideId');
  }
}

import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../../../core/database/app_database.dart';
import '../../../core/providers/database_provider.dart';
import '../../../core/utils/logger.dart';
import 'ride_session_provider.dart';

const _uuid = Uuid();

/// Save/discard ride actions.
class RideActions {
  RideActions(this._ref);

  final Ref _ref;

  AppDatabase get _db => _ref.read(databaseProvider);

  /// Save the current ride to Drift (offline-first).
  /// Returns the ride ID on success.
  Future<String> saveRide() async {
    final session = _ref.read(rideSessionProvider);
    final notifier = _ref.read(rideSessionProvider.notifier);

    notifier.setSaving();

    final uid = Supabase.instance.client.auth.currentUser?.id;
    if (uid == null) throw Exception('Not authenticated');

    final bike = session.selectedBike;
    if (bike == null) throw Exception('No bike selected');

    final rideId = _uuid.v4();
    final now = DateTime.now();

    // Build GeoJSON LineString from coords
    String? routePath;
    if (session.coords.length >= 2) {
      final coordinates = session.coords.map((c) => [c.lon, c.lat]).toList();
      routePath = jsonEncode({
        'type': 'LineString',
        'coordinates': coordinates,
      });
    }

    // Insert ride
    await _db.ridesDao.upsert(
      RidesCompanion(
        id: Value(rideId),
        bikeId: Value(bike.id),
        userId: Value(uid),
        startTime: Value(session.startTime ?? now),
        endTime: Value(now),
        distanceKm: Value(session.distanceKm),
        maxLeanLeft: Value(session.maxLeanLeft),
        maxLeanRight: Value(session.maxLeanRight),
        routePath: Value(routePath),
        createdAt: Value(now),
        isSynced: const Value(false),
        lastModified: Value(now),
      ),
    );

    // Update bike odometer
    final currentBike = await _db.bikesDao.getById(bike.id);
    if (currentBike != null) {
      final newOdo = (currentBike.currentOdo + session.distanceKm)
          .roundToDouble();
      await _db.bikesDao.updateOdometer(bike.id, newOdo);
      AppLogger.i('Odo updated: ${currentBike.currentOdo} → $newOdo km');
    }

    AppLogger.i(
      'Ride saved: $rideId (${session.distanceKm} km, '
      'lean L${session.maxLeanLeft}° R${session.maxLeanRight}°)',
    );

    // Reset session
    notifier.reset();

    return rideId;
  }

  /// Discard the current ride without saving.
  void discardRide() {
    _ref.read(rideSessionProvider.notifier).reset();
    AppLogger.i('Ride discarded');
  }
}

final rideActionsProvider = Provider<RideActions>((ref) {
  return RideActions(ref);
});

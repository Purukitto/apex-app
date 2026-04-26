import 'dart:async';
import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../database/app_database.dart';
import '../utils/logger.dart';
import 'conflict_resolver.dart';
import 'sync_status.dart';

/// Orchestrates push/pull synchronization between Drift (local) and Supabase.
class SyncEngine {
  SyncEngine({required this.db, required this.supabase, required this.prefs});

  final AppDatabase db;
  final SupabaseClient supabase;
  final SharedPreferences prefs;

  Timer? _periodicTimer;
  final _stateController = StreamController<SyncState>.broadcast();

  Stream<SyncState> get stateStream => _stateController.stream;
  SyncState _state = const SyncState();
  SyncState get currentState => _state;

  void _emit(SyncState state) {
    _state = state;
    _stateController.add(state);
  }

  /// Mark the engine as offline.
  void setOffline() {
    _emit(_state.copyWith(status: SyncStatus.offline));
  }

  // ── Lifecycle ─────────────────────────────────────────────────────

  void startPeriodicSync() {
    stopPeriodicSync();
    _periodicTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => syncAll(),
    );
  }

  void stopPeriodicSync() {
    _periodicTimer?.cancel();
    _periodicTimer = null;
  }

  Future<void> dispose() async {
    stopPeriodicSync();
    await _stateController.close();
  }

  // ── Full Sync Cycle ───────────────────────────────────────────────

  Future<void> syncAll() async {
    if (_state.status == SyncStatus.syncing) return;

    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;

    _emit(_state.copyWith(status: SyncStatus.syncing));
    try {
      await _pushDirtyRows(uid);
      await _pullRemoteChanges(uid);
      _emit(SyncState(status: SyncStatus.idle, lastSyncedAt: DateTime.now()));
    } catch (e, st) {
      AppLogger.e('Sync failed', e, st);
      _emit(
        _state.copyWith(status: SyncStatus.error, errorMessage: e.toString()),
      );
    }
  }

  // ── Push ──────────────────────────────────────────────────────────

  Future<void> _pushDirtyRows(String uid) async {
    await _pushBikes();
    await _pushRides();
    await _pushFuelLogs();
    await _pushMaintenanceLogs();
    await _pushMaintenanceSchedules();
    await _pushServiceHistory();
    await _pushNotifications();
  }

  Future<void> _pushBikes() async {
    final rows = await db.bikesDao.getDirtyRows();
    for (final row in rows) {
      try {
        await supabase.from('bikes').upsert({
          'id': row.id,
          'user_id': row.userId,
          'make': row.make,
          'model': row.model,
          'year': row.year,
          'current_odo': row.currentOdo,
          'nick_name': row.nickName,
          'image_url': row.imageUrl,
          'specs_engine': row.specsEngine,
          'specs_power': row.specsPower,
          'avg_mileage': row.avgMileage,
          'last_fuel_price': row.lastFuelPrice,
          'created_at': row.createdAt.toIso8601String(),
        });
        await db.bikesDao.markSynced(row.id);
      } catch (e) {
        AppLogger.e('Push bike ${row.id} failed', e);
      }
    }
  }

  Future<void> _pushRides() async {
    final rows = await db.ridesDao.getDirtyRows();
    for (final row in rows) {
      try {
        await supabase.rpc(
          'upsert_ride',
          params: {
            'p_id': row.id,
            'p_bike_id': row.bikeId,
            'p_user_id': row.userId,
            'p_start_time': row.startTime.toIso8601String(),
            'p_end_time': row.endTime?.toIso8601String(),
            'p_distance_km': row.distanceKm,
            'p_max_lean_left': row.maxLeanLeft,
            'p_max_lean_right': row.maxLeanRight,
            'p_ride_name': row.rideName,
            'p_notes': row.notes,
            'p_image_url': row.imageUrl,
            'p_created_at': row.createdAt.toIso8601String(),
            'p_route_path': row.routePath,
          },
        );
        await db.ridesDao.markSynced(row.id);
      } catch (e) {
        AppLogger.e('Push ride ${row.id} failed', e);
      }
    }
  }

  Future<void> _pushFuelLogs() async {
    final rows = await db.fuelDao.getDirtyRows();
    for (final row in rows) {
      try {
        await supabase.from('fuel_logs').upsert({
          'id': row.id,
          'bike_id': row.bikeId,
          'odometer': row.odometer,
          'litres': row.litres,
          'price_per_litre': row.pricePerLitre,
          'total_cost': row.totalCost,
          'is_full_tank': row.isFullTank,
          'date': row.date,
          'created_at': row.createdAt.toIso8601String(),
        });
        await db.fuelDao.markSynced(row.id);
      } catch (e) {
        AppLogger.e('Push fuel log ${row.id} failed', e);
      }
    }
  }

  Future<void> _pushMaintenanceLogs() async {
    final rows = await db.maintenanceDao.getDirtyLogs();
    for (final row in rows) {
      try {
        await supabase.from('maintenance_logs').upsert({
          'id': row.id,
          'bike_id': row.bikeId,
          'service_type': row.serviceType,
          'odo_at_service': row.odoAtService,
          'date_performed': row.datePerformed,
          'notes': row.notes,
          'receipt_url': row.receiptUrl,
          'created_at': row.createdAt.toIso8601String(),
        });
        await db.maintenanceDao.markLogSynced(row.id);
      } catch (e) {
        AppLogger.e('Push maintenance log ${row.id} failed', e);
      }
    }
  }

  Future<void> _pushMaintenanceSchedules() async {
    final rows = await db.maintenanceDao.getDirtySchedules();
    for (final row in rows) {
      try {
        await supabase.from('maintenance_schedules').upsert({
          'id': row.id,
          'bike_id': row.bikeId,
          'part_name': row.partName,
          'interval_km': row.intervalKm,
          'interval_months': row.intervalMonths,
          'last_service_date': row.lastServiceDate,
          'last_service_odo': row.lastServiceOdo,
          'is_active': row.isActive,
          'created_at': row.createdAt.toIso8601String(),
        });
        await db.maintenanceDao.markScheduleSynced(row.id);
      } catch (e) {
        AppLogger.e('Push schedule ${row.id} failed', e);
      }
    }
  }

  Future<void> _pushServiceHistory() async {
    final rows = await db.maintenanceDao.getDirtyHistory();
    for (final row in rows) {
      try {
        await supabase.from('service_history').upsert({
          'id': row.id,
          'bike_id': row.bikeId,
          'schedule_id': row.scheduleId,
          'service_date': row.serviceDate,
          'service_odo': row.serviceOdo,
          'cost': row.cost,
          'notes': row.notes,
          'created_at': row.createdAt.toIso8601String(),
        });
        await db.maintenanceDao.markHistorySynced(row.id);
      } catch (e) {
        AppLogger.e('Push service history ${row.id} failed', e);
      }
    }
  }

  Future<void> _pushNotifications() async {
    final rows = await db.notificationsDao.getDirtyRows();
    for (final row in rows) {
      try {
        await supabase.from('notifications').upsert({
          'id': row.id,
          'user_id': row.userId,
          'type': row.type,
          'title': row.title,
          'message': row.message,
          'read_at': row.readAt?.toIso8601String(),
          'dismissed_at': row.dismissedAt?.toIso8601String(),
          'created_at': row.createdAt.toIso8601String(),
          'bike_id': row.bikeId,
          'schedule_id': row.scheduleId,
          'source': row.source,
          'dedupe_key': row.dedupeKey,
        });
        await db.notificationsDao.markSynced(row.id);
      } catch (e) {
        AppLogger.e('Push notification ${row.id} failed', e);
      }
    }
  }

  // ── Pull ──────────────────────────────────────────────────────────

  Future<void> _pullRemoteChanges(String uid) async {
    await _pullBikes(uid);
    // Re-fetch bike IDs after pulling bikes (new bikes may have arrived)
    final updatedBikeIds = await db.bikesDao.getBikeIdsForUser(uid);

    await _pullRides(uid);
    await _pullFuelLogs(updatedBikeIds);
    await _pullMaintenanceLogs(updatedBikeIds);
    await _pullMaintenanceSchedules(updatedBikeIds);
    await _pullServiceHistory(updatedBikeIds);
    await _pullNotifications(uid);
  }

  String _lastSyncKey(String table) => 'last_sync_$table';

  String? _getLastSync(String table) => prefs.getString(_lastSyncKey(table));

  Future<void> _setLastSync(String table, String timestamp) =>
      prefs.setString(_lastSyncKey(table), timestamp);

  Future<void> _pullBikes(String uid) async {
    final lastSync = _getLastSync('bikes');
    var query = supabase.from('bikes').select().eq('user_id', uid);
    if (lastSync != null) {
      query = query.gt('created_at', lastSync);
    }
    final rows = await query;

    for (final row in rows) {
      final remoteModified = DateTime.parse(row['created_at'] as String);
      final local = await db.bikesDao.getById(row['id'] as String);

      if (local != null && !local.isSynced) {
        if (!shouldAcceptRemote(local.lastModified, remoteModified)) continue;
      }

      await db.bikesDao.upsert(
        BikesCompanion(
          id: Value(row['id'] as String),
          userId: Value(row['user_id'] as String),
          make: Value(row['make'] as String),
          model: Value(row['model'] as String),
          year: Value(row['year'] as int?),
          currentOdo: Value((row['current_odo'] as num).toDouble()),
          nickName: Value(row['nick_name'] as String?),
          imageUrl: Value(row['image_url'] as String?),
          specsEngine: Value(row['specs_engine'] as String?),
          specsPower: Value(row['specs_power'] as String?),
          avgMileage: Value((row['avg_mileage'] as num?)?.toDouble()),
          lastFuelPrice: Value((row['last_fuel_price'] as num?)?.toDouble()),
          createdAt: Value(remoteModified),
          isSynced: const Value(true),
          lastModified: Value(remoteModified),
        ),
      );
    }

    if (rows.isNotEmpty) {
      await _setLastSync('bikes', DateTime.now().toIso8601String());
    }
  }

  Future<void> _pullRides(String uid) async {
    final lastSync = _getLastSync('rides');

    // Use RPC for PostGIS → GeoJSON conversion
    List<dynamic> rows;
    try {
      var params = <String, dynamic>{'p_user_id': uid};
      if (lastSync != null) {
        params['p_since'] = lastSync;
      }
      rows = await supabase.rpc('get_rides_with_geojson', params: params);
    } catch (_) {
      // Fallback to regular select if RPC doesn't exist
      var query = supabase.from('rides').select().eq('user_id', uid);
      if (lastSync != null) {
        query = query.gt('created_at', lastSync);
      }
      rows = await query;
    }

    for (final row in rows) {
      final remoteModified = DateTime.parse(row['created_at'] as String);
      final local = await db.ridesDao.getById(row['id'] as String);

      if (local != null && !local.isSynced) {
        if (!shouldAcceptRemote(local.lastModified, remoteModified)) continue;
      }

      String? routePath;
      final rp = row['route_path'];
      if (rp != null) {
        routePath = rp is String ? rp : jsonEncode(rp);
      }

      await db.ridesDao.upsert(
        RidesCompanion(
          id: Value(row['id'] as String),
          bikeId: Value(row['bike_id'] as String),
          userId: Value(row['user_id'] as String),
          startTime: Value(DateTime.parse(row['start_time'] as String)),
          endTime: Value(
            row['end_time'] != null
                ? DateTime.parse(row['end_time'] as String)
                : null,
          ),
          distanceKm: Value((row['distance_km'] as num).toDouble()),
          maxLeanLeft: Value((row['max_lean_left'] as num?)?.toDouble()),
          maxLeanRight: Value((row['max_lean_right'] as num?)?.toDouble()),
          routePath: Value(routePath),
          rideName: Value(row['ride_name'] as String?),
          notes: Value(row['notes'] as String?),
          imageUrl: Value(row['image_url'] as String?),
          createdAt: Value(remoteModified),
          isSynced: const Value(true),
          lastModified: Value(remoteModified),
        ),
      );
    }

    if (rows.isNotEmpty) {
      await _setLastSync('rides', DateTime.now().toIso8601String());
    }
  }

  Future<void> _pullFuelLogs(List<String> bikeIds) async {
    if (bikeIds.isEmpty) return;
    final lastSync = _getLastSync('fuel_logs');
    var query = supabase
        .from('fuel_logs')
        .select()
        .inFilter('bike_id', bikeIds);
    if (lastSync != null) {
      query = query.gt('created_at', lastSync);
    }
    final rows = await query;

    for (final row in rows) {
      final remoteModified = DateTime.parse(row['created_at'] as String);
      final local = await db.fuelDao.getById(row['id'] as String);

      if (local != null && !local.isSynced) {
        if (!shouldAcceptRemote(local.lastModified, remoteModified)) continue;
      }

      await db.fuelDao.upsert(
        FuelLogsCompanion(
          id: Value(row['id'] as String),
          bikeId: Value(row['bike_id'] as String),
          odometer: Value((row['odometer'] as num).toDouble()),
          litres: Value((row['litres'] as num).toDouble()),
          pricePerLitre: Value((row['price_per_litre'] as num).toDouble()),
          totalCost: Value((row['total_cost'] as num).toDouble()),
          isFullTank: Value(row['is_full_tank'] as bool),
          date: Value(row['date'] as String),
          createdAt: Value(remoteModified),
          isSynced: const Value(true),
          lastModified: Value(remoteModified),
        ),
      );
    }

    if (rows.isNotEmpty) {
      await _setLastSync('fuel_logs', DateTime.now().toIso8601String());
    }
  }

  Future<void> _pullMaintenanceLogs(List<String> bikeIds) async {
    if (bikeIds.isEmpty) return;
    final lastSync = _getLastSync('maintenance_logs');
    var query = supabase
        .from('maintenance_logs')
        .select()
        .inFilter('bike_id', bikeIds);
    if (lastSync != null) {
      query = query.gt('created_at', lastSync);
    }
    final rows = await query;

    for (final row in rows) {
      final remoteModified = DateTime.parse(row['created_at'] as String);
      final local = await db.maintenanceDao.getLogById(row['id'] as String);

      if (local != null && !local.isSynced) {
        if (!shouldAcceptRemote(local.lastModified, remoteModified)) continue;
      }

      await db.maintenanceDao.upsertLog(
        MaintenanceLogsCompanion(
          id: Value(row['id'] as String),
          bikeId: Value(row['bike_id'] as String),
          serviceType: Value(row['service_type'] as String),
          odoAtService: Value((row['odo_at_service'] as num).toDouble()),
          datePerformed: Value(row['date_performed'] as String),
          notes: Value(row['notes'] as String?),
          receiptUrl: Value(row['receipt_url'] as String?),
          createdAt: Value(remoteModified),
          isSynced: const Value(true),
          lastModified: Value(remoteModified),
        ),
      );
    }

    if (rows.isNotEmpty) {
      await _setLastSync('maintenance_logs', DateTime.now().toIso8601String());
    }
  }

  Future<void> _pullMaintenanceSchedules(List<String> bikeIds) async {
    if (bikeIds.isEmpty) return;
    final lastSync = _getLastSync('maintenance_schedules');
    var query = supabase
        .from('maintenance_schedules')
        .select()
        .inFilter('bike_id', bikeIds);
    if (lastSync != null) {
      query = query.gt('created_at', lastSync);
    }
    final rows = await query;

    for (final row in rows) {
      final remoteModified = DateTime.parse(row['created_at'] as String);
      final local = await db.maintenanceDao.getScheduleById(
        row['id'] as String,
      );

      if (local != null && !local.isSynced) {
        if (!shouldAcceptRemote(local.lastModified, remoteModified)) continue;
      }

      await db.maintenanceDao.upsertSchedule(
        MaintenanceSchedulesCompanion(
          id: Value(row['id'] as String),
          bikeId: Value(row['bike_id'] as String),
          partName: Value(row['part_name'] as String),
          intervalKm: Value(row['interval_km'] as int),
          intervalMonths: Value(row['interval_months'] as int),
          lastServiceDate: Value(row['last_service_date'] as String?),
          lastServiceOdo: Value((row['last_service_odo'] as num?)?.toDouble()),
          isActive: Value(row['is_active'] as bool),
          createdAt: Value(remoteModified),
          isSynced: const Value(true),
          lastModified: Value(remoteModified),
        ),
      );
    }

    if (rows.isNotEmpty) {
      await _setLastSync(
        'maintenance_schedules',
        DateTime.now().toIso8601String(),
      );
    }
  }

  Future<void> _pullServiceHistory(List<String> bikeIds) async {
    if (bikeIds.isEmpty) return;
    final lastSync = _getLastSync('service_history');
    var query = supabase
        .from('service_history')
        .select()
        .inFilter('bike_id', bikeIds);
    if (lastSync != null) {
      query = query.gt('created_at', lastSync);
    }
    final rows = await query;

    for (final row in rows) {
      final remoteModified = DateTime.parse(row['created_at'] as String);
      final local = await db.maintenanceDao.getHistoryById(
        row['id'] as String,
      );

      if (local != null && !local.isSynced) {
        if (!shouldAcceptRemote(local.lastModified, remoteModified)) continue;
      }

      await db.maintenanceDao.upsertHistory(
        ServiceHistoryCompanion(
          id: Value(row['id'] as String),
          bikeId: Value(row['bike_id'] as String),
          scheduleId: Value(row['schedule_id'] as String),
          serviceDate: Value(row['service_date'] as String),
          serviceOdo: Value((row['service_odo'] as num).toDouble()),
          cost: Value((row['cost'] as num?)?.toDouble()),
          notes: Value(row['notes'] as String?),
          createdAt: Value(remoteModified),
          isSynced: const Value(true),
          lastModified: Value(remoteModified),
        ),
      );
    }

    if (rows.isNotEmpty) {
      await _setLastSync('service_history', DateTime.now().toIso8601String());
    }
  }

  Future<void> _pullNotifications(String uid) async {
    final lastSync = _getLastSync('notifications');
    var query = supabase.from('notifications').select().eq('user_id', uid);
    if (lastSync != null) {
      query = query.gt('created_at', lastSync);
    }
    final rows = await query;

    for (final row in rows) {
      final remoteModified = DateTime.parse(row['created_at'] as String);
      final local = await db.notificationsDao.getById(row['id'] as String);

      if (local != null && !local.isSynced) {
        if (!shouldAcceptRemote(local.lastModified, remoteModified)) continue;
      }

      await db.notificationsDao.upsert(
        NotificationsCompanion(
          id: Value(row['id'] as String),
          userId: Value(row['user_id'] as String),
          type: Value(row['type'] as String),
          title: Value(row['title'] as String?),
          message: Value(row['message'] as String),
          readAt: Value(
            row['read_at'] != null
                ? DateTime.parse(row['read_at'] as String)
                : null,
          ),
          dismissedAt: Value(
            row['dismissed_at'] != null
                ? DateTime.parse(row['dismissed_at'] as String)
                : null,
          ),
          createdAt: Value(remoteModified),
          bikeId: Value(row['bike_id'] as String?),
          scheduleId: Value(row['schedule_id'] as String?),
          source: Value(row['source'] as String?),
          dedupeKey: Value(row['dedupe_key'] as String?),
          isSynced: const Value(true),
          lastModified: Value(remoteModified),
        ),
      );
    }

    if (rows.isNotEmpty) {
      await _setLastSync('notifications', DateTime.now().toIso8601String());
    }
  }

  // ── Initial Sync ──────────────────────────────────────────────────

  /// Called on first login when local DB is empty.
  /// Pulls ALL user data without timestamp filters.
  Future<void> performInitialSync(String userId) async {
    _emit(_state.copyWith(status: SyncStatus.syncing));
    try {
      // Clear any stale last-sync timestamps
      for (final table in [
        'bikes',
        'rides',
        'fuel_logs',
        'maintenance_logs',
        'maintenance_schedules',
        'service_history',
        'notifications',
      ]) {
        await prefs.remove(_lastSyncKey(table));
      }

      await _pullRemoteChanges(userId);

      _emit(SyncState(status: SyncStatus.idle, lastSyncedAt: DateTime.now()));
    } catch (e, st) {
      AppLogger.e('Initial sync failed', e, st);
      _emit(
        _state.copyWith(status: SyncStatus.error, errorMessage: e.toString()),
      );
    }
  }

  /// Clear all sync timestamps (used on logout).
  Future<void> clearSyncTimestamps() async {
    for (final table in [
      'bikes',
      'rides',
      'fuel_logs',
      'maintenance_logs',
      'maintenance_schedules',
      'service_history',
      'notifications',
    ]) {
      await prefs.remove(_lastSyncKey(table));
    }
  }
}

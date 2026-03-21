import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';

import '../app_database.dart';
import '../tables/bikes_table.dart';
import '../tables/maintenance_logs_table.dart';
import '../tables/maintenance_schedules_table.dart';
import '../tables/service_history_table.dart';

part 'maintenance_dao.g.dart';

const _uuid = Uuid();

/// Default maintenance schedule templates for a new bike.
const _defaultSchedules = [
  {'partName': 'Engine Oil', 'intervalKm': 3000, 'intervalMonths': 6},
  {'partName': 'Air Filter', 'intervalKm': 6000, 'intervalMonths': 12},
  {'partName': 'Chain Lubrication', 'intervalKm': 500, 'intervalMonths': 1},
  {'partName': 'Chain Adjustment', 'intervalKm': 1000, 'intervalMonths': 3},
  {'partName': 'Brake Pads', 'intervalKm': 10000, 'intervalMonths': 12},
  {'partName': 'Coolant', 'intervalKm': 20000, 'intervalMonths': 24},
  {'partName': 'Spark Plug', 'intervalKm': 10000, 'intervalMonths': 12},
  {'partName': 'Tyres', 'intervalKm': 15000, 'intervalMonths': 24},
];

@DriftAccessor(
    tables: [MaintenanceLogs, MaintenanceSchedules, ServiceHistory, Bikes])
class MaintenanceDao extends DatabaseAccessor<AppDatabase>
    with _$MaintenanceDaoMixin {
  MaintenanceDao(super.db);

  // ── Maintenance Logs ──────────────────────────────────────────────

  Stream<List<MaintenanceLog>> watchLogsForBike(String bikeId) {
    return (select(maintenanceLogs)
          ..where((m) => m.bikeId.equals(bikeId))
          ..orderBy([(m) => OrderingTerm.desc(m.datePerformed)]))
        .watch();
  }

  Future<MaintenanceLog?> getLogById(String id) {
    return (select(maintenanceLogs)..where((m) => m.id.equals(id)))
        .getSingleOrNull();
  }

  Future<void> upsertLog(MaintenanceLogsCompanion entry) {
    return into(maintenanceLogs).insertOnConflictUpdate(entry);
  }

  Future<List<MaintenanceLog>> getDirtyLogs() {
    return (select(maintenanceLogs)
          ..where((m) => m.isSynced.equals(false)))
        .get();
  }

  Future<void> markLogSynced(String id) {
    return (update(maintenanceLogs)..where((m) => m.id.equals(id)))
        .write(const MaintenanceLogsCompanion(isSynced: Value(true)));
  }

  Future<int> deleteLogById(String id) {
    return (delete(maintenanceLogs)..where((m) => m.id.equals(id))).go();
  }

  /// Count maintenance logs for a bike (deletion guard).
  Future<int> countLogsForBike(String bikeId) async {
    final count = countAll();
    final query = selectOnly(maintenanceLogs)
      ..where(maintenanceLogs.bikeId.equals(bikeId))
      ..addColumns([count]);
    final result = await query.getSingle();
    return result.read(count)!;
  }

  // ── Maintenance Schedules ─────────────────────────────────────────

  Stream<List<MaintenanceSchedule>> watchSchedulesForBike(String bikeId) {
    return (select(maintenanceSchedules)
          ..where((s) => s.bikeId.equals(bikeId))
          ..orderBy([(s) => OrderingTerm.asc(s.partName)]))
        .watch();
  }

  Future<MaintenanceSchedule?> getScheduleById(String id) {
    return (select(maintenanceSchedules)..where((s) => s.id.equals(id)))
        .getSingleOrNull();
  }

  Future<void> upsertSchedule(MaintenanceSchedulesCompanion entry) {
    return into(maintenanceSchedules).insertOnConflictUpdate(entry);
  }

  Future<List<MaintenanceSchedule>> getDirtySchedules() {
    return (select(maintenanceSchedules)
          ..where((s) => s.isSynced.equals(false)))
        .get();
  }

  Future<void> markScheduleSynced(String id) {
    return (update(maintenanceSchedules)..where((s) => s.id.equals(id)))
        .write(
            const MaintenanceSchedulesCompanion(isSynced: Value(true)));
  }

  Future<int> deleteScheduleById(String id) {
    return (delete(maintenanceSchedules)..where((s) => s.id.equals(id))).go();
  }

  /// Create default maintenance schedules for a newly added bike.
  Future<void> initializeDefaultSchedules(String bikeId) async {
    final now = DateTime.now();
    await batch((b) {
      b.insertAll(
        maintenanceSchedules,
        _defaultSchedules.map((s) {
          return MaintenanceSchedulesCompanion.insert(
            id: _uuid.v4(),
            bikeId: bikeId,
            partName: s['partName'] as String,
            intervalKm: s['intervalKm'] as int,
            intervalMonths: s['intervalMonths'] as int,
            isActive: true,
            createdAt: now,
            isSynced: const Value(false),
            lastModified: now,
          );
        }).toList(),
      );
    });
  }

  // ── Service History ───────────────────────────────────────────────

  Stream<List<ServiceHistoryData>> watchHistoryForBike(String bikeId) {
    return (select(serviceHistory)
          ..where((h) => h.bikeId.equals(bikeId))
          ..orderBy([(h) => OrderingTerm.desc(h.serviceDate)]))
        .watch();
  }

  Stream<List<ServiceHistoryData>> watchHistoryForSchedule(
      String scheduleId) {
    return (select(serviceHistory)
          ..where((h) => h.scheduleId.equals(scheduleId))
          ..orderBy([(h) => OrderingTerm.desc(h.serviceDate)]))
        .watch();
  }

  Future<void> upsertHistory(ServiceHistoryCompanion entry) {
    return into(serviceHistory).insertOnConflictUpdate(entry);
  }

  Future<List<ServiceHistoryData>> getDirtyHistory() {
    return (select(serviceHistory)
          ..where((h) => h.isSynced.equals(false)))
        .get();
  }

  Future<void> markHistorySynced(String id) {
    return (update(serviceHistory)..where((h) => h.id.equals(id)))
        .write(const ServiceHistoryCompanion(isSynced: Value(true)));
  }

  Future<int> deleteHistoryById(String id) {
    return (delete(serviceHistory)..where((h) => h.id.equals(id))).go();
  }
}

import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import 'tables/bikes_table.dart';
import 'tables/rides_table.dart';
import 'tables/fuel_logs_table.dart';
import 'tables/maintenance_logs_table.dart';
import 'tables/maintenance_schedules_table.dart';
import 'tables/service_history_table.dart';
import 'tables/notifications_table.dart';

import 'daos/bikes_dao.dart';
import 'daos/rides_dao.dart';
import 'daos/fuel_dao.dart';
import 'daos/maintenance_dao.dart';
import 'daos/notifications_dao.dart';

part 'app_database.g.dart';

@DriftDatabase(
  tables: [
    Bikes,
    Rides,
    FuelLogs,
    MaintenanceLogs,
    MaintenanceSchedules,
    ServiceHistory,
    Notifications,
  ],
  daos: [BikesDao, RidesDao, FuelDao, MaintenanceDao, NotificationsDao],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.e);

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration =>
      MigrationStrategy(onCreate: (m) => m.createAll());

  /// Delete all rows from all tables (used on logout).
  Future<void> deleteAllData() async {
    await transaction(() async {
      for (final table in allTables) {
        await delete(table).go();
      }
    });
  }
}

/// Construct a database backed by a file in the app's documents directory.
Future<AppDatabase> constructDb() async {
  final dir = await getApplicationDocumentsDirectory();
  final file = File(p.join(dir.path, 'apex.sqlite'));
  return AppDatabase(NativeDatabase.createInBackground(file));
}

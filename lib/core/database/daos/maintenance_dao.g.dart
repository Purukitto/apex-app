// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_dao.dart';

// ignore_for_file: type=lint
mixin _$MaintenanceDaoMixin on DatabaseAccessor<AppDatabase> {
  $MaintenanceLogsTable get maintenanceLogs => attachedDatabase.maintenanceLogs;
  $MaintenanceSchedulesTable get maintenanceSchedules =>
      attachedDatabase.maintenanceSchedules;
  $ServiceHistoryTable get serviceHistory => attachedDatabase.serviceHistory;
  $BikesTable get bikes => attachedDatabase.bikes;
  MaintenanceDaoManager get managers => MaintenanceDaoManager(this);
}

class MaintenanceDaoManager {
  final _$MaintenanceDaoMixin _db;
  MaintenanceDaoManager(this._db);
  $$MaintenanceLogsTableTableManager get maintenanceLogs =>
      $$MaintenanceLogsTableTableManager(
        _db.attachedDatabase,
        _db.maintenanceLogs,
      );
  $$MaintenanceSchedulesTableTableManager get maintenanceSchedules =>
      $$MaintenanceSchedulesTableTableManager(
        _db.attachedDatabase,
        _db.maintenanceSchedules,
      );
  $$ServiceHistoryTableTableManager get serviceHistory =>
      $$ServiceHistoryTableTableManager(
        _db.attachedDatabase,
        _db.serviceHistory,
      );
  $$BikesTableTableManager get bikes =>
      $$BikesTableTableManager(_db.attachedDatabase, _db.bikes);
}

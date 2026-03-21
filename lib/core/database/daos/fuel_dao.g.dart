// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'fuel_dao.dart';

// ignore_for_file: type=lint
mixin _$FuelDaoMixin on DatabaseAccessor<AppDatabase> {
  $FuelLogsTable get fuelLogs => attachedDatabase.fuelLogs;
  $BikesTable get bikes => attachedDatabase.bikes;
  FuelDaoManager get managers => FuelDaoManager(this);
}

class FuelDaoManager {
  final _$FuelDaoMixin _db;
  FuelDaoManager(this._db);
  $$FuelLogsTableTableManager get fuelLogs =>
      $$FuelLogsTableTableManager(_db.attachedDatabase, _db.fuelLogs);
  $$BikesTableTableManager get bikes =>
      $$BikesTableTableManager(_db.attachedDatabase, _db.bikes);
}

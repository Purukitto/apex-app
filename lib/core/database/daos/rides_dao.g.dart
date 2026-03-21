// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'rides_dao.dart';

// ignore_for_file: type=lint
mixin _$RidesDaoMixin on DatabaseAccessor<AppDatabase> {
  $RidesTable get rides => attachedDatabase.rides;
  RidesDaoManager get managers => RidesDaoManager(this);
}

class RidesDaoManager {
  final _$RidesDaoMixin _db;
  RidesDaoManager(this._db);
  $$RidesTableTableManager get rides =>
      $$RidesTableTableManager(_db.attachedDatabase, _db.rides);
}

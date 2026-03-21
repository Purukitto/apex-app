// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bikes_dao.dart';

// ignore_for_file: type=lint
mixin _$BikesDaoMixin on DatabaseAccessor<AppDatabase> {
  $BikesTable get bikes => attachedDatabase.bikes;
  BikesDaoManager get managers => BikesDaoManager(this);
}

class BikesDaoManager {
  final _$BikesDaoMixin _db;
  BikesDaoManager(this._db);
  $$BikesTableTableManager get bikes =>
      $$BikesTableTableManager(_db.attachedDatabase, _db.bikes);
}

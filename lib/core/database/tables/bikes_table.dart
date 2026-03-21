import 'package:drift/drift.dart';

class Bikes extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get make => text()();
  TextColumn get model => text()();
  IntColumn get year => integer().nullable()();
  RealColumn get currentOdo => real().withDefault(const Constant(0.0))();
  TextColumn get nickName => text().nullable()();
  TextColumn get imageUrl => text().nullable()();
  TextColumn get specsEngine => text().nullable()();
  TextColumn get specsPower => text().nullable()();
  RealColumn get avgMileage => real().nullable()();
  RealColumn get lastFuelPrice => real().nullable()();
  DateTimeColumn get createdAt => dateTime()();

  // Sync metadata
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get lastModified => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

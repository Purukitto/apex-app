import 'package:drift/drift.dart';

class Rides extends Table {
  TextColumn get id => text()();
  TextColumn get bikeId => text()();
  TextColumn get userId => text()();
  DateTimeColumn get startTime => dateTime()();
  DateTimeColumn get endTime => dateTime().nullable()();
  RealColumn get distanceKm => real()();
  RealColumn get maxLeanLeft => real().nullable()();
  RealColumn get maxLeanRight => real().nullable()();
  TextColumn get routePath => text().nullable()(); // GeoJSON text
  TextColumn get rideName => text().nullable()();
  TextColumn get notes => text().nullable()();
  TextColumn get imageUrl => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();

  // Sync metadata
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get lastModified => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

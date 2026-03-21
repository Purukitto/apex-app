import 'package:drift/drift.dart';

class MaintenanceSchedules extends Table {
  TextColumn get id => text()();
  TextColumn get bikeId => text()();
  TextColumn get partName => text()();
  IntColumn get intervalKm => integer()();
  IntColumn get intervalMonths => integer()();
  TextColumn get lastServiceDate => text().nullable()(); // YYYY-MM-DD
  RealColumn get lastServiceOdo => real().nullable()();
  BoolColumn get isActive => boolean()();
  DateTimeColumn get createdAt => dateTime()();

  // Sync metadata
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get lastModified => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

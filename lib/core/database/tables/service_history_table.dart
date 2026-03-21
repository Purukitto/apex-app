import 'package:drift/drift.dart';

class ServiceHistory extends Table {
  TextColumn get id => text()();
  TextColumn get bikeId => text()();
  TextColumn get scheduleId => text()();
  TextColumn get serviceDate => text()(); // YYYY-MM-DD
  RealColumn get serviceOdo => real()();
  RealColumn get cost => real().nullable()();
  TextColumn get notes => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();

  // Sync metadata
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get lastModified => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

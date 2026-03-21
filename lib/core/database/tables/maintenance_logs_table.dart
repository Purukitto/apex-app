import 'package:drift/drift.dart';

class MaintenanceLogs extends Table {
  TextColumn get id => text()();
  TextColumn get bikeId => text()();
  TextColumn get serviceType => text()();
  RealColumn get odoAtService => real()();
  TextColumn get datePerformed => text()(); // YYYY-MM-DD
  TextColumn get notes => text().nullable()();
  TextColumn get receiptUrl => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();

  // Sync metadata
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get lastModified => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

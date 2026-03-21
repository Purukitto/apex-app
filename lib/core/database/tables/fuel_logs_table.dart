import 'package:drift/drift.dart';

class FuelLogs extends Table {
  TextColumn get id => text()();
  TextColumn get bikeId => text()();
  RealColumn get odometer => real()();
  RealColumn get litres => real()();
  RealColumn get pricePerLitre => real()();
  RealColumn get totalCost => real()();
  BoolColumn get isFullTank => boolean()();
  TextColumn get date => text()(); // YYYY-MM-DD
  DateTimeColumn get createdAt => dateTime()();

  // Sync metadata
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get lastModified => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

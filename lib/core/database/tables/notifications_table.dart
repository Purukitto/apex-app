import 'package:drift/drift.dart';

class Notifications extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get type => text()(); // 'warning', 'error', 'info'
  TextColumn get title => text().nullable()();
  TextColumn get message => text()();
  DateTimeColumn get readAt => dateTime().nullable()();
  DateTimeColumn get dismissedAt => dateTime().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  TextColumn get bikeId => text().nullable()();
  TextColumn get scheduleId => text().nullable()();
  TextColumn get source => text().nullable()();
  TextColumn get dedupeKey => text().nullable()();

  // Sync metadata
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get lastModified => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

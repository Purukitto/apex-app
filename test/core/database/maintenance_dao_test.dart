import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:apex/core/database/app_database.dart';

void main() {
  late AppDatabase db;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
  });

  tearDown(() async {
    await db.close();
  });

  group('MaintenanceDao.updateScheduleServiceInfo', () {
    const bikeId = 'bike-1';
    const scheduleId = 'sched-1';
    final created = DateTime(2026, 1, 1);

    Future<void> insertSchedule() => db.maintenanceDao.upsertSchedule(
      MaintenanceSchedulesCompanion.insert(
        id: scheduleId,
        bikeId: bikeId,
        partName: 'Chain Lube',
        intervalKm: 500,
        intervalMonths: 1,
        isActive: true,
        createdAt: created,
        isSynced: const Value(true),
        lastModified: created,
      ),
    );

    test('updates service fields without touching other columns', () async {
      await insertSchedule();

      final updated = DateTime(2026, 4, 26);
      await db.maintenanceDao.updateScheduleServiceInfo(
        scheduleId,
        lastServiceDate: '2026-04-26',
        lastServiceOdo: 17300,
        lastModified: updated,
      );

      final row = await db.maintenanceDao.getScheduleById(scheduleId);
      expect(row, isNotNull);
      expect(row!.lastServiceDate, '2026-04-26');
      expect(row.lastServiceOdo, 17300);
      expect(row.isSynced, false);
      expect(row.lastModified, updated);
      // Verify non-service columns are untouched
      expect(row.partName, 'Chain Lube');
      expect(row.intervalKm, 500);
      expect(row.bikeId, bikeId);
    });

    test('does not throw when schedule id does not exist', () async {
      // Regression: old code used insertOnConflictUpdate with a partial
      // companion; SQLite's NOT NULL check on absent columns fired before the
      // PK conflict could redirect to DO UPDATE SET, causing a crash.
      expect(
        () => db.maintenanceDao.updateScheduleServiceInfo(
          'nonexistent-id',
          lastServiceDate: '2026-04-26',
          lastServiceOdo: 17300,
          lastModified: DateTime(2026, 4, 26),
        ),
        returnsNormally,
      );
    });
  });
}

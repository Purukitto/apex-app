import 'package:flutter_test/flutter_test.dart';
import 'package:apex/core/utils/fuel_calculations.dart';

void main() {
  FuelLogEntry makeLog({
    required double odometer,
    double litres = 5.0,
    double pricePerLitre = 100.0,
    bool isFullTank = true,
    String date = '2026-03-01',
  }) {
    return FuelLogEntry(
      odometer: odometer,
      litres: litres,
      pricePerLitre: pricePerLitre,
      isFullTank: isFullTank,
      date: date,
      createdAt: DateTime.parse(date),
    );
  }

  group('calculateMileage', () {
    test('returns null with fewer than 2 full tank logs', () {
      expect(calculateMileage([]), isNull);
      expect(calculateMileage([makeLog(odometer: 100)]), isNull);
    });

    test('calculates mileage from two full tank logs', () {
      final logs = [
        makeLog(odometer: 100, litres: 5.0),
        makeLog(odometer: 300, litres: 4.0),
      ];
      // (300 - 100) / 4.0 = 50.0 km/l
      expect(calculateMileage(logs), 50.0);
    });

    test('averages across multiple consecutive pairs', () {
      final logs = [
        makeLog(odometer: 100, litres: 5.0),
        makeLog(odometer: 300, litres: 4.0),
        makeLog(odometer: 500, litres: 5.0),
      ];
      // pair 1: (500 - 300) / 5.0 = 40.0
      // pair 2: (300 - 100) / 4.0 = 50.0
      // avg: (40.0 + 50.0) / 2 = 45.0
      expect(calculateMileage(logs), 45.0);
    });

    test('ignores non-full-tank logs', () {
      final logs = [
        makeLog(odometer: 100),
        makeLog(odometer: 200, isFullTank: false),
        makeLog(odometer: 350, litres: 5.0),
      ];
      // Uses odometer 100 and 350, litres 5.0
      // (350 - 100) / 5.0 = 50.0
      expect(calculateMileage(logs), 50.0);
    });

    test('returns null if litres is 0', () {
      final logs = [makeLog(odometer: 100), makeLog(odometer: 300, litres: 0)];
      expect(calculateMileage(logs), isNull);
    });

    test('returns null for unrealistic mileage (>1000)', () {
      final logs = [
        makeLog(odometer: 0),
        makeLog(odometer: 10000, litres: 1.0),
      ];
      expect(calculateMileage(logs), isNull);
    });

    test('rounds to 2 decimal places', () {
      final logs = [
        makeLog(odometer: 100),
        makeLog(odometer: 233, litres: 3.0),
      ];
      // (233 - 100) / 3.0 = 44.333...
      expect(calculateMileage(logs), 44.33);
    });

    test('uses only last 10 full-tank logs', () {
      // Create 12 full-tank logs; oldest 2 should be ignored
      final logs = List.generate(
        12,
        (i) => makeLog(odometer: (i + 1) * 100.0, litres: 5.0),
      );
      // Last 10 by odo desc: 1200, 1100, ..., 300
      // Each pair: (next - prev) / litres = 100 / 5 = 20.0
      // Average of 9 pairs all equal to 20.0 → 20.0
      expect(calculateMileage(logs), 20.0);
    });
  });

  group('getLastFuelPrice', () {
    test('returns null for empty list', () {
      expect(getLastFuelPrice([]), isNull);
    });

    test('returns the most recent fuel price', () {
      final logs = [
        makeLog(odometer: 100, pricePerLitre: 95.0, date: '2026-01-01'),
        makeLog(odometer: 200, pricePerLitre: 100.0, date: '2026-02-01'),
        makeLog(odometer: 300, pricePerLitre: 105.0, date: '2026-03-01'),
      ];
      expect(getLastFuelPrice(logs), 105.0);
    });

    test('sorts by date then createdAt', () {
      final logs = [
        FuelLogEntry(
          odometer: 100,
          litres: 5,
          pricePerLitre: 90.0,
          isFullTank: true,
          date: '2026-03-01',
          createdAt: DateTime.parse('2026-03-01T08:00:00'),
        ),
        FuelLogEntry(
          odometer: 200,
          litres: 5,
          pricePerLitre: 95.0,
          isFullTank: true,
          date: '2026-03-01',
          createdAt: DateTime.parse('2026-03-01T18:00:00'),
        ),
      ];
      expect(getLastFuelPrice(logs), 95.0);
    });
  });
}

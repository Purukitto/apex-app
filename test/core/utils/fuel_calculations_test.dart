import 'package:flutter_test/flutter_test.dart';
import 'package:apex/core/utils/fuel_calculations.dart';

void main() {
  FuelLogEntry _log({
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
      expect(calculateMileage([_log(odometer: 100)]), isNull);
    });

    test('calculates mileage from two full tank logs', () {
      final logs = [
        _log(odometer: 100, litres: 5.0),
        _log(odometer: 300, litres: 4.0),
      ];
      // (300 - 100) / 4.0 = 50.0 km/l
      expect(calculateMileage(logs), 50.0);
    });

    test('ignores non-full-tank logs', () {
      final logs = [
        _log(odometer: 100),
        _log(odometer: 200, isFullTank: false),
        _log(odometer: 350, litres: 5.0),
      ];
      // Uses odometer 100 and 350, litres 5.0
      // (350 - 100) / 5.0 = 50.0
      expect(calculateMileage(logs), 50.0);
    });

    test('returns null if litres is 0', () {
      final logs = [
        _log(odometer: 100),
        _log(odometer: 300, litres: 0),
      ];
      expect(calculateMileage(logs), isNull);
    });

    test('returns null for unrealistic mileage (>1000)', () {
      final logs = [
        _log(odometer: 0),
        _log(odometer: 10000, litres: 1.0),
      ];
      expect(calculateMileage(logs), isNull);
    });

    test('rounds to 2 decimal places', () {
      final logs = [
        _log(odometer: 100),
        _log(odometer: 233, litres: 3.0),
      ];
      // (233 - 100) / 3.0 = 44.333...
      expect(calculateMileage(logs), 44.33);
    });
  });

  group('getLastFuelPrice', () {
    test('returns null for empty list', () {
      expect(getLastFuelPrice([]), isNull);
    });

    test('returns the most recent fuel price', () {
      final logs = [
        _log(odometer: 100, pricePerLitre: 95.0, date: '2026-01-01'),
        _log(odometer: 200, pricePerLitre: 100.0, date: '2026-02-01'),
        _log(odometer: 300, pricePerLitre: 105.0, date: '2026-03-01'),
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

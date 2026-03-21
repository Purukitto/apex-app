// Fuel calculation utilities — ported from React's fuelCalculations.ts.
// These must match the React implementation exactly.

/// A minimal fuel log representation for calculations.
class FuelLogEntry {
  const FuelLogEntry({
    required this.odometer,
    required this.litres,
    required this.pricePerLitre,
    required this.isFullTank,
    required this.date,
    required this.createdAt,
  });

  final double odometer;
  final double litres;
  final double pricePerLitre;
  final bool isFullTank;
  final String date; // YYYY-MM-DD
  final DateTime createdAt;
}

/// Calculate average mileage from full tank logs.
///
/// Formula: (LogB.odometer - LogA.odometer) / LogB.litres
/// where LogA and LogB are the last two consecutive full tank logs
/// sorted by odometer descending.
double? calculateMileage(List<FuelLogEntry> fuelLogs) {
  // Filter to only full tank logs, sorted by odometer descending
  final fullTankLogs = fuelLogs.where((log) => log.isFullTank).toList()
    ..sort((a, b) => b.odometer.compareTo(a.odometer));

  if (fullTankLogs.length < 2) {
    return null;
  }

  final logB = fullTankLogs[0]; // Most recent
  final logA = fullTankLogs[1]; // Previous

  if (logB.litres == 0) {
    return null;
  }

  final mileage = (logB.odometer - logA.odometer) / logB.litres;

  // Return null if result is invalid (negative or unrealistic)
  if (mileage <= 0 || mileage > 1000) {
    return null;
  }

  // Round to 2 decimal places
  return (mileage * 100).roundToDouble() / 100;
}

/// Get the most recent fuel price from fuel logs.
///
/// Sorts by date descending, then by createdAt descending.
double? getLastFuelPrice(List<FuelLogEntry> fuelLogs) {
  if (fuelLogs.isEmpty) {
    return null;
  }

  final sortedLogs = List<FuelLogEntry>.from(fuelLogs)
    ..sort((a, b) {
      final dateCompare = b.date.compareTo(a.date);
      if (dateCompare != 0) return dateCompare;
      return b.createdAt.compareTo(a.createdAt);
    });

  return sortedLogs.first.pricePerLitre;
}

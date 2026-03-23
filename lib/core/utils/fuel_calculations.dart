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

/// Calculate average mileage from the last 10 full-tank fill-ups.
///
/// Uses consecutive full-tank pairs: km/l = (odoB - odoA) / litresB.
/// Averages across all valid pairs within the last 10 full-tank logs.
double? calculateMileage(List<FuelLogEntry> fuelLogs) {
  // Filter to only full tank logs, sorted by odometer descending, take last 10
  final fullTankLogs = fuelLogs.where((log) => log.isFullTank).toList()
    ..sort((a, b) => b.odometer.compareTo(a.odometer));

  final recent = fullTankLogs.take(10).toList();

  if (recent.length < 2) {
    return null;
  }

  double totalMileage = 0;
  int validPairs = 0;

  for (int i = 0; i < recent.length - 1; i++) {
    final logB = recent[i];
    final logA = recent[i + 1];

    if (logB.litres == 0) continue;

    final mileage = (logB.odometer - logA.odometer) / logB.litres;

    // Skip invalid pairs (negative or unrealistic)
    if (mileage <= 0 || mileage > 1000) continue;

    totalMileage += mileage;
    validPairs++;
  }

  if (validPairs == 0) return null;

  // Round to 2 decimal places
  return ((totalMileage / validPairs) * 100).roundToDouble() / 100;
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

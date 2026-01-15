import type { FuelLog } from '../types/database';

/**
 * Calculate average mileage from full tank logs
 * Formula: (LogB.odometer - LogA.odometer) / LogB.litres
 * where LogA and LogB are the last two consecutive full tank logs
 */
export function calculateMileage(fuelLogs: FuelLog[]): number | null {
  // Filter to only full tank logs, sorted by odometer descending
  const fullTankLogs = fuelLogs
    .filter((log) => log.is_full_tank)
    .sort((a, b) => b.odometer - a.odometer);

  if (fullTankLogs.length < 2) {
    // Need at least 2 full tank logs to calculate mileage
    return null;
  }

  // Get the last two consecutive full tank logs
  const logB = fullTankLogs[0]; // Most recent
  const logA = fullTankLogs[1]; // Previous

  if (!logA || !logB || logB.litres === 0) {
    return null;
  }

  // Calculate mileage: (distance between refuels) / (litres in second refuel)
  const mileage = (logB.odometer - logA.odometer) / logB.litres;

  // Return null if result is invalid (negative or unrealistic)
  if (mileage <= 0 || mileage > 1000) {
    // 1000 km/L is unrealistic, likely a data error
    return null;
  }

  return Math.round(mileage * 100) / 100; // Round to 2 decimal places
}

/**
 * Get the most recent fuel price from fuel logs
 */
export function getLastFuelPrice(fuelLogs: FuelLog[]): number | null {
  if (fuelLogs.length === 0) {
    return null;
  }

  // Sort by date descending, then by created_at descending
  const sortedLogs = [...fuelLogs].sort((a, b) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return sortedLogs[0]?.price_per_litre ?? null;
}

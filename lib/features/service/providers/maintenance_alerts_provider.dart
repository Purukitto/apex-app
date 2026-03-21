import 'dart:math' as math;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/app_database.dart';
import '../../garage/providers/bikes_provider.dart';
import 'service_provider.dart';

/// A maintenance schedule that needs attention.
class MaintenanceAlert {
  const MaintenanceAlert({
    required this.schedule,
    required this.bike,
    required this.healthPercent,
  });

  final MaintenanceSchedule schedule;
  final Bike bike;
  final double healthPercent;
}

/// Calculates health percentage for a maintenance schedule.
double calculateHealth({
  required MaintenanceSchedule schedule,
  required double currentOdo,
}) {
  final kmUsed =
      math.max(0.0, currentOdo - (schedule.lastServiceOdo ?? 0));
  final kmHealth = 100.0 - (kmUsed / schedule.intervalKm) * 100.0;

  double timeHealth = 100.0;
  if (schedule.intervalMonths > 0) {
    if (schedule.lastServiceDate != null) {
      final lastDate = DateTime.tryParse(schedule.lastServiceDate!);
      if (lastDate != null) {
        final daysSince = DateTime.now().difference(lastDate).inDays;
        final monthsUsed = daysSince / 30.44;
        timeHealth = 100.0 - (monthsUsed / schedule.intervalMonths) * 100.0;
      }
    } else {
      // Never serviced with a time-based interval → 0%
      return 0.0;
    }
  }

  return math.min(kmHealth, timeHealth).clamp(0.0, 100.0);
}

/// Watches all bikes' schedules and returns alerts for health < 60%.
final maintenanceAlertsProvider = Provider<List<MaintenanceAlert>>((ref) {
  final bikesAsync = ref.watch(bikesStreamProvider);
  final bikes = bikesAsync.value;

  if (bikes == null || bikes.isEmpty) return [];

  final alerts = <MaintenanceAlert>[];
  for (final bike in bikes) {
    final schedulesAsync = ref.watch(schedulesStreamProvider(bike.id));
    final schedules = schedulesAsync.value;
    if (schedules == null) continue;

    for (final schedule in schedules) {
      if (!schedule.isActive) continue;
      final health = calculateHealth(
        schedule: schedule,
        currentOdo: bike.currentOdo,
      );
      if (health < 60.0) {
        alerts.add(MaintenanceAlert(
          schedule: schedule,
          bike: bike,
          healthPercent: health,
        ));
      }
    }
  }

  // Sort by health ascending (worst first)
  alerts.sort((a, b) => a.healthPercent.compareTo(b.healthPercent));
  return alerts;
});

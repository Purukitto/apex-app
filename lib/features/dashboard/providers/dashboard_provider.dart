import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/database/app_database.dart';
import '../../../core/providers/database_provider.dart';
import '../../garage/providers/bikes_provider.dart';

class DashboardStats {
  const DashboardStats({
    required this.riderName,
    required this.totalDistanceKm,
    required this.bikeCount,
    required this.rideCount,
  });

  final String riderName;
  final double totalDistanceKm;
  final int bikeCount;
  final int rideCount;
}

/// Aggregated dashboard stats.
final dashboardStatsProvider = FutureProvider<DashboardStats>((ref) async {
  final db = ref.read(databaseProvider);
  final user = Supabase.instance.client.auth.currentUser;
  final uid = user?.id;
  if (uid == null) {
    return const DashboardStats(
      riderName: 'Rider',
      totalDistanceKm: 0,
      bikeCount: 0,
      rideCount: 0,
    );
  }

  final bikes = ref.watch(bikesStreamProvider).value ?? [];

  final results = await Future.wait([
    db.ridesDao.totalDistanceForUser(uid),
    db.ridesDao.countForUser(uid),
  ]);

  final name =
      user?.userMetadata?['display_name'] as String? ??
      user?.email?.split('@').first ??
      'Rider';

  return DashboardStats(
    riderName: name,
    totalDistanceKm: results[0] as double,
    bikeCount: bikes.length,
    rideCount: results[1] as int,
  );
});

/// Recent rides for dashboard (last 5).
final recentRidesProvider = StreamProvider<List<Ride>>((ref) {
  final db = ref.watch(databaseProvider);
  final uid = Supabase.instance.client.auth.currentUser?.id;
  if (uid == null) return const Stream.empty();
  return db.ridesDao.watchRecentForUser(uid, limit: 5);
});

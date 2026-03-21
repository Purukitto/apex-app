import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/database/app_database.dart';
import '../../../core/providers/sync_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/format_utils.dart';
import '../../../core/utils/geojson_parser.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/mesh_background.dart';
import '../../../core/widgets/pressable_glass_card.dart';
import '../../../core/widgets/ride_map.dart';
import '../../../core/widgets/user_avatar.dart';
import '../../../core/widgets/shimmer_loader.dart';
import '../../garage/providers/bikes_provider.dart';
import '../../notifications/presentation/widgets/notification_bell.dart';
import '../../rides/presentation/widgets/ride_detail_sheet.dart';
import '../providers/dashboard_provider.dart';
import 'widgets/maintenance_alert_card.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dashboardStatsProvider);
    final recentAsync = ref.watch(recentRidesProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: MeshBackground(
        child: SafeArea(
          bottom: false,
          child: RefreshIndicator(
            color: context.accent,
            backgroundColor: AppColors.backgroundDark,
            onRefresh: () async {
              final engine = ref.read(syncEngineProvider);
              await engine.syncAll();
              ref.invalidate(dashboardStatsProvider);
            },
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                    child: _buildContent(context, ref, statsAsync, recentAsync),
                  ),
                ),
                const SliverToBoxAdapter(
                  child: SizedBox(height: 120),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<DashboardStats> statsAsync,
    AsyncValue<List<Ride>> recentAsync,
  ) {
    return statsAsync.when(
      loading: () => const DashboardShimmer(),
      error: (e, _) => Center(
        child: Text('Error loading dashboard', style: AppTypography.interSecondary),
      ),
      data: (stats) {
        final recentRides = recentAsync.value ?? [];
        final bikes = ref.watch(bikesStreamProvider).value ?? [];

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row with notification bell
            Row(
              children: [
                const Spacer(),
                const NotificationBell(),
                const SizedBox(width: 8),
                UserAvatar(name: stats.riderName),
              ],
            ),
            const SizedBox(height: 8),

            // Welcome card
            _WelcomeCard(stats: stats)
                .animate()
                .fadeIn(duration: 500.ms)
                .slideY(begin: 0.1, end: 0, duration: 500.ms),

            const SizedBox(height: 16),

            // Stats row
            Row(
              children: [
                Expanded(
                  child: _TappableStatCard(
                    label: 'Bikes',
                    value: '${stats.bikeCount}',
                    onTap: () => context.go('/garage'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _TappableStatCard(
                    label: 'Rides',
                    value: '${stats.rideCount}',
                    onTap: () => context.go('/rides'),
                  ),
                ),
              ],
            )
                .animate()
                .fadeIn(duration: 500.ms, delay: 100.ms)
                .slideY(begin: 0.1, end: 0, duration: 500.ms, delay: 100.ms),

            const SizedBox(height: 16),

            // Maintenance alerts
            const MaintenanceAlertCard()
                .animate()
                .fadeIn(duration: 500.ms, delay: 150.ms)
                .slideY(begin: 0.1, end: 0, duration: 500.ms, delay: 150.ms),

            const SizedBox(height: 16),

            // Last ride card
            if (recentRides.isNotEmpty)
              _LastRideCard(
                ride: recentRides.first,
                bikes: bikes,
              )
                  .animate()
                  .fadeIn(duration: 500.ms, delay: 200.ms)
                  .slideY(begin: 0.1, end: 0, duration: 500.ms, delay: 200.ms),
          ],
        );
      },
    );
  }
}

class _WelcomeCard extends StatelessWidget {
  const _WelcomeCard({required this.stats});

  final DashboardStats stats;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      isAccent: true,
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome back,',
            style: AppTypography.interSecondary.copyWith(fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            stats.riderName,
            style: AppTypography.playfairDisplay.copyWith(fontSize: 28),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Icon(Icons.straighten, size: 16, color: context.accent),
              const SizedBox(width: 8),
              Text(
                '${stats.totalDistanceKm.toStringAsFixed(0)} km',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 20,
                  fontWeight: FontWeight.w400,
                  color: context.accent,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                'total',
                style: AppTypography.interSecondary.copyWith(fontSize: 14),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TappableStatCard extends StatelessWidget {
  const _TappableStatCard({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return PressableGlassCard(
      onTap: onTap,
      padding: const EdgeInsets.all(20),
      borderRadius: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTypography.interLabel),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 32,
              fontWeight: FontWeight.w400,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _LastRideCard extends StatelessWidget {
  const _LastRideCard({required this.ride, required this.bikes});

  final Ride ride;
  final List<Bike> bikes;

  String? get _bikeName {
    try {
      final bike = bikes.firstWhere((b) => b.id == ride.bikeId);
      return bike.nickName ?? '${bike.make} ${bike.model}';
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final routeData = parseRoutePath(ride.routePath);
    final displayName = ride.rideName ?? _bikeName ?? 'Last Ride';

    return PressableGlassCard(
      onTap: () => RideDetailSheet.show(context, ride, bikeName: _bikeName),
      padding: const EdgeInsets.all(20),
      borderRadius: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Last Ride', style: AppTypography.interLabel),
          const SizedBox(height: 12),
          Text(
            displayName,
            style: AppTypography.inter.copyWith(
              fontWeight: FontWeight.w400,
              fontSize: 18,
            ),
          ),
          if (_bikeName != null && ride.rideName != null) ...[
            const SizedBox(height: 2),
            Text(_bikeName!, style: AppTypography.interMuted.copyWith(fontSize: 12)),
          ],
          const SizedBox(height: 12),

          // Stats
          Row(
            children: [
              _MiniStat(Icons.straighten,
                  '${ride.distanceKm.toStringAsFixed(1)} km'),
              const SizedBox(width: 16),
              _MiniStat(Icons.timer_outlined,
                  formatDuration(ride.startTime, ride.endTime)),
              if (ride.maxLeanLeft != null) ...[
                const SizedBox(width: 16),
                _MiniStat(Icons.rotate_left,
                    '${ride.maxLeanLeft!.toStringAsFixed(0)}°'),
              ],
            ],
          ),

          // Mini map
          if (routeData != null && routeData.hasRoute) ...[
            const SizedBox(height: 16),
            RideMap(
              routeData: routeData,
              height: 220,
              interactive: false,
              borderRadius: 14,
            ),
          ],
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat(this.icon, this.value);

  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textMuted),
        const SizedBox(width: 4),
        Text(
          value,
          style: AppTypography.jetBrainsMonoSmall.copyWith(
            color: AppColors.textSecondary,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}

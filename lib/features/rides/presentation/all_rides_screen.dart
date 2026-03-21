import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/app_database.dart';
import '../../../core/providers/sync_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/mesh_background.dart';
import '../../../core/widgets/shimmer_loader.dart';
import '../../garage/providers/bikes_provider.dart';
import '../providers/rides_provider.dart';
import 'widgets/ride_detail_sheet.dart';
import 'widgets/ride_list_tile.dart';

class AllRidesScreen extends ConsumerStatefulWidget {
  const AllRidesScreen({super.key});

  @override
  ConsumerState<AllRidesScreen> createState() => _AllRidesScreenState();
}

class _AllRidesScreenState extends ConsumerState<AllRidesScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(ridesListProvider.notifier).loadMore();
    }
  }

  String? _bikeName(List<Bike> bikes, String bikeId) {
    try {
      final bike = bikes.firstWhere((b) => b.id == bikeId);
      return bike.nickName ?? '${bike.make} ${bike.model}';
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final ridesState = ref.watch(ridesListProvider);
    final bikesAsync = ref.watch(bikesStreamProvider);
    final bikes = bikesAsync.value ?? [];

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: MeshBackground(
        child: SafeArea(
          bottom: false,
          child: ridesState.rides.isEmpty && ridesState.isLoading
              ? _buildShimmer()
              : ridesState.rides.isEmpty && !ridesState.isLoading
                  ? _buildEmptyState()
                  : _buildList(ref, ridesState, bikes),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.route_outlined, color: context.accent, size: 64),
            const SizedBox(height: 24),
            Text('No rides recorded yet', style: AppTypography.playfairDisplay),
            const SizedBox(height: 12),
            Text(
              'Hit the Ride button to start recording your first ride.',
              style: AppTypography.interSecondary,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Ride History', style: AppTypography.playfairDisplay),
          const SizedBox(height: 16),
          const RidesShimmer(),
        ],
      ),
    );
  }

  Widget _buildList(WidgetRef ref, RidesListState ridesState, List<Bike> bikes) {
    return RefreshIndicator(
      color: context.accent,
      backgroundColor: AppColors.backgroundDark,
      onRefresh: () async {
        final engine = ref.read(syncEngineProvider);
        await engine.syncAll();
        ref.invalidate(ridesListProvider);
      },
      child: CustomScrollView(
      controller: _scrollController,
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        // Header
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
            child: Row(
              children: [
                Text('Ride History', style: AppTypography.playfairDisplay),
                const Spacer(),
                Text(
                  '${ridesState.rides.length} rides',
                  style: AppTypography.interSecondary,
                ),
              ],
            ),
          ),
        ),

        // Ride list
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final ride = ridesState.rides[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: RideListTile(
                    ride: ride,
                    bikeName: _bikeName(bikes, ride.bikeId),
                    onTap: () => RideDetailSheet.show(
                      context,
                      ride,
                      bikeName: _bikeName(bikes, ride.bikeId),
                    ),
                  ),
                )
                    .animate()
                    .fadeIn(duration: 400.ms, delay: (60 * index).ms)
                    .slideY(
                      begin: 0.08,
                      end: 0,
                      duration: 400.ms,
                      delay: (60 * index).ms,
                    );
              },
              childCount: ridesState.rides.length,
            ),
          ),
        ),

        // Loading indicator
        if (ridesState.isLoading)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: context.accent,
                  ),
                ),
              ),
            ),
          ),

        // Bottom padding for nav bar
        const SliverToBoxAdapter(
          child: SizedBox(height: 120),
        ),
      ],
      ),
    );
  }
}

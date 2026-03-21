import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/app_database.dart';
import '../../../core/providers/sync_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/apex_button.dart';
import '../../../core/widgets/shimmer_loader.dart';
import '../../service/presentation/service_screen.dart';
import '../providers/bikes_provider.dart';
import 'widgets/add_edit_bike_sheet.dart';
import 'widgets/bike_action_sheet.dart';
import 'widgets/bike_grid_card.dart';
import 'widgets/delete_bike_dialog.dart';
import 'widgets/fuel_log_sheet.dart';
import 'widgets/hero_bike_card.dart';

class GarageScreen extends ConsumerWidget {
  const GarageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bikesAsync = ref.watch(bikesStreamProvider);

    return SafeArea(
      bottom: false,
      child: bikesAsync.when(
        loading: () => _buildShimmer(),
        error: (e, _) => Center(
          child: Text(
            'Error loading bikes',
            style: AppTypography.interSecondary,
          ),
        ),
        data: (bikes) => bikes.isEmpty
            ? _buildEmptyState(context)
            : _buildPopulated(context, ref, bikes),
      ),
    );
  }

  Widget _buildShimmer() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text('Garage', style: AppTypography.playfairDisplay),
          const SizedBox(height: 24),
          for (int i = 0; i < 3; i++) ...[
            const ShimmerCard(height: 80),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.two_wheeler, color: context.accent, size: 64),
            const SizedBox(height: 24),
            Text('No bikes yet', style: AppTypography.playfairDisplay),
            const SizedBox(height: 12),
            Text(
              'Add your first machine to start tracking rides and maintenance.',
              style: AppTypography.interSecondary,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ApexButton(
              label: 'Add your first machine',
              onPressed: () => AddEditBikeSheet.show(context),
              fullWidth: false,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPopulated(
    BuildContext context,
    WidgetRef ref,
    List<Bike> bikes,
  ) {
    return RefreshIndicator(
      color: context.accent,
      backgroundColor: AppColors.backgroundDark,
      onRefresh: () async {
        final engine = ref.read(syncEngineProvider);
        await engine.syncAll();
      },
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // Header + Add button
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              child: Row(
                children: [
                  Text('Garage', style: AppTypography.playfairDisplay),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => AddEditBikeSheet.show(context),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: context.accent.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.add, color: context.accent, size: 16),
                          const SizedBox(width: 6),
                          Text(
                            'Add',
                            style: AppTypography.interSmall.copyWith(
                              color: context.accent,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Hero bike
          SliverToBoxAdapter(
            child:
                Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: HeroBikeCard(
                        bike: bikes[0],
                        onTap: () => _showBikeActions(context, bikes[0]),
                        onMaintenance: () => _onMaintenance(context, bikes[0]),
                        onFuel: () => FuelLogSheet.show(context, bikes[0]),
                        onEdit: () =>
                            AddEditBikeSheet.show(context, bike: bikes[0]),
                        onDelete: () =>
                            DeleteBikeDialog.show(context, bikes[0]),
                      ),
                    )
                    .animate()
                    .fadeIn(duration: 500.ms)
                    .slideY(begin: 0.1, end: 0, duration: 500.ms),
          ),

          // Grid for remaining bikes
          if (bikes.length > 1)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 0.85,
                ),
                delegate: SliverChildBuilderDelegate((context, index) {
                  final bike = bikes[index + 1];
                  return BikeGridCard(
                        bike: bike,
                        onTap: () => _showBikeActions(context, bike),
                      )
                      .animate()
                      .fadeIn(duration: 500.ms, delay: (100 * (index + 1)).ms)
                      .slideY(
                        begin: 0.1,
                        end: 0,
                        duration: 500.ms,
                        delay: (100 * (index + 1)).ms,
                      );
                }, childCount: bikes.length - 1),
              ),
            ),

          // Bottom padding for nav bar
          const SliverToBoxAdapter(child: SizedBox(height: 120)),
        ],
      ),
    );
  }

  void _showBikeActions(BuildContext context, Bike bike) {
    BikeActionSheet.show(
      context,
      bike: bike,
      onMaintenance: () => _onMaintenance(context, bike),
      onFuel: () => FuelLogSheet.show(context, bike),
      onEdit: () => AddEditBikeSheet.show(context, bike: bike),
      onDelete: () => DeleteBikeDialog.show(context, bike),
    );
  }

  void _onMaintenance(BuildContext context, Bike bike) {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => ServiceScreen(bike: bike)));
  }
}

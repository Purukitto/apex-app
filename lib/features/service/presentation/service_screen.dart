import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/app_database.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/mesh_background.dart';
import '../providers/service_provider.dart';
import 'widgets/complete_service_sheet.dart';
import 'widgets/health_card.dart';
import 'widgets/service_history_sheet.dart';

class ServiceScreen extends ConsumerWidget {
  const ServiceScreen({super.key, required this.bike});

  final Bike bike;

  String get _displayName =>
      bike.nickName?.isNotEmpty == true
          ? bike.nickName!
          : '${bike.make} ${bike.model}';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schedulesAsync = ref.watch(schedulesStreamProvider(bike.id));

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: MeshBackground(
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // AppBar
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 8, 20, 0),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(
                        Icons.arrow_back,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Maintenance Health',
                            style: AppTypography.playfairDisplaySmall
                                .copyWith(fontSize: 22),
                          ),
                          Text(
                            _displayName,
                            style: AppTypography.interSecondary
                                .copyWith(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Content
              Expanded(
                child: schedulesAsync.when(
                  loading: () => Center(
                    child: CircularProgressIndicator(
                        color: context.accent),
                  ),
                  error: (_, _) => Center(
                    child: Text(
                      'Failed to load schedules',
                      style: AppTypography.interSecondary,
                    ),
                  ),
                  data: (schedules) => schedules.isEmpty
                      ? _buildEmpty()
                      : _buildGrid(context, schedules),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.build_outlined,
            color: AppColors.textMuted,
            size: 48,
          ),
          const SizedBox(height: 16),
          Text(
            'No maintenance schedules',
            style: AppTypography.interSecondary,
          ),
          const SizedBox(height: 8),
          Text(
            'Schedules will appear here',
            style: AppTypography.interMuted,
          ),
        ],
      ),
    );
  }

  Widget _buildGrid(
      BuildContext context, List<MaintenanceSchedule> schedules) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
      itemCount: schedules.length,
      itemBuilder: (context, index) {
        final schedule = schedules[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: HealthCard(
            schedule: schedule,
            currentOdo: bike.currentOdo,
            onComplete: () => CompleteServiceSheet.show(
              context,
              schedule: schedule,
              bike: bike,
            ),
            onHistory: () => ServiceHistorySheet.show(
              context,
              schedule: schedule,
            ),
          ),
        )
            .animate()
            .fadeIn(
              duration: 400.ms,
              delay: (80 * index).ms,
            )
            .slideY(
              begin: 0.08,
              end: 0,
              duration: 400.ms,
              delay: (80 * index).ms,
            );
      },
    );
  }
}

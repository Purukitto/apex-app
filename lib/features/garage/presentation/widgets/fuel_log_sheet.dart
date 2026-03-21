import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/toast.dart';
import '../../../../core/widgets/apex_button.dart';
import '../../../../core/widgets/confirm_dialog.dart';
import '../../providers/fuel_logs_provider.dart';
import 'add_edit_fuel_sheet.dart';
import 'fuel_log_tile.dart';

/// Bottom sheet showing all fuel logs for a bike.
class FuelLogSheet extends ConsumerWidget {
  const FuelLogSheet({super.key, required this.bike});

  final Bike bike;

  static Future<void> show(BuildContext context, Bike bike) {
    return showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FuelLogSheet(bike: bike),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logsAsync = ref.watch(fuelLogsStreamProvider(bike.id));
    final displayName = bike.nickName?.isNotEmpty == true
        ? bike.nickName!
        : '${bike.make} ${bike.model}';

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: const BoxDecoration(
          color: AppColors.backgroundDark,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(
            top: BorderSide(color: AppColors.cardBorder),
            left: BorderSide(color: AppColors.cardBorder),
            right: BorderSide(color: AppColors.cardBorder),
          ),
        ),
        child: Column(
          children: [
            // Drag handle
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 8),
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.textMuted,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Fuel Logs',
                        style: AppTypography.playfairDisplaySmall,
                      ),
                      ApexButton(
                        label: 'Add Refuel',
                        onPressed: () =>
                            AddEditFuelSheet.show(context, bike: bike),
                        variant: ApexButtonVariant.outlined,
                        fullWidth: false,
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(displayName, style: AppTypography.interSecondary),
                      if (bike.avgMileage != null) ...[
                        const Spacer(),
                        Text(
                          '${bike.avgMileage!.toStringAsFixed(1)} km/L',
                          style: AppTypography.jetBrainsMonoSmall.copyWith(
                            color: context.accent,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Content
            Expanded(
              child: logsAsync.when(
                loading: () => Center(
                  child: CircularProgressIndicator(color: context.accent),
                ),
                error: (_, _) => Center(
                  child: Text(
                    'Failed to load fuel logs',
                    style: AppTypography.interSecondary,
                  ),
                ),
                data: (logs) => logs.isEmpty
                    ? _buildEmpty(context)
                    : _buildList(context, ref, logs, scrollController),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.local_gas_station_outlined,
            color: AppColors.textMuted,
            size: 48,
          ),
          const SizedBox(height: 16),
          Text('No fuel logs yet', style: AppTypography.interSecondary),
          const SizedBox(height: 8),
          Text('Add your first refuel record', style: AppTypography.interMuted),
        ],
      ),
    );
  }

  Widget _buildList(
    BuildContext context,
    WidgetRef ref,
    List<FuelLog> logs,
    ScrollController scrollController,
  ) {
    return ListView.separated(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
      itemCount: logs.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final log = logs[index];
        return FuelLogTile(
          fuelLog: log,
          onEdit: () =>
              AddEditFuelSheet.show(context, bike: bike, fuelLog: log),
          onDelete: () async {
            final confirmed = await ConfirmDialog.show(
              context,
              title: 'Delete Fuel Log',
              message:
                  'This will permanently delete this fuel log. This action cannot be undone.',
              confirmLabel: 'Delete',
              isDestructive: true,
            );
            if (confirmed && context.mounted) {
              await ref
                  .read(fuelActionsProvider)
                  .deleteFuelLog(log.id, bike.id);
              if (context.mounted) {
                ApexToast.success(context, 'Fuel log deleted');
              }
            }
          },
        );
      },
    );
  }
}

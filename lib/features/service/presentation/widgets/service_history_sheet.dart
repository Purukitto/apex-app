import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/toast.dart';
import '../../../../core/widgets/confirm_dialog.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../providers/service_provider.dart';

/// Bottom sheet showing service history for a maintenance schedule.
class ServiceHistorySheet extends ConsumerWidget {
  const ServiceHistorySheet({super.key, required this.schedule});

  final MaintenanceSchedule schedule;

  static Future<void> show(
    BuildContext context, {
    required MaintenanceSchedule schedule,
  }) {
    return showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ServiceHistorySheet(schedule: schedule),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(scheduleHistoryStreamProvider(schedule.id));

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.9,
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
                  Text(
                    'Service History',
                    style: AppTypography.playfairDisplaySmall,
                  ),
                  const SizedBox(height: 4),
                  Text(schedule.partName, style: AppTypography.interSecondary),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Content
            Expanded(
              child: historyAsync.when(
                loading: () => Center(
                  child: CircularProgressIndicator(color: context.accent),
                ),
                error: (_, _) => Center(
                  child: Text(
                    'Failed to load history',
                    style: AppTypography.interSecondary,
                  ),
                ),
                data: (entries) => entries.isEmpty
                    ? _buildEmpty()
                    : _buildList(context, ref, entries, scrollController),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.history, color: AppColors.textMuted, size: 48),
          const SizedBox(height: 16),
          Text('No service history', style: AppTypography.interSecondary),
          const SizedBox(height: 8),
          Text(
            'Complete a service to see it here',
            style: AppTypography.interMuted,
          ),
        ],
      ),
    );
  }

  Widget _buildList(
    BuildContext context,
    WidgetRef ref,
    List<ServiceHistoryData> entries,
    ScrollController scrollController,
  ) {
    return ListView.separated(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
      itemCount: entries.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final entry = entries[index];
        return _ServiceHistoryTile(
          entry: entry,
          onDelete: () async {
            final confirmed = await ConfirmDialog.show(
              context,
              title: 'Delete Entry',
              message: 'Delete this service history entry?',
              confirmLabel: 'Delete',
              isDestructive: true,
            );
            if (confirmed && context.mounted) {
              await ref
                  .read(serviceActionsProvider)
                  .deleteHistoryEntry(entry.id);
              if (context.mounted) {
                ApexToast.success(context, 'Entry deleted');
              }
            }
          },
        );
      },
    );
  }
}

class _ServiceHistoryTile extends StatelessWidget {
  const _ServiceHistoryTile({required this.entry, required this.onDelete});

  final ServiceHistoryData entry;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final date = DateTime.tryParse(entry.serviceDate);
    final dateStr = date != null
        ? DateFormat('MMM d, yyyy').format(date)
        : entry.serviceDate;

    return GlassCard(
      padding: const EdgeInsets.all(14),
      borderRadius: 14,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  dateStr,
                  style: AppTypography.inter.copyWith(fontSize: 14),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.straighten,
                      size: 13,
                      color: AppColors.textMuted,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${entry.serviceOdo.toStringAsFixed(0)} km',
                      style: AppTypography.jetBrainsMonoSmall.copyWith(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                    if (entry.cost != null) ...[
                      const SizedBox(width: 12),
                      Text(
                        '₹${entry.cost!.toStringAsFixed(0)}',
                        style: AppTypography.jetBrainsMonoSmall.copyWith(
                          color: context.accent,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ),
                if (entry.notes != null && entry.notes!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    entry.notes!,
                    style: AppTypography.interMuted.copyWith(fontSize: 12),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
          GestureDetector(
            onTap: onDelete,
            child: Padding(
              padding: const EdgeInsets.all(4),
              child: Icon(
                Icons.delete_outline,
                size: 18,
                color: AppColors.textMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

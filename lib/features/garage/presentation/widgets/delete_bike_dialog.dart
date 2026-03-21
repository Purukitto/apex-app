import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/toast.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../providers/bikes_provider.dart';

/// Custom delete dialog with conditional content based on related data.
class DeleteBikeDialog extends ConsumerWidget {
  const DeleteBikeDialog({super.key, required this.bike});

  final Bike bike;

  static Future<void> show(BuildContext context, Bike bike) {
    return showDialog(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.6),
      builder: (_) => DeleteBikeDialog(bike: bike),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final countsAsync = ref.watch(bikeRelatedCountsProvider(bike.id));
    final displayName = bike.nickName?.isNotEmpty == true
        ? bike.nickName!
        : '${bike.make} ${bike.model}';

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: GlassCard(
        padding: const EdgeInsets.all(24),
        borderRadius: 20,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Delete $displayName?',
              style: AppTypography.playfairDisplay.copyWith(fontSize: 22),
            ),
            const SizedBox(height: 16),
            countsAsync.when(
              loading: () => Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 20),
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
              error: (_, _) => Text(
                'Failed to check related data.',
                style: AppTypography.interSmall.copyWith(
                  color: AppColors.error,
                ),
              ),
              data: (counts) => _buildContent(context, ref, counts),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    WidgetRef ref,
    BikeRelatedCounts counts,
  ) {
    final bool canDelete = !counts.hasRides;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (counts.hasRides)
          _WarningBox(
            color: AppColors.error,
            text:
                'Cannot delete: This bike has ${counts.rides} ride(s) with GPS data. '
                'Please delete rides first.',
          )
        else if (counts.hasLogs)
          _WarningBox(
            color: AppColors.warning,
            text: 'Maintenance and fuel logs will be removed with this bike.',
          )
        else
          Text(
            'No related data. Safe to delete.',
            style: AppTypography.interSmall.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: _DialogButton(
                label: 'Cancel',
                onTap: () => Navigator.of(context).pop(),
                color: AppColors.textSecondary,
                borderColor: AppColors.cardBorder,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _DialogButton(
                label: 'Delete',
                onTap: canDelete
                    ? () async {
                        Navigator.of(context).pop();
                        await ref.read(bikeActionsProvider).deleteBike(bike.id);
                        if (context.mounted) {
                          ApexToast.success(context, 'Bike deleted');
                        }
                      }
                    : null,
                color: AppColors.error,
                borderColor: AppColors.error,
                isFilled: true,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _WarningBox extends StatelessWidget {
  const _WarningBox({required this.color, required this.text});

  final Color color;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.warning_amber_rounded, color: color, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: AppTypography.interSmall.copyWith(color: color),
            ),
          ),
        ],
      ),
    );
  }
}

class _DialogButton extends StatelessWidget {
  const _DialogButton({
    required this.label,
    required this.onTap,
    required this.color,
    required this.borderColor,
    this.isFilled = false,
  });

  final String label;
  final VoidCallback? onTap;
  final Color color;
  final Color borderColor;
  final bool isFilled;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    final effectiveColor = enabled ? color : color.withValues(alpha: 0.3);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isFilled
              ? effectiveColor.withValues(alpha: enabled ? 0.15 : 0.05)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: enabled ? borderColor : borderColor.withValues(alpha: 0.3),
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: AppTypography.inter.copyWith(
            color: effectiveColor,
            fontSize: 14,
            fontWeight: FontWeight.w400,
          ),
        ),
      ),
    );
  }
}

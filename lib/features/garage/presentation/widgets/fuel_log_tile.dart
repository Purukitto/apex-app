import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/glass_card.dart';

/// A single fuel log entry in the fuel log list.
class FuelLogTile extends StatelessWidget {
  const FuelLogTile({
    super.key,
    required this.fuelLog,
    required this.onEdit,
    required this.onDelete,
  });

  final FuelLog fuelLog;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, yyyy').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  String _formatOdo(double odo) {
    return NumberFormat('#,##0').format(odo.toInt());
  }

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(14),
      borderRadius: 16,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Litres + full tank badge
                Row(
                  children: [
                    Text(
                      '${fuelLog.litres.toStringAsFixed(2)} L',
                      style: AppTypography.inter.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (fuelLog.isFullTank) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: context.accent.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'Full Tank',
                          style: AppTypography.interSmall.copyWith(
                            color: context.accent,
                            fontSize: 11,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 6),
                // Date
                Text(
                  _formatDate(fuelLog.date),
                  style: AppTypography.interSecondary.copyWith(fontSize: 13),
                ),
                const SizedBox(height: 4),
                // Odometer
                Text(
                  '${_formatOdo(fuelLog.odometer)} km',
                  style: AppTypography.jetBrainsMonoSmall.copyWith(
                    color: context.accent,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                // Price breakdown
                Row(
                  children: [
                    Text(
                      '₹${fuelLog.pricePerLitre.toStringAsFixed(2)}/L',
                      style: AppTypography.interMuted.copyWith(fontSize: 12),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '₹${fuelLog.totalCost.toStringAsFixed(2)}',
                      style: AppTypography.interMuted.copyWith(fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            children: [
              IconButton(
                icon: const Icon(Icons.edit_outlined, size: 18),
                color: AppColors.textSecondary,
                onPressed: onEdit,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18),
                color: AppColors.error,
                onPressed: onDelete,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

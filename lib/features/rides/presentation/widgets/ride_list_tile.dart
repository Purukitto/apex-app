import 'package:flutter/material.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/format_utils.dart';
import '../../../../core/widgets/pressable_glass_card.dart';

/// A card tile showing a ride summary in the ride history list.
class RideListTile extends StatelessWidget {
  const RideListTile({
    super.key,
    required this.ride,
    this.bikeName,
    required this.onTap,
  });

  final Ride ride;
  final String? bikeName;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final displayName = ride.rideName ?? bikeName ?? 'Ride';
    final showBikeName = ride.rideName != null && bikeName != null;

    return PressableGlassCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      borderRadius: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row 1: Name + date
          Row(
            children: [
              Expanded(
                child: Text(
                  displayName,
                  style: AppTypography.inter.copyWith(
                    fontWeight: FontWeight.w400,
                    fontSize: 16,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                formatRelativeDate(ride.startTime),
                style: AppTypography.interSecondary.copyWith(fontSize: 12),
              ),
            ],
          ),

          // Row 2: Bike name (secondary)
          if (showBikeName) ...[
            const SizedBox(height: 2),
            Text(
              bikeName!,
              style: AppTypography.interMuted.copyWith(fontSize: 12),
            ),
          ],

          const SizedBox(height: 10),

          // Row 3: Stats
          Row(
            children: [
              _StatChip(
                icon: Icons.straighten,
                value: '${ride.distanceKm.toStringAsFixed(1)} km',
              ),
              const SizedBox(width: 16),
              _StatChip(
                icon: Icons.timer_outlined,
                value: formatDuration(ride.startTime, ride.endTime),
              ),
              if (ride.maxLeanLeft != null || ride.maxLeanRight != null) ...[
                const SizedBox(width: 16),
                _StatChip(
                  icon: Icons.rotate_left,
                  value: _leanText(),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  String _leanText() {
    final left = ride.maxLeanLeft?.toStringAsFixed(0) ?? '-';
    final right = ride.maxLeanRight?.toStringAsFixed(0) ?? '-';
    return '$left° / $right°';
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.icon, required this.value});

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

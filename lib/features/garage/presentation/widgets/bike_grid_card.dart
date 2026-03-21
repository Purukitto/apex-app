import 'package:flutter/material.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/pressable_glass_card.dart';
import 'bike_image.dart';

/// Compact card for bikes after the first (used in 2-column grid).
/// Tapping opens a bike action sheet.
class BikeGridCard extends StatelessWidget {
  const BikeGridCard({super.key, required this.bike, required this.onTap});

  final Bike bike;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final displayName = bike.nickName?.isNotEmpty == true
        ? bike.nickName!
        : '${bike.make} ${bike.model}';
    final subtitle = bike.nickName?.isNotEmpty == true
        ? '${bike.make} ${bike.model}'
        : null;

    return PressableGlassCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      borderRadius: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Bike image centered at top
          Center(
            child: BikeImage(
              imageUrl: bike.imageUrl,
              size: 56,
              borderRadius: 14,
            ),
          ),
          const SizedBox(height: 12),
          // Name
          Text(
            displayName,
            style: AppTypography.interSmall.copyWith(
              fontWeight: FontWeight.w400,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: AppTypography.interMuted.copyWith(fontSize: 12),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const Spacer(),
          // Odo + year row
          Row(
            children: [
              Text(
                '${bike.currentOdo.toInt()} km',
                style: AppTypography.jetBrainsMonoSmall.copyWith(
                  color: context.accent,
                  fontSize: 12,
                ),
              ),
              if (bike.year != null) ...[
                const Spacer(),
                Text(
                  '${bike.year}',
                  style: AppTypography.interMuted.copyWith(fontSize: 11),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

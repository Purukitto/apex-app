import 'package:flutter/material.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/glass_card.dart';
import 'bike_image.dart';

/// Featured card for the first (primary) bike in the garage.
class HeroBikeCard extends StatelessWidget {
  const HeroBikeCard({
    super.key,
    required this.bike,
    required this.onTap,
    required this.onMaintenance,
    required this.onFuel,
    required this.onEdit,
    required this.onDelete,
  });

  final Bike bike;
  final VoidCallback onTap;
  final VoidCallback onMaintenance;
  final VoidCallback onFuel;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final displayName = bike.nickName?.isNotEmpty == true
        ? bike.nickName!
        : '${bike.make} ${bike.model}';
    final subtitle = bike.nickName?.isNotEmpty == true
        ? '${bike.make} ${bike.model}'
        : null;

    return GestureDetector(
      onTap: onTap,
      child: GlassCard(
        isAccent: true,
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        displayName,
                        style: AppTypography.playfairDisplaySmall,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: AppTypography.interSecondary,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: 8),
                      Text(
                        '${bike.currentOdo.toInt()} km',
                        style: AppTypography.jetBrainsMono.copyWith(
                          color: context.accent,
                        ),
                      ),
                      if (bike.year != null) ...[
                        const SizedBox(height: 4),
                        Text('${bike.year}', style: AppTypography.interMuted),
                      ],
                      if (bike.avgMileage != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          '${bike.avgMileage!.toStringAsFixed(1)} km/L avg',
                          style: AppTypography.jetBrainsMonoSmall.copyWith(
                            color: context.accent,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                BikeImage(imageUrl: bike.imageUrl, size: 72),
              ],
            ),
            const SizedBox(height: 16),
            // Icon action row — clean, Shiren-style
            Row(
              children: [
                _IconAction(
                  icon: Icons.build_outlined,
                  label: 'Service',
                  onTap: onMaintenance,
                ),
                const SizedBox(width: 20),
                _IconAction(
                  icon: Icons.local_gas_station_outlined,
                  label: 'Fuel',
                  onTap: onFuel,
                ),
                const SizedBox(width: 20),
                _IconAction(
                  icon: Icons.edit_outlined,
                  label: 'Edit',
                  onTap: onEdit,
                ),
                const Spacer(),
                _IconAction(
                  icon: Icons.delete_outline,
                  label: 'Delete',
                  onTap: onDelete,
                  isDestructive: true,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _IconAction extends StatelessWidget {
  const _IconAction({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    final color = isDestructive
        ? AppColors.error.withValues(alpha: 0.7)
        : AppColors.textSecondary;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppTypography.interSmall.copyWith(
              color: color,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

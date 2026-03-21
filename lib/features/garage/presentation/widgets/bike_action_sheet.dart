import 'package:flutter/material.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/glass_card.dart';
import 'bike_image.dart';

/// Bottom sheet with actions for a bike — shown on grid card tap.
class BikeActionSheet extends StatelessWidget {
  const BikeActionSheet({
    super.key,
    required this.bike,
    required this.onMaintenance,
    required this.onFuel,
    required this.onEdit,
    required this.onDelete,
  });

  final Bike bike;
  final VoidCallback onMaintenance;
  final VoidCallback onFuel;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  static void show(
    BuildContext context, {
    required Bike bike,
    required VoidCallback onMaintenance,
    required VoidCallback onFuel,
    required VoidCallback onEdit,
    required VoidCallback onDelete,
  }) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      useSafeArea: true,
      backgroundColor: AppColors.backgroundMid,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => BikeActionSheet(
        bike: bike,
        onMaintenance: onMaintenance,
        onFuel: onFuel,
        onEdit: onEdit,
        onDelete: onDelete,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final displayName = bike.nickName?.isNotEmpty == true
        ? bike.nickName!
        : '${bike.make} ${bike.model}';
    final subtitle = bike.nickName?.isNotEmpty == true
        ? '${bike.make} ${bike.model}'
        : null;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        MediaQuery.of(context).padding.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.textMuted.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          // Bike info header
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                BikeImage(imageUrl: bike.imageUrl, size: 52, borderRadius: 14),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        displayName,
                        style: AppTypography.inter.copyWith(
                          fontWeight: FontWeight.w400,
                        ),
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
                      const SizedBox(height: 4),
                      Text(
                        '${bike.currentOdo.toInt()} km',
                        style: AppTypography.jetBrainsMonoSmall.copyWith(
                          color: context.accent,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Action buttons
          _ActionTile(
            icon: Icons.build_outlined,
            label: 'Service & Maintenance',
            onTap: () {
              Navigator.pop(context);
              onMaintenance();
            },
          ),
          _ActionTile(
            icon: Icons.local_gas_station_outlined,
            label: 'Fuel Logs',
            onTap: () {
              Navigator.pop(context);
              onFuel();
            },
          ),
          _ActionTile(
            icon: Icons.edit_outlined,
            label: 'Edit Bike',
            onTap: () {
              Navigator.pop(context);
              onEdit();
            },
          ),
          _ActionTile(
            icon: Icons.delete_outline,
            label: 'Delete Bike',
            color: AppColors.error,
            onTap: () {
              Navigator.pop(context);
              onDelete();
            },
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.textPrimary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        splashColor: context.accent.withValues(alpha: 0.08),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 14),
          child: Row(
            children: [
              Icon(icon, color: c.withValues(alpha: 0.7), size: 20),
              const SizedBox(width: 14),
              Text(
                label,
                style: AppTypography.inter.copyWith(
                  color: c,
                  fontSize: 15,
                  fontWeight: FontWeight.w300,
                ),
              ),
              const Spacer(),
              Icon(
                Icons.chevron_right,
                color: AppColors.textMuted.withValues(alpha: 0.5),
                size: 18,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

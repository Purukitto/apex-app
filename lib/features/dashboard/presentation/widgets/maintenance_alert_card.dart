import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/pressable_glass_card.dart';
import '../../../service/providers/maintenance_alerts_provider.dart';

/// Dashboard card showing maintenance items that need attention.
class MaintenanceAlertCard extends ConsumerWidget {
  const MaintenanceAlertCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final alerts = ref.watch(maintenanceAlertsProvider);

    if (alerts.isEmpty) return const SizedBox.shrink();

    final worst = alerts.first;
    final accentColor = worst.healthPercent < 20
        ? AppColors.error
        : AppColors.warning;

    return PressableGlassCard(
      onTap: () => context.go('/garage'),
      padding: const EdgeInsets.all(16),
      borderRadius: 20,
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.build_outlined, color: accentColor, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${alerts.length} item${alerts.length > 1 ? 's' : ''} need service',
                  style: AppTypography.inter.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${worst.schedule.partName} — ${worst.bike.nickName ?? '${worst.bike.make} ${worst.bike.model}'} (${worst.healthPercent.toStringAsFixed(0)}%)',
                  style: AppTypography.interSmall.copyWith(
                    color: accentColor,
                    fontSize: 12,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
        ],
      ),
    );
  }
}

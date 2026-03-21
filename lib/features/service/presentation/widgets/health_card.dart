import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/glass_card.dart';

/// Health card widget showing maintenance status for a single schedule.
class HealthCard extends StatelessWidget {
  const HealthCard({
    super.key,
    required this.schedule,
    required this.currentOdo,
    required this.onComplete,
    required this.onHistory,
  });

  final MaintenanceSchedule schedule;
  final double currentOdo;
  final VoidCallback onComplete;
  final VoidCallback onHistory;

  double get _health => _calculateHealth();

  bool get _isDue => _health < 20;

  double _calculateHealth() {
    final kmUsed =
        math.max(0.0, currentOdo - (schedule.lastServiceOdo ?? 0));
    final kmHealth = 100.0 - (kmUsed / schedule.intervalKm) * 100.0;

    double timeHealth = 100.0;
    if (schedule.intervalMonths > 0) {
      if (schedule.lastServiceDate != null) {
        final lastDate = DateTime.tryParse(schedule.lastServiceDate!);
        if (lastDate != null) {
          final daysSince = DateTime.now().difference(lastDate).inDays;
          final monthsUsed = daysSince / 30.44;
          timeHealth =
              100.0 - (monthsUsed / schedule.intervalMonths) * 100.0;
        }
      } else {
        return 0.0;
      }
    }

    return math.min(kmHealth, timeHealth).clamp(0.0, 100.0);
  }

  Color _healthColor(BuildContext context) {
    if (_health >= 60) return context.accent;
    if (_health >= 20) return AppColors.warning;
    return AppColors.error;
  }

  @override
  Widget build(BuildContext context) {
    final health = _health;
    final color = _healthColor(context);
    final kmUsed =
        math.max(0.0, currentOdo - (schedule.lastServiceOdo ?? 0));

    return GlassCard(
      padding: const EdgeInsets.all(16),
      borderRadius: 16,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: part name + badges
          Row(
            children: [
              Icon(Icons.build_outlined, size: 18, color: color),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  schedule.partName,
                  style: AppTypography.inter.copyWith(
                    fontWeight: FontWeight.w400,
                    fontSize: 16,
                  ),
                ),
              ),
              // History button
              GestureDetector(
                onTap: onHistory,
                child: Icon(
                  Icons.history,
                  size: 20,
                  color: AppColors.textMuted,
                ),
              ),
              if (_isDue) ...[
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: AppColors.error.withValues(alpha: 0.4),
                    ),
                  ),
                  child: Text(
                    'DUE',
                    style: AppTypography.interLabel.copyWith(
                      color: AppColors.error,
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ],
          ),

          const SizedBox(height: 12),

          // Health bar
          _HealthProgressBar(health: health, color: color),

          const SizedBox(height: 12),

          // KM info
          Row(
            children: [
              Icon(Icons.straighten, size: 14, color: AppColors.textMuted),
              const SizedBox(width: 6),
              Text(
                '${kmUsed.toStringAsFixed(0)} / ${schedule.intervalKm} km',
                style: AppTypography.jetBrainsMonoSmall.copyWith(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                ),
              ),
            ],
          ),

          // Time info (if applicable)
          if (schedule.intervalMonths > 0) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(Icons.schedule, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 6),
                Text(
                  _timeInfo(),
                  style: AppTypography.jetBrainsMonoSmall.copyWith(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],

          // Last service date
          if (schedule.lastServiceDate != null) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(Icons.check_circle_outline,
                    size: 14, color: AppColors.textMuted),
                const SizedBox(width: 6),
                Text(
                  'Last: ${_formatDate(schedule.lastServiceDate!)}',
                  style: AppTypography.interSmall.copyWith(
                    color: AppColors.textMuted,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 12),

          // Action button
          GestureDetector(
            onTap: onComplete,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: (_isDue ? AppColors.error : context.accent)
                    .withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: (_isDue ? AppColors.error : context.accent)
                      .withValues(alpha: 0.4),
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                _isDue ? 'Fix Now' : 'Mark Done',
                style: AppTypography.interSmall.copyWith(
                  color: _isDue ? AppColors.error : context.accent,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _timeInfo() {
    if (schedule.lastServiceDate != null) {
      final lastDate = DateTime.tryParse(schedule.lastServiceDate!);
      if (lastDate != null) {
        final daysSince = DateTime.now().difference(lastDate).inDays;
        final monthsUsed = (daysSince / 30.44).round();
        return '$monthsUsed / ${schedule.intervalMonths} months';
      }
    }
    return '— / ${schedule.intervalMonths} months';
  }

  String _formatDate(String dateStr) {
    final date = DateTime.tryParse(dateStr);
    if (date == null) return dateStr;
    return DateFormat('MMM d, yyyy').format(date);
  }
}

class _HealthProgressBar extends StatelessWidget {
  const _HealthProgressBar({
    required this.health,
    required this.color,
  });

  final double health;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Health',
              style: AppTypography.interSmall.copyWith(
                color: AppColors.textMuted,
                fontSize: 11,
              ),
            ),
            Text(
              '${health.toStringAsFixed(0)}%',
              style: AppTypography.jetBrainsMonoSmall.copyWith(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: SizedBox(
            height: 6,
            child: LayoutBuilder(
              builder: (context, constraints) {
                return Stack(
                  children: [
                    // Background
                    Container(
                      width: constraints.maxWidth,
                      color: AppColors.cardBg,
                    ),
                    // Fill
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 600),
                      curve: Curves.easeOut,
                      width: constraints.maxWidth * (health / 100.0),
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

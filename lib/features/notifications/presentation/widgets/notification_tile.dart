import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/database/app_database.dart' as db;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/glass_card.dart';

/// A single notification card in the notification sheet.
class NotificationTile extends StatelessWidget {
  const NotificationTile({
    super.key,
    required this.notification,
    required this.onMarkRead,
    required this.onDismiss,
  });

  final db.Notification notification;
  final VoidCallback onMarkRead;
  final VoidCallback onDismiss;

  bool get _isUnread => notification.readAt == null;

  Color get _typeBadgeColor {
    switch (notification.type) {
      case 'error':
        return AppColors.error;
      case 'warning':
        return AppColors.warning;
      default:
        return const Color(0xFF4A9EFF); // info blue
    }
  }

  String get _typeLabel {
    switch (notification.type) {
      case 'error':
        return 'ERROR';
      case 'warning':
        return 'WARNING';
      default:
        return 'INFO';
    }
  }

  String _timeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('MMM d').format(dateTime);
  }

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      borderRadius: 16,
      child: Container(
        decoration: _isUnread
            ? BoxDecoration(
                border: Border(
                  left: BorderSide(color: _typeBadgeColor, width: 2),
                ),
              )
            : null,
        padding: _isUnread ? const EdgeInsets.only(left: 12) : EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: type badge + timestamp + actions
            Row(
              children: [
                // Type badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: _typeBadgeColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _typeLabel,
                    style: TextStyle(
                      color: _typeBadgeColor,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _timeAgo(notification.createdAt),
                  style: AppTypography.interMuted.copyWith(fontSize: 11),
                ),
                const Spacer(),
                // Actions
                if (_isUnread)
                  _ActionButton(
                    icon: Icons.check,
                    onTap: onMarkRead,
                    tooltip: 'Mark as read',
                  ),
                const SizedBox(width: 4),
                _ActionButton(
                  icon: Icons.close,
                  onTap: onDismiss,
                  tooltip: 'Dismiss',
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Title
            if (notification.title != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  notification.title!,
                  style: AppTypography.inter.copyWith(
                    fontWeight: FontWeight.w400,
                    fontSize: 14,
                    color: _isUnread
                        ? AppColors.textPrimary
                        : AppColors.textSecondary,
                  ),
                ),
              ),

            // Message
            Text(
              notification.message,
              style: AppTypography.interSecondary.copyWith(
                fontSize: 13,
                color: _isUnread
                    ? AppColors.textSecondary
                    : AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.onTap,
    required this.tooltip,
  });

  final IconData icon;
  final VoidCallback onTap;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: Icon(icon, size: 16, color: AppColors.textMuted),
        ),
      ),
    );
  }
}

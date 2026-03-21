import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/toast.dart';
import '../providers/notification_provider.dart';
import 'widgets/notification_tile.dart';

/// Bottom sheet displaying the user's notifications.
class NotificationSheet extends ConsumerWidget {
  const NotificationSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const NotificationSheet(),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);
    final actions = ref.read(notificationActionsProvider);

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.85,
      minChildSize: 0.3,
      builder: (context, scrollController) {
        return Container(
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
                    color: AppColors.textMuted.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  children: [
                    Text(
                      'Notifications',
                      style: AppTypography.playfairDisplay.copyWith(
                        fontSize: 22,
                      ),
                    ),
                    const Spacer(),
                    _HeaderAction(
                      label: 'Read all',
                      onTap: () async {
                        await actions.markAllAsRead();
                        if (context.mounted) {
                          ApexToast.success(
                              context, 'All notifications marked as read');
                        }
                      },
                    ),
                    const SizedBox(width: 12),
                    _HeaderAction(
                      label: 'Clear all',
                      onTap: () async {
                        await actions.dismissAll();
                        if (context.mounted) {
                          ApexToast.success(
                              context, 'All notifications cleared');
                          Navigator.of(context).pop();
                        }
                      },
                    ),
                  ],
                ),
              ),

              const Divider(
                color: AppColors.cardBorder,
                height: 1,
              ),

              // Notification list
              Expanded(
                child: notificationsAsync.when(
                  loading: () => Center(
                    child: CircularProgressIndicator(color: context.accent),
                  ),
                  error: (e, _) => Center(
                    child: Text(
                      'Error loading notifications',
                      style: AppTypography.interSecondary,
                    ),
                  ),
                  data: (notifications) {
                    if (notifications.isEmpty) {
                      return _buildEmptyState();
                    }

                    return ListView.separated(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                      itemCount: notifications.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final notification = notifications[index];
                        return NotificationTile(
                          notification: notification,
                          onMarkRead: () async {
                            await actions.markAsRead(notification.id);
                            if (context.mounted) {
                              ApexToast.success(
                                  context, 'Notification marked as read');
                            }
                          },
                          onDismiss: () async {
                            await actions.dismiss(notification.id);
                            if (context.mounted) {
                              ApexToast.success(
                                  context, 'Notification dismissed');
                            }
                          },
                        )
                            .animate()
                            .fadeIn(
                              duration: 300.ms,
                              delay: (40 * index).ms,
                            )
                            .slideY(
                              begin: 0.05,
                              end: 0,
                              duration: 300.ms,
                              delay: (40 * index).ms,
                            );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_none_outlined,
            color: AppColors.textMuted.withValues(alpha: 0.4),
            size: 56,
          ),
          const SizedBox(height: 16),
          Text(
            'No notifications',
            style: AppTypography.interSecondary,
          ),
        ],
      ),
    );
  }
}

class _HeaderAction extends StatelessWidget {
  const _HeaderAction({
    required this.label,
    required this.onTap,
  });

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Text(
        label,
        style: AppTypography.interSmall.copyWith(
          color: context.accent,
          fontSize: 12,
        ),
      ),
    );
  }
}

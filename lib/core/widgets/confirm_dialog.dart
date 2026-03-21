import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Confirmation dialog utility. Use this instead of window.confirm / AlertDialog.
///
/// Returns `true` if the user confirmed, `false` otherwise.
class ConfirmDialog {
  ConfirmDialog._();

  static Future<bool> show(
    BuildContext context, {
    required String title,
    required String message,
    String confirmLabel = 'Confirm',
    String cancelLabel = 'Cancel',
    bool isDestructive = false,
  }) async {
    final result = await showDialog<bool>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.6),
      builder: (ctx) => _ConfirmDialogWidget(
        title: title,
        message: message,
        confirmLabel: confirmLabel,
        cancelLabel: cancelLabel,
        isDestructive: isDestructive,
      ),
    );
    return result ?? false;
  }
}

class _ConfirmDialogWidget extends StatelessWidget {
  const _ConfirmDialogWidget({
    required this.title,
    required this.message,
    required this.confirmLabel,
    required this.cancelLabel,
    required this.isDestructive,
  });

  final String title;
  final String message;
  final String confirmLabel;
  final String cancelLabel;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF121214),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.cardBorder, width: 1),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: AppTypography.playfairDisplay.copyWith(fontSize: 22),
            ),
            const SizedBox(height: 12),
            Text(
              message,
              style: AppTypography.inter.copyWith(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: _DialogButton(
                    label: cancelLabel,
                    onTap: () => Navigator.of(context).pop(false),
                    isDestructive: false,
                    isPrimary: false,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _DialogButton(
                    label: confirmLabel,
                    onTap: () => Navigator.of(context).pop(true),
                    isDestructive: isDestructive,
                    isPrimary: true,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DialogButton extends StatelessWidget {
  const _DialogButton({
    required this.label,
    required this.onTap,
    required this.isDestructive,
    required this.isPrimary,
  });

  final String label;
  final VoidCallback onTap;
  final bool isDestructive;
  final bool isPrimary;

  @override
  Widget build(BuildContext context) {
    final Color bg;
    final Color textColor;
    final Color borderColor;

    if (isPrimary) {
      bg = isDestructive
          ? AppColors.error.withValues(alpha: 0.15)
          : context.accent.withValues(alpha: 0.15);
      textColor = isDestructive ? AppColors.error : context.accent;
      borderColor = isDestructive ? AppColors.error : context.accent;
    } else {
      bg = Colors.transparent;
      textColor = AppColors.textSecondary;
      borderColor = AppColors.cardBorder;
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: AppTypography.inter.copyWith(
            color: textColor,
            fontSize: 14,
            fontWeight: FontWeight.w400,
          ),
        ),
      ),
    );
  }
}

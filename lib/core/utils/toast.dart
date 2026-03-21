import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'constants.dart';

/// App-wide toast utility. Use ApexToast — never show SnackBars directly.
class ApexToast {
  ApexToast._();

  static void success(BuildContext context, String message) {
    _show(
      context,
      message: message,
      borderColor: context.accent,
      duration: kToastDurationSuccess,
    );
  }

  static void error(
    BuildContext context,
    String message, {
    VoidCallback? onAction,
    String? actionLabel,
  }) {
    final truncated = _truncate(message, 120);
    _show(
      context,
      message: truncated,
      borderColor: AppColors.error,
      duration: kToastDurationError,
      onAction: onAction,
      actionLabel: actionLabel,
    );
  }

  /// Show a loading snackbar while [future] runs, then replace with
  /// success or error message on completion.
  static Future<T> promise<T>(
    BuildContext context,
    Future<T> future, {
    required String loading,
    required String success,
    String? error,
  }) async {
    final messenger = ScaffoldMessenger.of(context);

    // Show loading snack (persistent until we remove it)
    final controller = messenger.showSnackBar(
      _buildSnackBar(
        message: loading,
        borderColor: AppColors.textMuted,
        duration: const Duration(days: 1), // dismissed manually
      ),
    );

    try {
      final result = await future;
      messenger.hideCurrentSnackBar();
      if (context.mounted) {
        ApexToast.success(context, success);
      }
      return result;
    } catch (e) {
      messenger.hideCurrentSnackBar();
      if (context.mounted) {
        ApexToast.error(
          context,
          error ?? (e is Exception ? e.toString() : 'Something went wrong'),
        );
      }
      rethrow;
    } finally {
      controller.close();
    }
  }

  static void _show(
    BuildContext context, {
    required String message,
    required Color borderColor,
    required Duration duration,
    VoidCallback? onAction,
    String? actionLabel,
  }) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        _buildSnackBar(
          message: message,
          borderColor: borderColor,
          duration: duration,
          onAction: onAction,
          actionLabel: actionLabel,
        ),
      );
  }

  static SnackBar _buildSnackBar({
    required String message,
    required Color borderColor,
    required Duration duration,
    VoidCallback? onAction,
    String? actionLabel,
  }) {
    return SnackBar(
      duration: duration,
      behavior: SnackBarBehavior.floating,
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      backgroundColor: AppColors.backgroundDark,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.cardBorder),
      ),
      content: Row(
        children: [
          Container(
            width: 3,
            height: 36,
            decoration: BoxDecoration(
              color: borderColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w300,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
      action: (onAction != null && actionLabel != null)
          ? SnackBarAction(
              label: actionLabel,
              textColor: borderColor,
              onPressed: onAction,
            )
          : null,
    );
  }

  /// Truncates [text] to [maxLen] characters at a word boundary.
  static String _truncate(String text, int maxLen) {
    if (text.length <= maxLen) return text;
    final truncated = text.substring(0, maxLen);
    final lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0
        ? '${truncated.substring(0, lastSpace)}…'
        : '$truncated…';
  }
}

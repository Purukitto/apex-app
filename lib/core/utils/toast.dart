import 'dart:async';

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'constants.dart';

/// App-wide toast utility. Shows overlay-based toasts at the top of the screen.
class ApexToast {
  ApexToast._();

  static OverlayEntry? _currentEntry;
  static Timer? _dismissTimer;

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

  /// Show a loading toast while [future] runs, then replace with
  /// success or error message on completion.
  static Future<T> promise<T>(
    BuildContext context,
    Future<T> future, {
    required String loading,
    required String success,
    String? error,
  }) async {
    _show(
      context,
      message: loading,
      borderColor: AppColors.textMuted,
      duration: const Duration(days: 1), // dismissed manually
    );

    try {
      final result = await future;
      _dismiss();
      if (context.mounted) {
        ApexToast.success(context, success);
      }
      return result;
    } catch (e) {
      _dismiss();
      if (context.mounted) {
        ApexToast.error(
          context,
          error ?? (e is Exception ? e.toString() : 'Something went wrong'),
        );
      }
      rethrow;
    }
  }

  static void _dismiss() {
    _dismissTimer?.cancel();
    _dismissTimer = null;
    _currentEntry?.remove();
    _currentEntry = null;
  }

  static void _show(
    BuildContext context, {
    required String message,
    required Color borderColor,
    required Duration duration,
    VoidCallback? onAction,
    String? actionLabel,
  }) {
    _dismiss();

    final overlay = Overlay.of(context, rootOverlay: true);

    late final OverlayEntry entry;
    entry = OverlayEntry(
      builder: (context) => _ToastOverlay(
        message: message,
        borderColor: borderColor,
        onAction: onAction,
        actionLabel: actionLabel,
        onDismiss: () {
          _dismissTimer?.cancel();
          _dismissTimer = null;
          entry.remove();
          if (_currentEntry == entry) _currentEntry = null;
        },
      ),
    );

    _currentEntry = entry;
    overlay.insert(entry);

    if (duration.inDays < 1) {
      _dismissTimer = Timer(duration, _dismiss);
    }
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

class _ToastOverlay extends StatefulWidget {
  const _ToastOverlay({
    required this.message,
    required this.borderColor,
    required this.onDismiss,
    this.onAction,
    this.actionLabel,
  });

  final String message;
  final Color borderColor;
  final VoidCallback onDismiss;
  final VoidCallback? onAction;
  final String? actionLabel;

  @override
  State<_ToastOverlay> createState() => _ToastOverlayState();
}

class _ToastOverlayState extends State<_ToastOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Offset> _slideAnimation;
  late final Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(_controller);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Positioned(
      top: topPadding + 8,
      left: 16,
      right: 16,
      child: SlideTransition(
        position: _slideAnimation,
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Material(
            color: Colors.transparent,
            child: GestureDetector(
              onVerticalDragEnd: (details) {
                // Swipe up to dismiss
                if (details.velocity.pixelsPerSecond.dy < -100) {
                  widget.onDismiss();
                }
              },
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.backgroundDark,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.cardBorder),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.4),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                child: Row(
                  children: [
                    Container(
                      width: 3,
                      height: 36,
                      decoration: BoxDecoration(
                        color: widget.borderColor,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        widget.message,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w300,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    if (widget.onAction != null && widget.actionLabel != null)
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: GestureDetector(
                          onTap: () {
                            widget.onAction!();
                            widget.onDismiss();
                          },
                          child: Text(
                            widget.actionLabel!,
                            style: TextStyle(
                              color: widget.borderColor,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

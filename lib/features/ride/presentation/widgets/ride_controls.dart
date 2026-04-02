import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/toast.dart';

/// Long-press stop button — wide bar style with 1 second hold progress fill.
class LongPressStopButton extends StatefulWidget {
  const LongPressStopButton({super.key, required this.onStop});

  final VoidCallback onStop;

  @override
  State<LongPressStopButton> createState() => _LongPressStopButtonState();
}

class _LongPressStopButtonState extends State<LongPressStopButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  bool _holding = false;

  static const _holdDuration = Duration(milliseconds: 1000);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: _holdDuration);

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onStop();
        _controller.reset();
        setState(() => _holding = false);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDown(TapDownDetails _) {
    setState(() => _holding = true);
    _controller.forward(from: 0);
  }

  void _onUp(TapUpDetails _) => _cancel(showHint: true);
  void _onCancel() => _cancel();

  void _cancel({bool showHint = false}) {
    final wasHolding = _holding && _controller.status != AnimationStatus.completed;
    _controller.reset();
    setState(() => _holding = false);
    if (showHint && wasHolding) {
      ApexToast.success(context, 'Hold to end ride');
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _onDown,
      onTapUp: _onUp,
      onTapCancel: _onCancel,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return SizedBox(
            width: double.infinity,
            height: 56,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Stack(
                children: [
                  // Background
                  Container(
                    decoration: BoxDecoration(
                      color: _holding
                          ? AppColors.error.withValues(alpha: 0.25)
                          : AppColors.error.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppColors.error.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                  // Progress fill
                  if (_controller.value > 0)
                    FractionallySizedBox(
                      widthFactor: _controller.value,
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.35),
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(16),
                            bottomLeft: const Radius.circular(16),
                            topRight: _controller.value >= 1.0
                                ? const Radius.circular(16)
                                : Radius.zero,
                            bottomRight: _controller.value >= 1.0
                                ? const Radius.circular(16)
                                : Radius.zero,
                          ),
                        ),
                      ),
                    ),
                  // Label
                  Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.stop_rounded,
                          color: AppColors.error,
                          size: 22,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'STOP RIDE',
                          style: GoogleFonts.jetBrainsMono(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.error,
                            letterSpacing: 2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Calibrate button with ripple animation.
class CalibrateButton extends StatelessWidget {
  const CalibrateButton({super.key, required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: context.accent.withValues(alpha: 0.4)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.tune, color: context.accent, size: 16),
            const SizedBox(width: 8),
            Text(
              'Calibrate',
              style: AppTypography.interSmall.copyWith(color: context.accent),
            ),
          ],
        ),
      ),
    );
  }
}

/// Discard ride button — ghost style.
class DiscardButton extends StatelessWidget {
  const DiscardButton({super.key, required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Text(
        'Discard',
        style: GoogleFonts.inter(
          fontSize: 14,
          color: AppColors.textMuted,
          decoration: TextDecoration.underline,
          decorationColor: AppColors.textMuted,
        ),
      ),
    );
  }
}

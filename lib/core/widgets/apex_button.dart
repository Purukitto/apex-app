import 'package:flutter/material.dart';
import '../theme/app_colors.dart' show AppColors, AppColorsX;
import '../theme/app_typography.dart';

enum ApexButtonVariant { filled, outlined, ghost }

/// Primary button component. All variants animate on tap.
class ApexButton extends StatefulWidget {
  const ApexButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = ApexButtonVariant.filled,
    this.isLoading = false,
    this.accentColor,
    this.fullWidth = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final ApexButtonVariant variant;
  final bool isLoading;

  /// Override the accent color (defaults to AppColors.accent).
  final Color? accentColor;
  final bool fullWidth;

  @override
  State<ApexButton> createState() => _ApexButtonState();
}

class _ApexButtonState extends State<ApexButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final accent = widget.accentColor ?? context.accent;
    return GestureDetector(
      onTap: (widget.onPressed == null || widget.isLoading)
          ? null
          : widget.onPressed,
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
        child: _buildButton(accent),
      ),
    );
  }

  Widget _buildButton(Color accent) {
    switch (widget.variant) {
      case ApexButtonVariant.filled:
        return _FilledButton(
          label: widget.label,
          isLoading: widget.isLoading,
          accent: accent,
          fullWidth: widget.fullWidth,
          enabled: widget.onPressed != null,
        );
      case ApexButtonVariant.outlined:
        return _OutlinedButton(
          label: widget.label,
          isLoading: widget.isLoading,
          accent: accent,
          fullWidth: widget.fullWidth,
          enabled: widget.onPressed != null,
        );
      case ApexButtonVariant.ghost:
        return _GhostButton(
          label: widget.label,
          isLoading: widget.isLoading,
          accent: accent,
          fullWidth: widget.fullWidth,
          enabled: widget.onPressed != null,
        );
    }
  }
}

class _FilledButton extends StatelessWidget {
  const _FilledButton({
    required this.label,
    required this.isLoading,
    required this.accent,
    required this.fullWidth,
    required this.enabled,
  });

  final String label;
  final bool isLoading;
  final Color accent;
  final bool fullWidth;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: fullWidth ? double.infinity : null,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      decoration: BoxDecoration(
        color: enabled ? accent : accent.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(12),
      ),
      alignment: Alignment.center,
      child: isLoading
          ? SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator.adaptive(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  AppColors.backgroundDark,
                ),
              ),
            )
          : Text(
              label,
              style: AppTypography.inter.copyWith(
                color: AppColors.backgroundDark,
                fontWeight: FontWeight.w500,
                fontSize: 15,
              ),
            ),
    );
  }
}

class _OutlinedButton extends StatelessWidget {
  const _OutlinedButton({
    required this.label,
    required this.isLoading,
    required this.accent,
    required this.fullWidth,
    required this.enabled,
  });

  final String label;
  final bool isLoading;
  final Color accent;
  final bool fullWidth;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: fullWidth ? double.infinity : null,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: enabled ? accent : accent.withValues(alpha: 0.4),
        ),
      ),
      alignment: Alignment.center,
      child: isLoading
          ? SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator.adaptive(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(accent),
              ),
            )
          : Text(
              label,
              style: AppTypography.inter.copyWith(
                color: enabled ? accent : accent.withValues(alpha: 0.4),
                fontSize: 15,
              ),
            ),
    );
  }
}

class _GhostButton extends StatelessWidget {
  const _GhostButton({
    required this.label,
    required this.isLoading,
    required this.accent,
    required this.fullWidth,
    required this.enabled,
  });

  final String label;
  final bool isLoading;
  final Color accent;
  final bool fullWidth;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: fullWidth ? double.infinity : null,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      alignment: Alignment.center,
      child: isLoading
          ? SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator.adaptive(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  AppColors.textSecondary,
                ),
              ),
            )
          : Text(
              label,
              style: AppTypography.inter.copyWith(
                color: enabled ? AppColors.textSecondary : AppColors.textMuted,
                fontSize: 15,
              ),
            ),
    );
  }
}

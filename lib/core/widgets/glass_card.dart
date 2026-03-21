import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// A charcoal gradient card matching the React app's dark card style.
///
/// Use [isAccent] for highlighted / featured cards — adds green tint + glow.
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(24),
    this.isAccent = false,
    this.borderRadius = 24.0,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final bool isAccent;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final accentColor = context.accent;
    final border = isAccent
        ? accentColor.withValues(alpha: 0.20)
        : AppColors.cardBorder;
    final accentTint = Color.lerp(
      accentColor,
      Colors.black,
      0.7,
    )!.withValues(alpha: 0.5);

    return Container(
      decoration: BoxDecoration(
        gradient: isAccent
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  accentTint,
                  const Color(0xCC0A0A0A),
                  const Color(0xF20A0A0A),
                ],
              )
            : const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0x80181818), // rgba(24,24,24,0.5)
                  Color(0xCC0A0A0A), // rgba(10,10,10,0.8)
                  Color(0xF20A0A0A), // rgba(10,10,10,0.95)
                ],
              ),
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: border, width: 1),
        boxShadow: isAccent
            ? [
                BoxShadow(
                  color: accentColor.withValues(alpha: 0.15),
                  blurRadius: 32,
                  spreadRadius: 0,
                ),
              ]
            : [
                BoxShadow(
                  color: AppColors.shadowDark,
                  blurRadius: 24,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      padding: padding,
      child: child,
    );
  }
}

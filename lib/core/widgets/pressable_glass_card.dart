import 'package:flutter/material.dart';
import 'glass_card.dart';

/// A [GlassCard] that scales down slightly on press for tactile feedback.
class PressableGlassCard extends StatefulWidget {
  const PressableGlassCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(24),
    this.isAccent = false,
    this.borderRadius = 24.0,
  });

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final bool isAccent;
  final double borderRadius;

  @override
  State<PressableGlassCard> createState() => _PressableGlassCardState();
}

class _PressableGlassCardState extends State<PressableGlassCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
        child: GlassCard(
          padding: widget.padding,
          isAccent: widget.isAccent,
          borderRadius: widget.borderRadius,
          child: widget.child,
        ),
      ),
    );
  }
}

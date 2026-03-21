import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

/// Full-screen black overlay for pocket mode.
/// Dismiss: double-tap (500ms window) or swipe up (>100px).
class PocketCurtain extends StatefulWidget {
  const PocketCurtain({super.key, required this.onDismiss});

  final VoidCallback onDismiss;

  @override
  State<PocketCurtain> createState() => _PocketCurtainState();
}

class _PocketCurtainState extends State<PocketCurtain>
    with TickerProviderStateMixin {
  late final AnimationController _controller;
  late final AnimationController _fadeController;
  DateTime? _lastTap;
  double _dragStartY = 0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
    // 300ms fade-in so brief sensor flickers don't flash the curtain
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    )..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  void _handleTap() {
    final now = DateTime.now();
    if (_lastTap != null && now.difference(_lastTap!).inMilliseconds < 500) {
      widget.onDismiss();
      _lastTap = null;
    } else {
      _lastTap = now;
    }
  }

  void _handleVerticalDragStart(DragStartDetails details) {
    _dragStartY = details.globalPosition.dy;
  }

  void _handleVerticalDragEnd(DragEndDetails details) {
    // Swipe up detection handled in update
  }

  void _handleVerticalDragUpdate(DragUpdateDetails details) {
    final delta = _dragStartY - details.globalPosition.dy;
    if (delta > 100) {
      widget.onDismiss();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeController,
      child: GestureDetector(
        onTap: _handleTap,
        onVerticalDragStart: _handleVerticalDragStart,
        onVerticalDragUpdate: _handleVerticalDragUpdate,
        onVerticalDragEnd: _handleVerticalDragEnd,
        child: Container(
          color: Colors.black,
          child: Center(
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                final t = _controller.value * 2 * pi;
                // Circular motion, radius 30px
                final dx = cos(t) * 30;
                final dy = sin(t) * 30;
                // Pulsing opacity
                final opacity = 0.5 + 0.5 * sin(t * 2).abs();

                return Transform.translate(
                  offset: Offset(dx, dy),
                  child: Opacity(opacity: opacity, child: child),
                );
              },
              child: Text(
                'Pocket Mode Active',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                  letterSpacing: 2,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

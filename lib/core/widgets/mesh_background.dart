import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Full-screen mesh background with optional green aura and grid overlay.
///
/// Wrap every screen's root widget with this.
class MeshBackground extends StatelessWidget {
  const MeshBackground({
    super.key,
    required this.child,
    this.showGrid = false,
    this.backgroundColor,
  });

  final Widget child;
  final bool showGrid;

  /// Override the background color (e.g. for OLED black variant).
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final bg = backgroundColor ?? AppColors.backgroundDark;
    final isOled = bg == Colors.black;
    final gradientEnd = isOled ? const Color(0xFF050506) : AppColors.backgroundMid;
    final auraColor = Theme.of(context).colorScheme.primary.withValues(alpha: 0.15);

    return Stack(
      fit: StackFit.expand,
      children: [
        // Base gradient
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [bg, gradientEnd],
            ),
          ),
        ),

        // Top-right accent aura
        Positioned(
          top: -80,
          right: -80,
          child: Container(
            width: 300,
            height: 300,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [auraColor, Colors.transparent],
                stops: const [0.0, 1.0],
              ),
            ),
          ),
        ),

        // Optional subtle grid overlay
        if (showGrid)
          Positioned.fill(
            child: CustomPaint(
              painter: _GridPainter(),
            ),
          ),

        // Content
        child,
      ],
    );
  }
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.cardBorder.withValues(alpha: 0.4)
      ..strokeWidth = 0.5;

    const spacing = 40.0;

    for (double x = 0; x < size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

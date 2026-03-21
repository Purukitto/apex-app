import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

/// Boot → gauge sweep → ready animation sequence.
/// 3 phases: boot (800ms), gauges (1200ms), ready (500ms delay → onComplete).
class RideStartupAnimation extends StatefulWidget {
  const RideStartupAnimation({super.key, required this.onComplete});

  final VoidCallback onComplete;

  @override
  State<RideStartupAnimation> createState() => _RideStartupAnimationState();
}

class _RideStartupAnimationState extends State<RideStartupAnimation>
    with TickerProviderStateMixin {
  late final AnimationController _bootController;
  late final AnimationController _gaugeController;
  late final AnimationController _readyController;

  int _phase = 0; // 0=boot, 1=gauges, 2=ready

  @override
  void initState() {
    super.initState();

    _bootController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _gaugeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _readyController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _bootController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        setState(() => _phase = 1);
        _gaugeController.forward();
      }
    });

    _gaugeController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        setState(() => _phase = 2);
        _readyController.forward();
      }
    });

    _readyController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) widget.onComplete();
        });
      }
    });

    _bootController.forward();
  }

  @override
  void dispose() {
    _bootController.dispose();
    _gaugeController.dispose();
    _readyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.backgroundDark,
      child: Center(
        child: switch (_phase) {
          0 => _BootPhase(animation: _bootController),
          1 => _GaugePhase(animation: _gaugeController),
          _ => _ReadyPhase(animation: _readyController),
        },
      ),
    );
  }
}

class _BootPhase extends AnimatedWidget {
  const _BootPhase({required Animation<double> animation})
      : super(listenable: animation);

  @override
  Widget build(BuildContext context) {
    final progress = (listenable as Animation<double>).value;
    final pulse = (sin(progress * pi * 4) * 0.3 + 0.7).clamp(0.4, 1.0);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Opacity(
          opacity: pulse,
          child: Icon(
            Icons.two_wheeler,
            size: 64,
            color: context.accent,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'INITIALIZING...',
          style: GoogleFonts.jetBrainsMono(
            fontSize: 14,
            letterSpacing: 3,
            color: context.accent.withValues(alpha: pulse),
          ),
        ),
      ],
    );
  }
}

class _GaugePhase extends AnimatedWidget {
  const _GaugePhase({required Animation<double> animation})
      : super(listenable: animation);

  @override
  Widget build(BuildContext context) {
    final progress = (listenable as Animation<double>).value;
    final counter = (progress * 100).round();

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 120,
          height: 120,
          child: CustomPaint(
            painter: _GaugePainter(progress: progress, accentColor: context.accent),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          '$counter',
          style: GoogleFonts.jetBrainsMono(
            fontSize: 42,
            fontWeight: FontWeight.w700,
            color: context.accent,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'SYSTEMS ONLINE',
          style: GoogleFonts.jetBrainsMono(
            fontSize: 12,
            letterSpacing: 3,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}

class _GaugePainter extends CustomPainter {
  _GaugePainter({required this.progress, required this.accentColor});

  final double progress;
  final Color accentColor;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 4;

    // Background arc
    final bgPaint = Paint()
      ..color = AppColors.cardBorder
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      2 * pi,
      false,
      bgPaint,
    );

    // Progress arc
    final progressPaint = Paint()
      ..color = accentColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      2 * pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _GaugePainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.accentColor != accentColor;
}

class _ReadyPhase extends AnimatedWidget {
  const _ReadyPhase({required Animation<double> animation})
      : super(listenable: animation);

  @override
  Widget build(BuildContext context) {
    final opacity = (listenable as Animation<double>).value;

    return Opacity(
      opacity: opacity,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.two_wheeler,
            size: 48,
            color: context.accent,
          ),
          const SizedBox(height: 16),
          Text(
            'READY TO RIDE',
            style: GoogleFonts.jetBrainsMono(
              fontSize: 18,
              letterSpacing: 4,
              fontWeight: FontWeight.w600,
              color: context.accent,
            ),
          ),
        ],
      ),
    );
  }
}

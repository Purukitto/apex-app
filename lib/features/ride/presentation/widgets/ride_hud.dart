import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../providers/ride_session_provider.dart';
import 'live_ride_map.dart';

/// The telemetry HUD overlay shown during ride recording.
class RideHud extends StatefulWidget {
  const RideHud({
    super.key,
    required this.state,
  });

  final RideSessionState state;

  @override
  State<RideHud> createState() => _RideHudState();
}

class _RideHudState extends State<RideHud> {
  late final Timer _durationTimer;
  Duration _elapsed = Duration.zero;

  @override
  void initState() {
    super.initState();
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (widget.state.startTime != null &&
          widget.state.status == RideStatus.recording) {
        setState(() {
          _elapsed = DateTime.now().difference(widget.state.startTime!);
        });
      }
    });
  }

  @override
  void didUpdateWidget(RideHud oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.state.startTime != null) {
      _elapsed = DateTime.now().difference(widget.state.startTime!);
    }
  }

  @override
  void dispose() {
    _durationTimer.cancel();
    super.dispose();
  }

  String _formatDuration(Duration d) {
    final hours = d.inHours;
    final minutes = d.inMinutes.remainder(60);
    final seconds = d.inSeconds.remainder(60);
    if (hours > 0) {
      return '$hours:${minutes.toString().padLeft(2, '0')}:'
          '${seconds.toString().padLeft(2, '0')}';
    }
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.state;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          children: [
            const SizedBox(height: 4),

            // Title row: "ACTIVE RIDE" + paused badge
            _Header(
              bikeName: s.selectedBike?.nickName ??
                  '${s.selectedBike?.make ?? ''} ${s.selectedBike?.model ?? ''}'
                      .trim(),
              isPaused: s.status == RideStatus.paused,
            ),
            const SizedBox(height: 12),

            // Live map
            LiveRideMap(coords: s.coords, height: 150),
            const SizedBox(height: 16),

            // Speed with gauge arc
            _SpeedGauge(speedKmh: s.currentSpeedKmh),
            const SizedBox(height: 16),

            // Lean angle + Elevation row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Lean angle section
                _LeanSection(
                  currentLean: s.currentLean,
                  maxLeft: s.maxLeanLeft,
                  maxRight: s.maxLeanRight,
                  direction: s.leanDirection,
                ),
                // Elevation section
                _ElevationDisplay(elevation: s.currentElevation),
              ],
            ),
            const SizedBox(height: 16),

            // Stats row (distance + duration)
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    label: 'DISTANCE',
                    value: '${s.distanceKm.toStringAsFixed(2)} km',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    label: 'DURATION',
                    value: _formatDuration(_elapsed),
                  ),
                ),
              ],
            ),
            const Spacer(),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────
// Header
// ──────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.bikeName, required this.isPaused});

  final String bikeName;
  final bool isPaused;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'ACTIVE RIDE',
              style: GoogleFonts.jetBrainsMono(
                fontSize: 13,
                letterSpacing: 3,
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (isPaused) ...[
              const SizedBox(width: 12),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                      color: AppColors.warning.withValues(alpha: 0.4)),
                ),
                child: Text(
                  'PAUSED',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 11,
                    letterSpacing: 2,
                    color: AppColors.warning,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ],
        ),
        if (bikeName.isNotEmpty) ...[
          const SizedBox(height: 2),
          Text(
            bikeName,
            style: AppTypography.inter.copyWith(
              color: AppColors.textMuted,
              fontSize: 12,
            ),
          ),
        ],
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────────
// Speed gauge with arc
// ──────────────────────────────────────────────────────────────────

class _SpeedGauge extends StatelessWidget {
  const _SpeedGauge({required this.speedKmh});

  final double speedKmh;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 200,
      height: 180,
      child: CustomPaint(
        painter: _SpeedArcPainter(
          speed: speedKmh,
          maxSpeed: 200,
          accentColor: context.accent,
        ),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  speedKmh.round().toString(),
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 72,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    height: 1,
                  ),
                ),
                Text(
                  'KM/H',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 14,
                    color: AppColors.textMuted,
                    letterSpacing: 3,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SpeedArcPainter extends CustomPainter {
  _SpeedArcPainter({
    required this.speed,
    required this.maxSpeed,
    required this.accentColor,
  });

  final double speed;
  final double maxSpeed;
  final Color accentColor;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2 + 10);
    final radius = size.width / 2 - 8;

    // Arc spans from 150° to 390° (240° total sweep)
    const startAngle = 150 * pi / 180;
    const totalSweep = 240 * pi / 180;

    // Background arc
    final bgPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      totalSweep,
      false,
      bgPaint,
    );

    // Progress arc
    final progress = (speed / maxSpeed).clamp(0.0, 1.0);
    if (progress > 0) {
      final progressPaint = Paint()
        ..color = accentColor.withValues(alpha: 0.9)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 6
        ..strokeCap = StrokeCap.round;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        totalSweep * progress,
        false,
        progressPaint,
      );

      // Glow effect
      final glowPaint = Paint()
        ..color = accentColor.withValues(alpha: 0.3)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 12
        ..strokeCap = StrokeCap.round
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        totalSweep * progress,
        false,
        glowPaint,
      );
    }
  }

  @override
  bool shouldRepaint(_SpeedArcPainter oldDelegate) =>
      oldDelegate.speed != speed;
}

// ──────────────────────────────────────────────────────────────────
// Lean section (compact: L value | current | R value)
// ──────────────────────────────────────────────────────────────────

class _LeanSection extends StatelessWidget {
  const _LeanSection({
    required this.currentLean,
    required this.maxLeft,
    required this.maxRight,
    required this.direction,
  });

  final double currentLean;
  final double maxLeft;
  final double maxRight;
  final String direction;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          'LEAN ANGLE',
          style: GoogleFonts.jetBrainsMono(
            fontSize: 10,
            letterSpacing: 2,
            color: AppColors.textMuted,
          ),
        ),
        const SizedBox(height: 6),
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Left max
            Column(
              children: [
                Text(
                  'L',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 10,
                    color: AppColors.textMuted,
                    letterSpacing: 1,
                  ),
                ),
                Text(
                  '${maxLeft.toStringAsFixed(0)}°',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            // Right max
            Column(
              children: [
                Text(
                  'R',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 10,
                    color: AppColors.textMuted,
                    letterSpacing: 1,
                  ),
                ),
                Text(
                  '${maxRight.toStringAsFixed(0)}°',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────────
// Elevation display
// ──────────────────────────────────────────────────────────────────

class _ElevationDisplay extends StatelessWidget {
  const _ElevationDisplay({required this.elevation});

  final double elevation;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          'ELEVATION',
          style: GoogleFonts.jetBrainsMono(
            fontSize: 10,
            letterSpacing: 2,
            color: AppColors.textMuted,
          ),
        ),
        const SizedBox(height: 6),
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              elevation.round().toString(),
              style: GoogleFonts.jetBrainsMono(
                fontSize: 32,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
                height: 1,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 4, left: 2),
              child: Text(
                'M',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 14,
                  color: AppColors.textMuted,
                  letterSpacing: 1,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────────
// Stat card (distance, duration)
// ──────────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      borderRadius: 16,
      child: Column(
        children: [
          Text(
            label,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 10,
              letterSpacing: 2,
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 20,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

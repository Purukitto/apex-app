import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_colors.dart';
import 'glass_card.dart';

/// A shimmer sweep effect applied to a child widget.
class ShimmerEffect extends StatelessWidget {
  const ShimmerEffect({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return child
        .animate(onPlay: (c) => c.repeat())
        .shimmer(
          duration: 1500.ms,
          color: AppColors.textMuted.withValues(alpha: 0.08),
        );
  }
}

/// A GlassCard-shaped shimmer placeholder.
class ShimmerCard extends StatelessWidget {
  const ShimmerCard({
    super.key,
    this.height = 100,
    this.borderRadius = 24.0,
  });

  final double height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return ShimmerEffect(
      child: GlassCard(
        borderRadius: borderRadius,
        padding: const EdgeInsets.all(20),
        child: SizedBox(
          height: height,
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.cardBg,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ShimmerLine(width: 120),
                    const SizedBox(height: 10),
                    ShimmerLine(width: 80),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A text-line shaped shimmer placeholder.
class ShimmerLine extends StatelessWidget {
  const ShimmerLine({
    super.key,
    this.width = 100,
    this.height = 14,
  });

  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}

/// Dashboard-specific shimmer: welcome card + stats row + alert card + last ride card.
class DashboardShimmer extends StatelessWidget {
  const DashboardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: ShimmerEffect(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome card placeholder
            GlassCard(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerLine(width: 100, height: 12),
                  const SizedBox(height: 8),
                  ShimmerLine(width: 160, height: 24),
                  const SizedBox(height: 16),
                  ShimmerLine(width: 120, height: 16),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Stats row
            Row(
              children: [
                Expanded(
                  child: GlassCard(
                    padding: const EdgeInsets.all(20),
                    borderRadius: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ShimmerLine(width: 40, height: 10),
                        const SizedBox(height: 8),
                        ShimmerLine(width: 48, height: 28),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GlassCard(
                    padding: const EdgeInsets.all(20),
                    borderRadius: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ShimmerLine(width: 40, height: 10),
                        const SizedBox(height: 8),
                        ShimmerLine(width: 48, height: 28),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Alert card placeholder
            GlassCard(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.cardBg,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ShimmerLine(width: 140, height: 12),
                      const SizedBox(height: 6),
                      ShimmerLine(width: 100, height: 10),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Last ride card placeholder
            GlassCard(
              padding: const EdgeInsets.all(20),
              borderRadius: 20,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerLine(width: 60, height: 10),
                  const SizedBox(height: 12),
                  ShimmerLine(width: 160, height: 16),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      ShimmerLine(width: 60, height: 12),
                      const SizedBox(width: 16),
                      ShimmerLine(width: 60, height: 12),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    height: 180,
                    decoration: BoxDecoration(
                      color: AppColors.cardBg,
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Rides-specific shimmer: list of ride tile placeholders.
class RidesShimmer extends StatelessWidget {
  const RidesShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return ShimmerEffect(
      child: Column(
        children: List.generate(5, (index) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: GlassCard(
              padding: const EdgeInsets.all(16),
              borderRadius: 16,
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.cardBg,
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ShimmerLine(width: 120, height: 14),
                        const SizedBox(height: 6),
                        ShimmerLine(width: 80, height: 10),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      ShimmerLine(width: 50, height: 12),
                      const SizedBox(height: 4),
                      ShimmerLine(width: 35, height: 10),
                    ],
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

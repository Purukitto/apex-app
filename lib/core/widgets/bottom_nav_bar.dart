import 'dart:ui';

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

class _NavDestination {
  const _NavDestination({
    required this.icon,
    required this.activeIcon,
    required this.label,
    this.isCta = false,
  });

  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isCta;
}

const _destinations = [
  _NavDestination(
    icon: Icons.home_outlined,
    activeIcon: Icons.home,
    label: 'Home',
  ),
  _NavDestination(
    icon: Icons.two_wheeler_outlined,
    activeIcon: Icons.two_wheeler,
    label: 'Garage',
  ),
  _NavDestination(
    icon: Icons.route_outlined,
    activeIcon: Icons.route,
    label: 'History',
  ),
  _NavDestination(
    icon: Icons.play_arrow_rounded,
    activeIcon: Icons.play_arrow_rounded,
    label: 'Start Ride',
    isCta: true,
  ),
];

/// Floating pill bottom navigation bar.
class ApexBottomNavBar extends StatelessWidget {
  const ApexBottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final themeAccent = Theme.of(context).colorScheme.primary;

    return SafeArea(
      top: false,
      minimum: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(40),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xB01A1D20), Color(0xB0141416)],
                ),
                borderRadius: BorderRadius.circular(40),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: List.generate(_destinations.length, (index) {
                    final dest = _destinations[index];
                    final isActive = index == currentIndex;
                    if (dest.isCta) {
                      return _RideCtaItem(
                        destination: dest,
                        isActive: isActive,
                        accentColor: themeAccent,
                        onTap: () => onTap(index),
                      );
                    }
                    return _NavItem(
                      destination: dest,
                      isActive: isActive,
                      accentColor: themeAccent,
                      onTap: () => onTap(index),
                    );
                  }),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.destination,
    required this.isActive,
    required this.accentColor,
    required this.onTap,
  });

  final _NavDestination destination;
  final bool isActive;
  final Color accentColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        child: Icon(
          isActive ? destination.activeIcon : destination.icon,
          color: isActive ? accentColor : AppColors.textMuted,
          size: 24,
        ),
      ),
    );
  }
}

/// Visually distinct CTA button for Ride — centered green pill.
class _RideCtaItem extends StatelessWidget {
  const _RideCtaItem({
    required this.destination,
    required this.isActive,
    required this.accentColor,
    required this.onTap,
  });

  final _NavDestination destination;
  final bool isActive;
  final Color accentColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: accentColor,
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: accentColor.withValues(alpha: 0.3),
              blurRadius: 16,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Text(
          destination.label,
          style: AppTypography.interLabel.copyWith(
            color: AppColors.backgroundDark,
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.3,
          ),
        ),
      ),
    );
  }
}

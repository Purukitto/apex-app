import 'package:flutter/material.dart';
import 'package:flutter_boring_avatars/flutter_boring_avatars.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_colors.dart' show AppColors, AppColorsX;

/// Apex palette for boring avatars — dark tones with accent highlight.
BoringAvatarPalette apexAvatarPalette(BuildContext context) {
  final accent = context.accent;
  return BoringAvatarPalette([
    accent,
    const Color(0xFF1A1A1E),
    accent.withValues(alpha: 0.6),
    const Color(0xFF2A2D35),
    AppColors.textSecondary,
  ]);
}

/// A circular boring-avatar profile icon.
///
/// Tapping navigates to the profile screen by default.
class UserAvatar extends StatelessWidget {
  const UserAvatar({
    super.key,
    this.name = 'Rider',
    this.size = 32,
    this.navigateToProfile = true,
  });

  final String name;
  final double size;
  final bool navigateToProfile;

  @override
  Widget build(BuildContext context) {
    final avatar = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: context.accent.withValues(alpha: 0.3),
          width: 1.5,
        ),
      ),
      child: ClipOval(
        child: AnimatedBoringAvatar(
          name: name.isNotEmpty ? name : 'Rider',
          type: BoringAvatarType.marble,
          palette: apexAvatarPalette(context),
          shape: const OvalBorder(),
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOutCubic,
        ),
      ),
    );

    if (!navigateToProfile) return avatar;

    return GestureDetector(
      onTap: () => context.push('/profile'),
      child: avatar,
    );
  }
}

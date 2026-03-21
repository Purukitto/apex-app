import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/app_colors.dart' show AppColorsX;

/// The Apex logo rendered from SVG.
///
/// By default, the stroke color matches the current theme accent.
/// Pass [color] to override.
class ApexLogo extends StatelessWidget {
  const ApexLogo({
    super.key,
    this.size = 48,
    this.color,
  });

  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final strokeColor = color ?? context.accent;

    return SvgPicture.asset(
      'assets/logo.svg',
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(strokeColor, BlendMode.srcIn),
    );
  }
}

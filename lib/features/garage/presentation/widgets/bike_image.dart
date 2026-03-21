import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Displays a bike image from URL with fallback to a motorcycle icon.
class BikeImage extends StatelessWidget {
  const BikeImage({
    super.key,
    this.imageUrl,
    this.size = 64,
    this.borderRadius = 16,
  });

  final String? imageUrl;
  final double size;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: imageUrl != null && imageUrl!.isNotEmpty
          ? Image.network(
              imageUrl!,
              width: size,
              height: size,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => _fallback(),
            )
          : _fallback(),
    );
  }

  Widget _fallback() {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: Icon(
        Icons.two_wheeler,
        color: AppColors.textMuted,
        size: size * 0.5,
      ),
    );
  }
}

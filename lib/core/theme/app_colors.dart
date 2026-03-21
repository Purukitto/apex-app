import 'package:flutter/material.dart';

/// Extension to read the current theme accent color from context.
/// Use `context.accent` instead of `AppColors.accent` for theme-aware accent.
extension AppColorsX on BuildContext {
  Color get accent => Theme.of(this).colorScheme.primary;
  Color get accentGlow => accent.withValues(alpha: 0.15);
  Color get accentCardBg => accent.withValues(alpha: 0.05);
  Color get accentCardBorder => accent.withValues(alpha: 0.20);
}

class AppColors {
  AppColors._();

  // Background
  static const Color backgroundDark = Color(0xFF0A0A0C);
  static const Color backgroundMid = Color(0xFF121417);

  // Accent
  static const Color accent = Color(0xFF3DBF6F);
  static const Color accentMuted = Color(0xFF2D8F53);

  // Status
  static const Color error = Color(0xFFE35B5B);
  static const Color warning = Color(0xFFF5A623);

  // Card
  // rgba(255,255,255,0.03) → alpha = round(0.03*255) = 8 = 0x08
  static const Color cardBg = Color(0x08FFFFFF);
  // rgba(255,255,255,0.08) → alpha = round(0.08*255) = 20 = 0x14
  static const Color cardBorder = Color(0x14FFFFFF);

  // Accent card
  static const Color accentCardBg = Color(0x0D3DBF6F); // rgba(61,191,111,0.05)
  static const Color accentCardBorder = Color(
    0x333DBF6F,
  ); // rgba(61,191,111,0.20)

  // Text
  static const Color textPrimary = Color(0xFFF5F5F5);
  static const Color textSecondary = Color(0xFF909090);
  static const Color textMuted = Color(0xFF808080);

  // Glow / Shadow
  static const Color greenGlow = Color(0x263DBF6F); // rgba(61,191,111,0.15)
  static const Color shadowDark = Color(0x66000000); // rgba(0,0,0,0.40)

  // Theme accent variants
  static const Color cyan = Color(0xFF00BCD4);
  static const Color orange = Color(0xFFFF9800);
  static const Color amber = Color(0xFFFFC107);
}

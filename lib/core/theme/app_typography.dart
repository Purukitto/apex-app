import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTypography {
  AppTypography._();

  /// Display — page titles, sans-serif, weight 600, 28–32sp
  static TextStyle get playfairDisplay => GoogleFonts.inter(
    fontWeight: FontWeight.w600,
    fontSize: 30,
    color: AppColors.textPrimary,
  );

  static TextStyle get playfairDisplayLarge => GoogleFonts.inter(
    fontWeight: FontWeight.w600,
    fontSize: 32,
    color: AppColors.textPrimary,
  );

  static TextStyle get playfairDisplaySmall => GoogleFonts.inter(
    fontWeight: FontWeight.w600,
    fontSize: 28,
    color: AppColors.textPrimary,
  );

  /// Inter — body / labels / inputs, weight 300, 14–16sp
  static TextStyle get inter => GoogleFonts.inter(
    fontWeight: FontWeight.w300,
    fontSize: 16,
    color: AppColors.textPrimary,
  );

  static TextStyle get interSmall => GoogleFonts.inter(
    fontWeight: FontWeight.w300,
    fontSize: 14,
    color: AppColors.textPrimary,
  );

  static TextStyle get interSecondary => GoogleFonts.inter(
    fontWeight: FontWeight.w300,
    fontSize: 14,
    color: AppColors.textSecondary,
  );

  static TextStyle get interMuted => GoogleFonts.inter(
    fontWeight: FontWeight.w300,
    fontSize: 14,
    color: AppColors.textMuted,
  );

  /// Inter label — weight 300, 12sp, letterSpacing 1.5
  static TextStyle get interLabel => GoogleFonts.inter(
    fontWeight: FontWeight.w300,
    fontSize: 12,
    letterSpacing: 1.5,
    color: AppColors.textSecondary,
  );

  /// JetBrains Mono — numbers / telemetry, weight 400
  static TextStyle get jetBrainsMono => GoogleFonts.jetBrainsMono(
    fontWeight: FontWeight.w400,
    fontSize: 16,
    color: AppColors.textPrimary,
  );

  static TextStyle get jetBrainsMonoLarge => GoogleFonts.jetBrainsMono(
    fontWeight: FontWeight.w400,
    fontSize: 24,
    color: AppColors.textPrimary,
  );

  static TextStyle get jetBrainsMonoSmall => GoogleFonts.jetBrainsMono(
    fontWeight: FontWeight.w400,
    fontSize: 14,
    color: AppColors.textPrimary,
  );
}

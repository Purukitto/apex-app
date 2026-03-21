import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_colors.dart' show AppColors, AppColorsX;
import '../theme/app_typography.dart';

/// Styled text field matching the Obsidian Glass × Apex design system.
class ApexTextField extends StatelessWidget {
  const ApexTextField({
    super.key,
    this.controller,
    this.label,
    this.hint,
    this.obscureText = false,
    this.keyboardType,
    this.validator,
    this.onChanged,
    this.autofocus = false,
    this.textInputAction,
    this.onFieldSubmitted,
    this.readOnly = false,
    this.maxLength,
    this.suffixIcon,
    this.prefixIcon,
    this.enabled = true,
    this.initialValue,
    this.focusNode,
    this.maxLines = 1,
    this.minLines,
  });

  final TextEditingController? controller;
  final String? label;
  final String? hint;
  final bool obscureText;
  final TextInputType? keyboardType;
  final FormFieldValidator<String>? validator;
  final ValueChanged<String>? onChanged;
  final bool autofocus;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onFieldSubmitted;
  final bool readOnly;
  final int? maxLength;
  final Widget? suffixIcon;
  final Widget? prefixIcon;
  final bool enabled;
  final String? initialValue;
  final FocusNode? focusNode;
  final int? maxLines;
  final int? minLines;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      initialValue: initialValue,
      obscureText: obscureText,
      keyboardType: keyboardType,
      validator: validator,
      onChanged: onChanged,
      autofocus: autofocus,
      textInputAction: textInputAction,
      onFieldSubmitted: onFieldSubmitted,
      readOnly: readOnly,
      enabled: enabled,
      focusNode: focusNode,
      maxLength: maxLength,
      maxLines: obscureText ? 1 : maxLines,
      minLines: minLines,
      inputFormatters: maxLength != null
          ? [LengthLimitingTextInputFormatter(maxLength)]
          : null,
      style: AppTypography.inter.copyWith(
        fontSize: 16,
        color: AppColors.textPrimary,
      ),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        suffixIcon: suffixIcon,
        prefixIcon: prefixIcon,
        counterText: '', // hide the built-in length counter
        filled: true,
        fillColor: AppColors.cardBg,
        labelStyle: AppTypography.inter.copyWith(
          fontSize: 14,
          color: AppColors.textSecondary,
        ),
        hintStyle: AppTypography.inter.copyWith(
          fontSize: 14,
          color: AppColors.textMuted,
        ),
        errorStyle: AppTypography.interSmall.copyWith(
          color: AppColors.error,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.cardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.cardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide:
              BorderSide(color: context.accent, width: 1.5),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
              color: AppColors.cardBorder.withValues(alpha: 0.5)),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide:
              const BorderSide(color: AppColors.error, width: 1.5),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import 'shared_prefs_provider.dart';

enum AccentColor { green, cyan, orange, amber }

enum BackgroundVariant { apexBlack, oledBlack }

class ThemeState {
  final AccentColor accent;
  final BackgroundVariant background;

  const ThemeState({
    this.accent = AccentColor.green,
    this.background = BackgroundVariant.apexBlack,
  });

  ThemeState copyWith({
    AccentColor? accent,
    BackgroundVariant? background,
  }) {
    return ThemeState(
      accent: accent ?? this.accent,
      background: background ?? this.background,
    );
  }
}

class ThemeNotifier extends Notifier<ThemeState> {
  static const _keyAccent = 'theme_accent';
  static const _keyBackground = 'theme_background';

  @override
  ThemeState build() {
    final prefs = ref.read(sharedPrefsProvider);
    final accentIndex = prefs.getInt(_keyAccent) ?? 0;
    final backgroundIndex = prefs.getInt(_keyBackground) ?? 0;

    return ThemeState(
      accent: AccentColor.values[accentIndex.clamp(0, AccentColor.values.length - 1)],
      background: BackgroundVariant.values[backgroundIndex.clamp(0, BackgroundVariant.values.length - 1)],
    );
  }

  Future<void> setAccent(AccentColor accent) async {
    state = state.copyWith(accent: accent);
    final prefs = ref.read(sharedPrefsProvider);
    await prefs.setInt(_keyAccent, accent.index);
  }

  Future<void> setBackground(BackgroundVariant background) async {
    state = state.copyWith(background: background);
    final prefs = ref.read(sharedPrefsProvider);
    await prefs.setInt(_keyBackground, background.index);
  }

  /// Returns the resolved [Color] for the current accent selection.
  Color get accentColor => accentColorFor(state.accent);

  static Color accentColorFor(AccentColor accent) {
    switch (accent) {
      case AccentColor.green:
        return AppColors.accent;
      case AccentColor.cyan:
        return AppColors.cyan;
      case AccentColor.orange:
        return AppColors.orange;
      case AccentColor.amber:
        return AppColors.amber;
    }
  }

  /// Returns the resolved background [Color] for the current background variant.
  Color get backgroundColor => backgroundColorFor(state.background);

  static Color backgroundColorFor(BackgroundVariant bg) {
    switch (bg) {
      case BackgroundVariant.apexBlack:
        return AppColors.backgroundDark;
      case BackgroundVariant.oledBlack:
        return Colors.black;
    }
  }
}

final themeProvider =
    NotifierProvider<ThemeNotifier, ThemeState>(ThemeNotifier.new);

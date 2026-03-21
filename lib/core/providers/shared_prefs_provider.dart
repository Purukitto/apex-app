import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Must be overridden in main() before runApp:
///
/// ```dart
/// final prefs = await SharedPreferences.getInstance();
/// runApp(
///   ProviderScope(
///     overrides: [
///       sharedPrefsProvider.overrideWithValue(prefs),
///     ],
///     child: ApexApp(),
///   ),
/// );
/// ```
final sharedPrefsProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError(
    'sharedPrefsProvider must be overridden in ProviderScope with '
    'SharedPreferences.getInstance()',
  );
});

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../database/app_database.dart';

/// Must be overridden in main() before runApp, same pattern as sharedPrefsProvider.
///
/// ```dart
/// final db = await constructDb();
/// runApp(
///   ProviderScope(
///     overrides: [
///       databaseProvider.overrideWithValue(db),
///     ],
///     child: ApexApp(),
///   ),
/// );
/// ```
final databaseProvider = Provider<AppDatabase>((ref) {
  throw UnimplementedError(
    'databaseProvider must be overridden in ProviderScope with constructDb()',
  );
});

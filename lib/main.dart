import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app.dart';
import 'core/config/app_config.dart';
import 'core/database/app_database.dart';
import 'core/providers/database_provider.dart';
import 'core/providers/shared_prefs_provider.dart';
import 'core/services/firebase_service.dart';
import 'core/services/local_notification_service.dart';
import 'core/utils/logger.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Edge-to-edge display
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarDividerColor: Colors.transparent,
  ));

  await AppConfig.initialize(environment: Environment.prod);

  // Initialize Firebase & local notifications
  try {
    await FirebaseService.init();
    await LocalNotificationService.init();
  } catch (e) {
    AppLogger.w('Notification services init failed (non-fatal)', e);
  }

  final prefs = await SharedPreferences.getInstance();
  final db = await constructDb();

  runApp(
    ProviderScope(
      overrides: [
        sharedPrefsProvider.overrideWithValue(prefs),
        databaseProvider.overrideWithValue(db),
      ],
      child: const ApexApp(),
    ),
  );
}

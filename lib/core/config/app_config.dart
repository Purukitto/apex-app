import 'package:supabase_flutter/supabase_flutter.dart';

import 'env.dart';

enum Environment { dev, prod }

class AppConfig {
  static late Environment currentEnvironment;

  static Future<void> initialize({required Environment environment}) async {
    currentEnvironment = environment;

    await Supabase.initialize(
      url: Env.supabaseUrl,
      anonKey: Env.supabaseAnonKey,
    );
  }

  static bool get isDev => currentEnvironment == Environment.dev;
  static bool get isProd => currentEnvironment == Environment.prod;
}

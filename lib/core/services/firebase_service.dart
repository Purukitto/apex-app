import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../utils/logger.dart';
import 'local_notification_service.dart';

/// Top-level background message handler (must be top-level function).
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  AppLogger.i('Background FCM message: ${message.messageId}');
  await LocalNotificationService.showFromRemoteMessage(message);
}

/// Manages Firebase Cloud Messaging: init, token registration, and message handling.
class FirebaseService {
  FirebaseService._();

  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static bool _initialized = false;

  /// Initialize Firebase and set up message handlers.
  static Future<void> init() async {
    if (_initialized) return;

    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    _initialized = true;

    // Foreground message handler
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Token refresh listener
    _messaging.onTokenRefresh.listen((token) {
      AppLogger.i('FCM token refreshed');
      final uid = Supabase.instance.client.auth.currentUser?.id;
      if (uid != null) {
        registerToken(uid);
      }
    });

    AppLogger.i('Firebase initialized');
  }

  /// Request notification permission (Android 13+).
  static Future<bool> requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    final granted =
        settings.authorizationStatus == AuthorizationStatus.authorized;
    AppLogger.i('Notification permission: ${settings.authorizationStatus}');
    return granted;
  }

  /// Get the current FCM token.
  static Future<String?> getToken() async {
    try {
      return await _messaging.getToken();
    } catch (e) {
      AppLogger.e('Failed to get FCM token', e);
      return null;
    }
  }

  /// Register the FCM token with Supabase via `upsert_push_token` RPC.
  static Future<void> registerToken(String userId) async {
    final token = await getToken();
    if (token == null) return;

    try {
      await Supabase.instance.client.rpc(
        'upsert_push_token',
        params: {
          'p_token': token,
          'p_platform': 'android',
          'p_device_id': null,
        },
      );
      AppLogger.i('FCM token registered for user $userId');
    } catch (e) {
      AppLogger.e('Failed to register FCM token', e);
    }
  }

  /// Handle foreground messages — show a local notification.
  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    AppLogger.i('Foreground FCM message: ${message.messageId}');
    await LocalNotificationService.showFromRemoteMessage(message);
  }
}

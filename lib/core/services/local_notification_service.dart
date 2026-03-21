import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import '../utils/logger.dart';

/// Notification ID bound — 32-bit signed int max.
const _idBound = 2147483647;

/// Manages local notifications: scheduling, display, and cancellation.
class LocalNotificationService {
  LocalNotificationService._();

  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  static bool _initialized = false;

  /// Android notification channel for maintenance reminders.
  static const _maintenanceChannel = AndroidNotificationChannel(
    'maintenance',
    'Maintenance Reminders',
    description: 'Reminders for upcoming motorcycle maintenance',
    importance: Importance.high,
  );

  /// Android notification channel for general push notifications.
  static const _generalChannel = AndroidNotificationChannel(
    'general',
    'General',
    description: 'General notifications',
    importance: Importance.high,
  );

  /// Initialize the local notification plugin.
  static Future<void> init() async {
    if (_initialized) return;

    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const settings = InitializationSettings(android: androidSettings);

    await _plugin.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Create notification channels
    final androidPlugin = _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    await androidPlugin?.createNotificationChannel(
      AndroidNotificationChannel(
        _maintenanceChannel.id,
        _maintenanceChannel.name,
        description: _maintenanceChannel.description,
        importance: _maintenanceChannel.importance,
      ),
    );
    await androidPlugin?.createNotificationChannel(
      AndroidNotificationChannel(
        _generalChannel.id,
        _generalChannel.name,
        description: _generalChannel.description,
        importance: _generalChannel.importance,
      ),
    );

    // Initialize timezone data for scheduled notifications
    tz.initializeTimeZones();

    _initialized = true;
    AppLogger.i('Local notifications initialized');
  }

  /// Request notification permissions (Android 13+).
  static Future<bool> requestPermissions() async {
    final androidPlugin = _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    final granted = await androidPlugin?.requestNotificationsPermission();
    return granted ?? false;
  }

  /// Show a notification from an FCM remote message.
  static Future<void> showFromRemoteMessage(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    final id = message.messageId.hashCode % _idBound;

    await _plugin.show(
      id,
      notification.title ?? 'Apex',
      notification.body ?? '',
      NotificationDetails(
        android: AndroidNotificationDetails(
          _generalChannel.id,
          _generalChannel.name,
          channelDescription: _generalChannel.description,
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
      payload: jsonEncode(message.data),
    );
  }

  /// Schedule a maintenance notification at a specific date/time.
  static Future<void> scheduleMaintenanceNotification({
    required String scheduleId,
    required String partName,
    required String bikeName,
    required DateTime notificationDate,
  }) async {
    final id = _deriveId(scheduleId);

    // Cancel existing notification for this schedule
    await _plugin.cancel(id);

    // Don't schedule in the past
    if (notificationDate.isBefore(DateTime.now())) return;

    await _plugin.zonedSchedule(
      id,
      '$partName service due',
      '$bikeName — $partName maintenance is due soon',
      _toTZDateTime(notificationDate),
      NotificationDetails(
        android: AndroidNotificationDetails(
          _maintenanceChannel.id,
          _maintenanceChannel.name,
          channelDescription: _maintenanceChannel.description,
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      payload: jsonEncode({
        'scheduleId': scheduleId,
        'partName': partName,
        'bikeName': bikeName,
        'type': 'maintenance',
      }),
    );

    AppLogger.i(
      'Scheduled maintenance notification for $partName ($bikeName) at $notificationDate',
    );
  }

  /// Trigger an immediate distance-based maintenance notification.
  static Future<void> triggerDistanceNotification({
    required String partName,
    required String bikeName,
  }) async {
    final id = '${partName}_$bikeName'.hashCode.abs() % _idBound;

    await _plugin.show(
      id,
      '$partName service overdue',
      '$bikeName — $partName has exceeded its service interval',
      NotificationDetails(
        android: AndroidNotificationDetails(
          _maintenanceChannel.id,
          _maintenanceChannel.name,
          channelDescription: _maintenanceChannel.description,
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
      payload: jsonEncode({
        'partName': partName,
        'bikeName': bikeName,
        'type': 'maintenance',
      }),
    );
  }

  /// Cancel a scheduled maintenance notification by schedule ID.
  static Future<void> cancelMaintenanceNotification(String scheduleId) async {
    await _plugin.cancel(_deriveId(scheduleId));
  }

  /// Cancel all pending notifications.
  static Future<void> cancelAllMaintenanceNotifications() async {
    await _plugin.cancelAll();
  }

  /// Derive a 32-bit int notification ID from a UUID schedule ID.
  static int _deriveId(String scheduleId) {
    final hex = scheduleId.replaceAll('-', '').substring(0, 8);
    return int.parse(hex, radix: 16) % _idBound;
  }

  /// Convert DateTime to TZDateTime for scheduling.
  /// Uses the device's local timezone.
  static tz.TZDateTime _toTZDateTime(DateTime dateTime) {
    return tz.TZDateTime.from(dateTime, tz.local);
  }

  static void _onNotificationTap(NotificationResponse response) {
    AppLogger.d('Notification tapped: ${response.payload}');
    // Navigation handled by the app shell when it receives the payload
  }
}

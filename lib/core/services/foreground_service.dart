import 'package:flutter_foreground_task/flutter_foreground_task.dart';

import '../utils/logger.dart';

/// Wrapper for flutter_foreground_task — keeps the app alive during ride recording.
class ForegroundService {
  bool _initialized = false;

  /// Initialize and start the foreground service with a persistent notification.
  Future<void> startService({
    String title = 'Apex — Recording Ride',
    String text = 'GPS tracking active',
  }) async {
    if (!_initialized) {
      FlutterForegroundTask.init(
        androidNotificationOptions: AndroidNotificationOptions(
          channelId: 'apex_ride_recording',
          channelName: 'Ride Recording',
          channelDescription: 'Shows when a ride is being recorded',
          channelImportance: NotificationChannelImportance.LOW,
          priority: NotificationPriority.LOW,
        ),
        iosNotificationOptions: const IOSNotificationOptions(
          showNotification: false,
        ),
        foregroundTaskOptions: ForegroundTaskOptions(
          eventAction: ForegroundTaskEventAction.nothing(),
          autoRunOnBoot: false,
          autoRunOnMyPackageReplaced: false,
          allowWakeLock: true,
          allowWifiLock: false,
        ),
      );
      _initialized = true;
    }

    await FlutterForegroundTask.startService(
      notificationTitle: title,
      notificationText: text,
    );

    AppLogger.i('Foreground service started');
  }

  /// Update the notification text (e.g., to show distance).
  Future<void> updateNotification({
    required String title,
    required String text,
  }) async {
    await FlutterForegroundTask.updateService(
      notificationTitle: title,
      notificationText: text,
    );
  }

  /// Stop the foreground service.
  Future<void> stopService() async {
    await FlutterForegroundTask.stopService();
    AppLogger.i('Foreground service stopped');
  }
}

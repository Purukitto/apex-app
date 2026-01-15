import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { logger } from './logger';

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    logger.debug('Notifications not available on web platform');
    return false;
  }

  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') {
      return true;
    }

    const { display: requestResult } = await LocalNotifications.requestPermissions();
    return requestResult === 'granted';
  } catch (error) {
    logger.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Schedule a time-based notification for maintenance
 */
export async function scheduleMaintenanceNotification(
  scheduleId: string,
  partName: string,
  bikeName: string,
  notificationDate: Date
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    logger.debug('Notifications not available on web platform');
    return;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      logger.warn('Notification permission not granted, skipping schedule');
      return;
    }

    // Cancel any existing notifications for this schedule
    await cancelMaintenanceNotification(scheduleId);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: parseInt(scheduleId.replace(/-/g, '').substring(0, 8), 16) % 2147483647, // Convert UUID to int, ensure it's within valid range
          title: `⚠️ ${partName} Due`,
          body: `${bikeName} - ${partName} service is due`,
          schedule: { at: notificationDate },
          sound: 'default',
          attachments: undefined,
          actionTypeId: 'MAINTENANCE_DUE',
          extra: {
            scheduleId,
            partName,
            bikeName,
            type: 'maintenance',
          },
        },
      ],
    });

    logger.debug('Scheduled maintenance notification:', {
      scheduleId,
      partName,
      notificationDate: notificationDate.toISOString(),
    });
  } catch (error) {
    logger.error('Error scheduling maintenance notification:', error);
  }
}

/**
 * Cancel a scheduled maintenance notification
 */
export async function cancelMaintenanceNotification(
  scheduleId: string
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const notificationId = parseInt(
      scheduleId.replace(/-/g, '').substring(0, 8),
      16
    ) % 2147483647;

    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }],
    });

    logger.debug('Cancelled maintenance notification:', scheduleId);
  } catch (error) {
    logger.warn('Error cancelling notification (may not exist):', error);
  }
}

/**
 * Cancel all pending maintenance notifications
 */
export async function cancelAllMaintenanceNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const { notifications } = await LocalNotifications.getPending();
    if (!notifications) return;

    const maintenanceNotificationIds = notifications
      .filter((n) => n.extra?.type === 'maintenance')
      .map((n) => ({ id: n.id }));

    if (maintenanceNotificationIds.length > 0) {
      await LocalNotifications.cancel({
        notifications: maintenanceNotificationIds,
      });
      logger.debug(
        `Cancelled ${maintenanceNotificationIds.length} maintenance notifications`
      );
    }
  } catch (error) {
    logger.error('Error cancelling all maintenance notifications:', error);
  }
}

/**
 * Trigger an immediate notification for distance-based maintenance
 */
export async function triggerDistanceBasedNotification(
  partName: string,
  bikeName: string
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    logger.debug('Notifications not available on web platform');
    return;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      logger.warn('Notification permission not granted, skipping notification');
      return;
    }

    // Use a random ID for immediate notifications (they're not scheduled)
    const notificationId = Math.floor(Math.random() * 1000000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: `⚠️ ${partName} Due!`,
          body: `${bikeName} - ${partName} service is due based on distance`,
          sound: 'default',
          actionTypeId: 'MAINTENANCE_DUE',
          extra: {
            partName,
            bikeName,
            type: 'maintenance',
            immediate: true,
          },
        },
      ],
    });

    logger.debug('Triggered distance-based notification:', {
      partName,
      bikeName,
    });
  } catch (error) {
    logger.error('Error triggering distance-based notification:', error);
  }
}

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { getMessaging, getToken } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabaseClient';
import { pushNotificationsEnabled } from '../config/notifications';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
const firebaseApp = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const webVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let nativeListenersRegistered = false;

async function upsertPushToken(token: string, platform: 'web' | 'ios' | 'android') {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logger.warn('Skipping push token upsert: user not authenticated');
    return;
  }

  const { error } = await supabase.rpc('upsert_push_token', {
    p_token: token,
    p_platform: platform,
    p_device_id: null,
  });

  if (error) {
    logger.error('Failed to upsert push token:', error);
  }
}

async function registerWebPush() {
  if (!hasFirebaseConfig || !webVapidKey) {
    logger.warn('Web push disabled: missing Firebase config or VAPID key');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    logger.warn('Web push disabled: service worker not available');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      logger.warn('Web push permission not granted');
      return;
    }

    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    );
    if (!firebaseApp) {
      logger.warn('Web push disabled: Firebase app not configured');
      return;
    }

    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, {
      vapidKey: webVapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await upsertPushToken(token, 'web');
    } else {
      logger.warn('No web push token returned');
    }
  } catch (error) {
    logger.error('Failed to register web push notifications:', error);
  }
}

async function registerNativePush() {
  if (nativeListenersRegistered) {
    return;
  }

  nativeListenersRegistered = true;

  try {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      logger.warn('Native push permission not granted');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
      await upsertPushToken(token.value, platform);
    });

    PushNotifications.addListener('registrationError', (error) => {
      logger.error('Native push registration error:', error);
    });
  } catch (error) {
    logger.error('Failed to register native push notifications:', error);
  }
}

export async function registerPushNotifications(): Promise<void> {
  if (!pushNotificationsEnabled) {
    return;
  }

  if (Capacitor.isNativePlatform()) {
    await registerNativePush();
    return;
  }

  await registerWebPush();
}

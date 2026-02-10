import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Motion } from '@capacitor/motion';
import { Sensors } from '@danyalwe/capacitor-sensors';
import { logger } from '../lib/logger';

interface ShakeDetectionOptions {
  enabled: boolean;
  onShake: () => void;
  threshold?: number;
  cooldownMs?: number;
}

// Gravity magnitude ~9.8; 40+ requires a deliberate shake (ref: shake.js, Instabug defaults).
const DEFAULT_THRESHOLD = 40;
const DEFAULT_COOLDOWN_MS = 10_000;
const SHAKE_WINDOW_MS = 800;
const MIN_SHAKES = 3;

export const useShakeDetection = ({
  enabled,
  onShake,
  threshold = DEFAULT_THRESHOLD,
  cooldownMs = DEFAULT_COOLDOWN_MS,
}: ShakeDetectionOptions) => {
  const lastShakeRef = useRef(0);
  const lastTriggerRef = useRef(0);
  const shakeCountRef = useRef(0);
  const listenerRef = useRef<{ remove: () => void } | null>(null);
  const isAppActiveRef = useRef(true);

  useEffect(() => {
    if (!enabled || !Capacitor.isNativePlatform()) {
      return () => {};
    }

    const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
      isAppActiveRef.current = isActive;
    });

    const handleShake = () => {
      const now = Date.now();
      if (now - lastTriggerRef.current < cooldownMs) {
        return;
      }

      lastTriggerRef.current = now;
      shakeCountRef.current = 0;
      onShake();
    };

    const handleAcceleration = (x: number, y: number, z: number) => {
      if (!isAppActiveRef.current) return;

      const magnitude = Math.sqrt((x * x) + (y * y) + (z * z));
      const now = Date.now();

      if (magnitude < threshold) {
        return;
      }

      if (now - lastShakeRef.current <= SHAKE_WINDOW_MS) {
        shakeCountRef.current += 1;
      } else {
        shakeCountRef.current = 1;
      }

      lastShakeRef.current = now;

      if (shakeCountRef.current >= MIN_SHAKES) {
        handleShake();
      }
    };

    const setupListener = async () => {
      try {
        const platform = Capacitor.getPlatform();

        if (platform === 'android') {
          const availableSensors = await Sensors.getAvailableSensors();
          if (!availableSensors.sensors.includes('ACCELEROMETER')) {
            logger.warn('Accelerometer not available for shake detection');
            return;
          }

          await Sensors.init({ type: 'ACCELEROMETER', delay: 'UI' });
          await Sensors.start({ type: 'ACCELEROMETER' });

          const listener = await Sensors.addListener('ACCELEROMETER', (result) => {
            const [x, y, z] = result.values;
            if ([x, y, z].some((value) => value === undefined || Number.isNaN(value))) {
              return;
            }
            handleAcceleration(x, y, z);
          });

          listenerRef.current = listener;
          return;
        }

        if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
          const deviceMotionEvent = window.DeviceMotionEvent as unknown as {
            requestPermission?: () => Promise<string>;
          };

          if (typeof deviceMotionEvent.requestPermission === 'function') {
            const permission = await deviceMotionEvent.requestPermission();
            if (permission !== 'granted') {
              logger.warn('Motion permission denied for shake detection');
              return;
            }
          }
        }

        const listener = await Motion.addListener('accel', (event) => {
          const { x, y, z } = event.accelerationIncludingGravity;
          if ([x, y, z].some((value) => value === undefined || Number.isNaN(value))) {
            return;
          }
          handleAcceleration(x, y, z);
        });

        listenerRef.current = listener;
      } catch (error) {
        logger.error('Failed to initialize shake detection:', error);
      }
    };

    setupListener();

    return () => {
      void appStateListener.then((h) => h.remove());
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }

      Sensors.stop({ type: 'ACCELEROMETER' }).catch(() => {
        // Ignore cleanup errors
      });
    };
  }, [cooldownMs, enabled, onShake, threshold]);
};

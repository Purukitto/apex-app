import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Sensors } from '@danyalwe/capacitor-sensors';
import { useRideStore } from '../stores/useRideStore';

/**
 * Hook to detect proximity sensor and manage pocket mode
 * Automatically activates pocket mode when phone proximity sensor detects coverage
 */
export function usePocketModeDetection() {
  const proximityListenerRef = useRef<Awaited<ReturnType<typeof Sensors.addListener>> | undefined>(undefined);
  const isMobile = Capacitor.isNativePlatform();
  const isRecording = useRideStore((state) => state.isRecording);
  const isPaused = useRideStore((state) => state.isPaused);

  useEffect(() => {
    // Only detect proximity when recording and not paused
    if (!isRecording || isPaused || !isMobile) {
      // Clean up listener if recording stops
      if (proximityListenerRef.current) {
        try {
          proximityListenerRef.current.remove();
          proximityListenerRef.current = undefined;
          useRideStore.getState().setPocketMode(false);
        } catch (error) {
          console.warn('Error removing proximity listener:', error);
          proximityListenerRef.current = undefined;
        }
      }
      return;
    }

    const platform = Capacitor.getPlatform();
    
    // Proximity sensor is only available on Android via @danyalwe/capacitor-sensors
    if (platform !== 'android') {
      console.log('Proximity sensor not available on this platform');
      return;
    }

    const setupProximitySensor = async () => {
      try {
        // Check if proximity sensor is available
        const availableSensors = await Sensors.getAvailableSensors();
        console.log('Available sensors:', availableSensors);

        if (!availableSensors.sensors.includes('PROXIMITY')) {
          console.log('Proximity sensor not available on this device');
          return;
        }

        // Initialize the proximity sensor
        const sensorData = await Sensors.init({ type: 'PROXIMITY', delay: 'UI' });
        console.log('Proximity sensor initialized:', sensorData);

        if (!sensorData) {
          console.error('Failed to initialize proximity sensor');
          return;
        }

        // Start the proximity sensor
        await Sensors.start({ type: 'PROXIMITY' });
        console.log('✅ Started proximity sensor');

        // Add listener for proximity sensor data
        // SensorResult.values[0] is the proximity value
        // 0 = FAR (not covered), > 0 = NEAR (covered)
        const listener = await Sensors.addListener('PROXIMITY', (result) => {
          const proximityValue = result.values[0];
          const isNear = proximityValue > 0;
          const currentPocketMode = useRideStore.getState().isPocketMode;

          console.log('[Proximity] Value:', proximityValue, 'Near:', isNear);

          if (isNear && !currentPocketMode) {
            console.log('[Proximity] Phone covered - activating pocket mode');
            useRideStore.getState().setPocketMode(true);
          } else if (!isNear && currentPocketMode) {
            console.log('[Proximity] Phone uncovered - deactivating pocket mode');
            useRideStore.getState().setPocketMode(false);
          }
        });

        proximityListenerRef.current = listener as unknown as Awaited<ReturnType<typeof Sensors.addListener>>;
        console.log('✅ Proximity sensor listener added successfully');
      } catch (error) {
        console.error('❌ Failed to setup proximity sensor:', error);
        // Don't block recording if proximity sensor fails
      }
    };

    setupProximitySensor();

    return () => {
      if (proximityListenerRef.current) {
        try {
          proximityListenerRef.current.remove();
          proximityListenerRef.current = undefined;
        } catch (error) {
          console.warn('Error removing proximity listener:', error);
          proximityListenerRef.current = undefined;
        }
      }
      
      // Stop proximity sensor
      Sensors.stop({ type: 'PROXIMITY' }).catch((err: unknown) => {
        console.warn('Error stopping proximity sensor:', err);
      });
    };
  }, [isRecording, isPaused, isMobile]);
}

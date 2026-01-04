import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, type Position } from '@capacitor/geolocation';
import { Motion, type AccelListenerEvent } from '@capacitor/motion';

export const useRideRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [currentLean, setCurrentLean] = useState(0);

  const isMobile = Capacitor.isNativePlatform();

  // Geolocation tracking
  useEffect(() => {
    let watchId: string | undefined;
    if (isRecording && isMobile) {
      Geolocation.watchPosition(
        { enableHighAccuracy: true },
        (position: Position | null, err?: Error) => {
          if (err) {
            console.error('Geolocation error:', err);
            return;
          }
          if (position?.coords) {
            setCoords((prev) => [
              ...prev,
              [position.coords.longitude, position.coords.latitude],
            ]);
          }
        }
      ).then((id: string) => {
        watchId = id;
      });
    }
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [isRecording, isMobile]);

  // Lean Angle Logic (Simplified for MVP)
  useEffect(() => {
    let motionListener: Awaited<ReturnType<typeof Motion.addListener>> | undefined;
    if (isRecording && isMobile) {
      Motion.addListener('accel', (event: AccelListenerEvent) => {
        // Simple roll calculation from gravity vector
        const roll = Math.atan2(
          event.accelerationIncludingGravity.x,
          event.accelerationIncludingGravity.z
        ) * (180 / Math.PI);
        setCurrentLean(Math.abs(Math.round(roll)));
      }).then((listener) => {
        motionListener = listener;
      });
    }
    return () => {
      if (motionListener) {
        motionListener.remove();
      }
    };
  }, [isRecording, isMobile]);

  const startRide = () => {
    setIsRecording(true);
    setCoords([]);
  };

  const stopRide = async () => {
    setIsRecording(false);
    // Logic to save 'coords' as a PostGIS LineString goes here
  };

  return { isRecording, coords, currentLean, startRide, stopRide };
};
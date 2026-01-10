import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, type Position } from '@capacitor/geolocation';
import { Motion, type AccelListenerEvent } from '@capacitor/motion';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { apexToast } from '../lib/toast';
import { useRideStore } from '../stores/useRideStore';

interface Coordinate {
  longitude: number;
  latitude: number;
  timestamp: number;
  speed?: number; // m/s
}

interface RideTrackingState {
  isRecording: boolean;
  isPaused: boolean;
  coords: Coordinate[];
  currentLean: number;
  maxLeanLeft: number;
  maxLeanRight: number;
  startTime: Date | null;
  distanceKm: number;
  permissionsGranted: {
    location: boolean;
    motion: boolean;
  };
}

/**
 * Custom hook for tracking motorcycle rides with GPS and motion sensors
 * Features:
 * - GPS tracking with 2-5 second intervals
 * - Lean angle calculation from accelerometer
 * - Peak filter for max lean angles
 * - Auto-pause when stationary for 5+ minutes
 * - PostGIS LineString persistence
 */
export const useRideTracking = () => {
  const isMobile = Capacitor.isNativePlatform();

  // Restore state from Zustand store on mount
  const storeState = useRideStore.getState();
  const [state, setState] = useState<RideTrackingState>({
    isRecording: storeState.isRecording,
    isPaused: storeState.isPaused,
    coords: storeState.coords,
    currentLean: storeState.currentLean,
    maxLeanLeft: storeState.maxLeanLeft,
    maxLeanRight: storeState.maxLeanRight,
    startTime: storeState.startTime,
    distanceKm: storeState.distanceKm,
    permissionsGranted: {
      location: false,
      motion: false,
    },
  });

  const watchIdRef = useRef<string | undefined>(undefined);
  const motionListenerRef = useRef<Awaited<ReturnType<typeof Motion.addListener>> | undefined>(undefined);
  const lastNonZeroSpeedTimeRef = useRef<number | null>(null);
  const autoPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  const calculateDistance = useCallback(
    (coord1: Coordinate, coord2: Coordinate): number => {
      const R = 6371; // Earth's radius in km
      const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
      const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((coord1.latitude * Math.PI) / 180) *
          Math.cos((coord2.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  /**
   * Check and request permissions for location and motion
   */
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (!isMobile) {
      setState((prev) => ({
        ...prev,
        permissionsGranted: { location: false, motion: false },
      }));
      return false;
    }

    try {
      // Check if Geolocation API is available
      if (!Geolocation || typeof Geolocation.checkPermissions !== 'function') {
        console.warn('Geolocation API not available');
        setState((prev) => ({
          ...prev,
          permissionsGranted: { location: false, motion: true },
        }));
        // In live reload or web mode, allow proceeding (will fail gracefully)
        return true;
      }

      // Check location permissions
      let locationGranted = false;
      try {
        const locationStatus = await Geolocation.checkPermissions();
        console.log('Location permission status:', locationStatus);
        locationGranted = locationStatus.location === 'granted';

        if (!locationGranted) {
          console.log('Requesting location permissions...');
          // This will show the native Android permission dialog
          const locationRequest = await Geolocation.requestPermissions();
          console.log('Location permission request result:', locationRequest);
          locationGranted = locationRequest.location === 'granted';
          
          if (!locationGranted) {
            // Show user-friendly error
            apexToast.error(
              'Location permission is required to track rides. Please grant permission in app settings.'
            );
            return false;
          }
        }
      } catch (locationError) {
        console.error('Location permission error:', locationError);
        const errorMessage = locationError instanceof Error ? locationError.message : String(locationError);
        
        // Check if it's a manifest permission error (shouldn't happen after fix, but handle gracefully)
        if (errorMessage.includes('AndroidManifest.xml') || errorMessage.includes('ACCESS_FINE_LOCATION')) {
          // This is a development issue - log it but show user-friendly message
          console.error('Manifest permission error detected - app needs to be rebuilt');
          apexToast.error(
            'Location permissions not available. Please contact support.'
          );
          return false;
        }
        
        // For other errors, show user-friendly message
        apexToast.error(
          'Unable to request location permission. Please check app settings.'
        );
        return false;
      }

      // Motion permissions are handled by the browser/OS automatically
      // No explicit permission check needed for @capacitor/motion
      // The listener will fail gracefully if permissions are denied
      const motionGranted = true;

      setState((prev) => ({
        ...prev,
        permissionsGranted: {
          location: locationGranted,
          motion: motionGranted,
        },
      }));

      if (!locationGranted) {
        apexToast.error(
          'Location permission is required to track rides. Please grant permission in app settings.'
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Permission check error:', error);
      // In live reload mode, allow proceeding - errors will be handled by the actual API calls
      // Only show error if it's a real permission denial, not an API availability issue
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
        apexToast.error('Permission denied. Please grant location access in app settings.');
        return false;
      }
      // For other errors (like API not available in live reload), allow proceeding
      setState((prev) => ({
        ...prev,
        permissionsGranted: { location: true, motion: true },
      }));
      return true;
    }
  }, [isMobile]);

  /**
   * Convert coordinates array to PostGIS WKT LineString format
   * Format: 'SRID=4326;LINESTRING(lon lat, lon lat, ...)'
   * This is the format Supabase PostGIS geography columns expect
   */
  const coordsToPostGISWKT = useCallback(
    (coords: Coordinate[]): string | null => {
      if (coords.length === 0) return null;
      const points = coords
        .map((coord) => `${coord.longitude} ${coord.latitude}`)
        .join(', ');
      return `SRID=4326;LINESTRING(${points})`;
    },
    []
  );

  /**
   * Save ride to Supabase with PostGIS LineString
   */
  const saveRide = useMutation({
    mutationFn: async ({
      bikeId,
      coords,
      startTime,
      endTime,
      maxLeanLeft,
      maxLeanRight,
    }: {
      bikeId: string;
      coords: Coordinate[];
      startTime: Date;
      endTime: Date;
      maxLeanLeft: number;
      maxLeanRight: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate total distance
      let totalDistance = 0;
      for (let i = 1; i < coords.length; i++) {
        totalDistance += calculateDistance(coords[i - 1], coords[i]);
      }

      // Convert to PostGIS WKT format for geography column
      const routePathWKT = coordsToPostGISWKT(coords);

      console.log('Saving ride with route path:', {
        coordsCount: coords.length,
        wktLength: routePathWKT?.length,
        wktPreview: routePathWKT?.substring(0, 100),
      });

      // For Supabase PostGIS geography columns, we need to use an RPC function
      // that calls ST_GeomFromGeoJSON to convert GeoJSON to geography
      // Create GeoJSON object
      const geoJSON = coords.length >= 2
        ? {
            type: 'LineString' as const,
            coordinates: coords.map((c) => [c.longitude, c.latitude]) as [number, number][],
          }
        : null;

      console.log('Inserting ride:', {
        bikeId,
        coordsCount: coords.length,
        hasRoutePath: !!geoJSON,
        routePathPreview: geoJSON ? `${geoJSON.coordinates.length} points` : 'none',
      });

      // Use RPC function to insert with PostGIS geometry conversion
      // The RPC function uses ST_GeomFromGeoJSON to convert GeoJSON to geography
      let data, error;
      
      if (geoJSON && coords.length >= 2) {
        // Try using RPC function first (requires SQL function in Supabase)
        const rpcResult = await supabase.rpc('insert_ride_with_geometry', {
          p_bike_id: bikeId,
          p_user_id: user.id,
          p_start_time: startTime.toISOString(),
          p_end_time: endTime.toISOString(),
          p_distance_km: Math.round(totalDistance * 100) / 100,
          p_max_lean_left: Math.round(maxLeanLeft * 10) / 10,
          p_max_lean_right: Math.round(maxLeanRight * 10) / 10,
          p_route_path_geojson: JSON.stringify(geoJSON),
        });
        
        data = rpcResult.data;
        error = rpcResult.error;
        
        // If RPC function doesn't exist, fall back to direct insert without geometry
        if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
          console.warn('RPC function not found. Inserting ride without route path. Please create the RPC function in Supabase (see supabase_rpc_function.sql).');
          const directResult = await supabase
            .from('rides')
            .insert({
              bike_id: bikeId,
              user_id: user.id,
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
              distance_km: Math.round(totalDistance * 100) / 100,
              max_lean_left: Math.round(maxLeanLeft * 10) / 10,
              max_lean_right: Math.round(maxLeanRight * 10) / 10,
              route_path: null, // Can't insert geometry without RPC function
            })
            .select()
            .single();
          
          data = directResult.data;
          error = directResult.error;
        }
      } else {
        // No route path, insert without geometry
        const directResult = await supabase
          .from('rides')
          .insert({
            bike_id: bikeId,
            user_id: user.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            distance_km: Math.round(totalDistance * 100) / 100,
            max_lean_left: Math.round(maxLeanLeft * 10) / 10,
            max_lean_right: Math.round(maxLeanRight * 10) / 10,
            route_path: null,
          })
          .select()
          .single();
        
        data = directResult.data;
        error = directResult.error;
      }

      if (error) {
        console.error('Supabase insert error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      apexToast.success('Ride Saved');
    },
    onError: (error: unknown) => {
      // Log technical details for debugging
      console.error('Save ride error:', error);
      console.error('Save ride error details:', JSON.stringify(error, null, 2));
      
      // Show user-friendly error message
      // Don't expose technical error details to users
      let errorMessage = 'Failed to save ride. Please try again.';
      
      if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;
        // Check for common user-friendly error patterns
        if ('message' in errorObj && typeof errorObj.message === 'string') {
          const msg = errorObj.message.toLowerCase();
          // Map technical errors to user-friendly messages
          if (msg.includes('permission') || msg.includes('denied')) {
            errorMessage = 'Permission denied. Please check your account settings.';
          } else if (msg.includes('network') || msg.includes('fetch')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else if (msg.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again.';
          } else if (msg.includes('authenticated') || msg.includes('auth')) {
            errorMessage = 'Session expired. Please sign in again.';
          }
        }
      }
      
      apexToast.error(errorMessage);
    },
  });

  /**
   * Start ride tracking
   */
  const startRide = useCallback(async () => {
    if (!isMobile) {
      apexToast.error('Ride tracking is only available on mobile devices.');
      return;
    }

    try {
      const hasPermissions = await checkPermissions();
      if (!hasPermissions) {
        console.log('Permissions not granted, cannot start ride');
        return;
      }

      console.log('Starting ride tracking...');
      const startTimeNow = new Date();
      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        coords: [],
        currentLean: 0,
        maxLeanLeft: 0,
        maxLeanRight: 0,
        startTime: startTimeNow,
        distanceKm: 0,
      }));

      // Sync to Zustand store immediately
      useRideStore.getState().setRecording(true);
      useRideStore.getState().setPaused(false);
      useRideStore.getState().setStartTime(startTimeNow);
      useRideStore.getState().setDistanceKm(0);
      useRideStore.getState().setCurrentLean(0);
      useRideStore.getState().updateMaxLean(0, 0);

      lastNonZeroSpeedTimeRef.current = Date.now();
      console.log('Ride tracking started successfully');
    } catch (error) {
      console.error('Error starting ride:', error);
      apexToast.error('Failed to start ride. Please try again.');
    }
  }, [isMobile, checkPermissions]);

  /**
   * Stop ride tracking and optionally save
   */
  const stopRide = useCallback(
    async (bikeId?: string, shouldSave: boolean = true) => {
      try {
        // Get data from both hook state and store (store is source of truth if component remounted)
        const storeData = useRideStore.getState();
        const coordsToSave = state.coords.length > 0 ? state.coords : storeData.coords;
        const startTimeToUse = state.startTime || storeData.startTime;
        const maxLeanLeftToUse = state.maxLeanLeft > 0 ? state.maxLeanLeft : storeData.maxLeanLeft;
        const maxLeanRightToUse = state.maxLeanRight > 0 ? state.maxLeanRight : storeData.maxLeanRight;

        console.log('Stopping ride:', {
          bikeId,
          shouldSave,
          coordsCount: coordsToSave.length,
          hasStartTime: !!startTimeToUse,
        });

        setState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
        }));

        // Sync to store
        useRideStore.getState().setRecording(false);
        useRideStore.getState().setPaused(false);

        // Clear watch and listeners
        if (watchIdRef.current) {
          try {
            await Geolocation.clearWatch({ id: watchIdRef.current });
            watchIdRef.current = undefined;
          } catch (error) {
            console.warn('Error clearing GPS watch (may already be cleared):', error);
            // Watch might already be cleared, continue anyway
            watchIdRef.current = undefined;
          }
        }

        if (motionListenerRef.current) {
          motionListenerRef.current.remove();
          motionListenerRef.current = undefined;
        }

        if (autoPauseTimerRef.current) {
          clearTimeout(autoPauseTimerRef.current);
          autoPauseTimerRef.current = null;
        }

        // Save ride if requested
        if (shouldSave && bikeId && coordsToSave.length > 0 && startTimeToUse) {
          console.log('Saving ride with data:', {
            bikeId,
            coordsCount: coordsToSave.length,
            distance: storeData.distanceKm,
            maxLeanLeft: maxLeanLeftToUse,
            maxLeanRight: maxLeanRightToUse,
          });

          await saveRide.mutateAsync({
            bikeId,
            coords: coordsToSave,
            startTime: startTimeToUse,
            endTime: new Date(),
            maxLeanLeft: maxLeanLeftToUse,
            maxLeanRight: maxLeanRightToUse,
          });

          // Reset state after save
          setState((prev) => ({
            ...prev,
            coords: [],
            startTime: null,
            distanceKm: 0,
            maxLeanLeft: 0,
            maxLeanRight: 0,
          }));

          // Reset store
          useRideStore.getState().resetRide();
        } else {
          console.log('Not saving ride:', {
            shouldSave,
            hasBikeId: !!bikeId,
            hasCoords: coordsToSave.length > 0,
            hasStartTime: !!startTimeToUse,
          });
        }
      } catch (error: unknown) {
        // Log technical details for debugging
        console.error('Error in stopRide:', error);
        console.error('Stop ride error details:', JSON.stringify(error, null, 2));
        
        // Show user-friendly error message
        let errorMessage = 'Failed to stop ride. Please try again.';
        
        if (error && typeof error === 'object') {
          const errorObj = error as Record<string, unknown>;
          if ('message' in errorObj && typeof errorObj.message === 'string') {
            const msg = errorObj.message.toLowerCase();
            // Map technical errors to user-friendly messages
            if (msg.includes('watchid') || msg.includes('not found')) {
              errorMessage = 'Ride tracking was already stopped.';
            } else if (msg.includes('permission') || msg.includes('denied')) {
              errorMessage = 'Permission denied. Please check your account settings.';
            } else if (msg.includes('network') || msg.includes('fetch')) {
              errorMessage = 'Network error. Please check your connection and try again.';
            }
          }
        }
        
        // Re-throw with user-friendly error message
        throw new Error(errorMessage);
      }
    },
    [state.coords, state.startTime, state.maxLeanLeft, state.maxLeanRight, saveRide]
  );

  /**
   * Pause/resume ride tracking
   */
  const togglePause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));

    if (autoPauseTimerRef.current) {
      clearTimeout(autoPauseTimerRef.current);
      autoPauseTimerRef.current = null;
    }
    lastNonZeroSpeedTimeRef.current = Date.now();
  }, []);

  // Restore permissions and restart tracking if recording was active on mount
  useEffect(() => {
    if (state.isRecording && !state.permissionsGranted.location) {
      console.log('Recording active but no permissions - requesting...');
      // If we're recording but don't have permissions, check them
      checkPermissions().then((granted) => {
        if (!granted) {
          // If permissions denied, stop recording
          console.log('Permissions denied, stopping recording');
          setState((prev) => ({
            ...prev,
            isRecording: false,
            isPaused: false,
          }));
          useRideStore.getState().setRecording(false);
        }
      });
    }
  }, []); // Only run on mount - checkPermissions is stable and doesn't need to be in deps

  // GPS Tracking Effect
  useEffect(() => {
    if (!state.isRecording || state.isPaused || !isMobile) {
      return;
    }

    // If recording but no permission, try to get it
    if (!state.permissionsGranted.location) {
      console.log('Recording active, requesting location permission...');
      checkPermissions();
      return;
    }

    // Watch position with 2-5 second interval (using enableHighAccuracy for better precision)
    Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 30000, // Increased timeout to 30 seconds to avoid "Could not obtain location in time" errors
        maximumAge: 5000, // Accept positions up to 5 seconds old
      },
      (position: Position | null, err?: Error) => {
        if (err) {
          console.error('Geolocation error:', err);
          return;
        }

        if (position?.coords) {
          const speed = position.coords.speed ?? 0; // m/s, null if unavailable
          const now = Date.now();

          setState((prev) => {
            const newCoord: Coordinate = {
              longitude: position.coords.longitude,
              latitude: position.coords.latitude,
              timestamp: now,
              speed: speed && speed > 0 ? speed : undefined,
            };

            // Calculate distance if we have previous coordinates
            let newDistance = prev.distanceKm;
            if (prev.coords.length > 0) {
              const lastCoord = prev.coords[prev.coords.length - 1];
              newDistance += calculateDistance(lastCoord, newCoord);
            }

            // Sync to Zustand store
            useRideStore.getState().addCoord(newCoord);
            useRideStore.getState().setDistanceKm(newDistance);

            console.log('GPS update:', {
              speed: speed ? Math.round(speed * 3.6) : 0,
              coords: prev.coords.length + 1,
              distance: newDistance.toFixed(2),
            });

            // Update last non-zero speed time for auto-pause
            if (speed && speed > 0) {
              lastNonZeroSpeedTimeRef.current = now;
              // Clear any existing auto-pause timer
              if (autoPauseTimerRef.current) {
                clearTimeout(autoPauseTimerRef.current);
                autoPauseTimerRef.current = null;
              }
            } else {
              // Speed is 0 or unavailable - check for auto-pause
              if (lastNonZeroSpeedTimeRef.current) {
                const timeSinceLastMovement = now - lastNonZeroSpeedTimeRef.current;
                const fiveMinutes = 5 * 60 * 1000; // 5 minutes in ms

                if (timeSinceLastMovement >= fiveMinutes && !autoPauseTimerRef.current) {
                  // Set a small delay to ensure we're actually stopped
                  autoPauseTimerRef.current = setTimeout(() => {
                    setState((prevState) => ({
                      ...prevState,
                      isPaused: true,
                    }));
                    apexToast.error('Ride paused: No movement detected for 5 minutes.');
                    autoPauseTimerRef.current = null;
                  }, 1000);
                }
              } else {
                // First time we see zero speed
                lastNonZeroSpeedTimeRef.current = now;
              }
            }

            return {
              ...prev,
              coords: [...prev.coords, newCoord],
              distanceKm: newDistance,
            };
          });
        }
      }
    ).then((id: string) => {
      watchIdRef.current = id;
      console.log('GPS watch started, id:', id);
    }).catch((error) => {
      console.error('Failed to start GPS watch:', error);
    });

    return () => {
      if (watchIdRef.current) {
        try {
          Geolocation.clearWatch({ id: watchIdRef.current }).catch((err) => {
            console.warn('Error clearing GPS watch on cleanup:', err);
          });
          watchIdRef.current = undefined;
        } catch (error) {
          console.warn('Error clearing GPS watch on cleanup:', error);
          watchIdRef.current = undefined;
        }
      }
    };
  }, [
    state.isRecording,
    state.isPaused,
    isMobile,
    state.permissionsGranted.location,
    calculateDistance,
  ]);

  // Motion Tracking Effect (Lean Angle)
  useEffect(() => {
    console.log('Motion effect triggered:', {
      isRecording: state.isRecording,
      isPaused: state.isPaused,
      isMobile,
      hasListener: !!motionListenerRef.current,
    });

    if (!state.isRecording || state.isPaused || !isMobile) {
      // Clean up listener if recording stops
      if (motionListenerRef.current) {
        try {
          motionListenerRef.current.remove();
          motionListenerRef.current = undefined;
          console.log('Motion listener removed (recording stopped)');
        } catch (error) {
          console.warn('Error removing motion listener:', error);
          motionListenerRef.current = undefined;
        }
      }
      return;
    }

    // Check if Motion API is available
    if (!Motion || typeof Motion.addListener !== 'function') {
      console.error('Motion API not available');
      apexToast.error('Motion sensor API not available. Lean angle tracking disabled.');
      return;
    }

    console.log('Setting up motion listener for lean angle tracking...');
    console.log('Motion API check:', {
      Motion: !!Motion,
      addListener: typeof Motion?.addListener,
      isNative: isMobile,
    });
    
    // Motion permissions are handled automatically by the OS
    // Just proceed with listener
    let callbackCallCount = 0;
    const startTime = Date.now();
    
    console.log('Calling Motion.addListener...');
    Motion.addListener('accel', (event: AccelListenerEvent) => {
      const timeSinceStart = Date.now() - startTime;
      callbackCallCount++;
      
      console.log(`[Motion #${callbackCallCount}] Callback fired after ${timeSinceStart}ms`);
      callbackCallCount++;
      
      // Calculate roll angle from accelerometer
      // For a phone mounted on a motorcycle (portrait mode):
      // - x-axis: left/right tilt (roll)
      // - y-axis: forward/backward pitch
      // - z-axis: up/down (gravity)
      // Roll angle = atan2(x, z) gives the lean angle
      const { x, y, z } = event.accelerationIncludingGravity;
      
      // Calculate roll angle (lean left/right)
      // For a phone mounted in portrait mode on a motorcycle:
      // - When bike leans left, x becomes negative
      // - When bike leans right, x becomes positive
      // - z-axis points forward (gravity component)
      // Formula: roll = atan2(x, sqrt(y^2 + z^2))
      const rollRad = Math.atan2(x, Math.sqrt(y * y + z * z));
      const rollDeg = rollRad * (180 / Math.PI);
      
      // The lean angle is the absolute value of roll
      // Negative roll = leaning left, Positive roll = leaning right
      const leanAngle = Math.abs(rollDeg);
      
      // Log every callback for first 10, then every 10th
      const shouldLog = callbackCallCount <= 10 || callbackCallCount % 10 === 0;
      if (shouldLog) {
        console.log(`[Motion ${callbackCallCount}] Sensor data:`, {
          x: x.toFixed(3),
          y: y.toFixed(3),
          z: z.toFixed(3),
          rollDeg: rollDeg.toFixed(2),
          leanAngle: leanAngle.toFixed(2),
        });
      }

      setState((prev) => {
        // Update current lean
        const newCurrentLean = Math.round(leanAngle * 10) / 10; // Round to 1 decimal

        // Peak filter: Only update max if new value is higher
        let newMaxLeanLeft = prev.maxLeanLeft;
        let newMaxLeanRight = prev.maxLeanRight;

        if (rollDeg < 0) {
          // Leaning left (negative roll)
          if (leanAngle > prev.maxLeanLeft) {
            newMaxLeanLeft = newCurrentLean;
            if (shouldLog) {
              console.log(`[Motion ${callbackCallCount}] New max lean left: ${newMaxLeanLeft.toFixed(1)}°`);
            }
          }
        } else {
          // Leaning right (positive roll)
          if (leanAngle > prev.maxLeanRight) {
            newMaxLeanRight = newCurrentLean;
            if (shouldLog) {
              console.log(`[Motion ${callbackCallCount}] New max lean right: ${newMaxLeanRight.toFixed(1)}°`);
            }
          }
        }

        // Sync to Zustand store
        useRideStore.getState().setCurrentLean(newCurrentLean);
        useRideStore.getState().updateMaxLean(newMaxLeanLeft, newMaxLeanRight);

        return {
          ...prev,
          currentLean: newCurrentLean,
          maxLeanLeft: newMaxLeanLeft,
          maxLeanRight: newMaxLeanRight,
        };
      });
    })
      .then((listener) => {
        motionListenerRef.current = listener;
        console.log('✅ Motion listener added successfully, waiting for sensor data...');
      })
      .catch((error: unknown) => {
        console.error('❌ Failed to add motion listener:', error);
        console.error('Motion listener error details:', JSON.stringify(error, null, 2));
        // Don't block recording if motion fails
        apexToast.error('Motion sensor unavailable. Lean angle tracking disabled.');
      });

    return () => {
      if (motionListenerRef.current) {
        try {
          motionListenerRef.current.remove();
          motionListenerRef.current = undefined;
          console.log('Motion listener removed');
        } catch (error) {
          console.warn('Error removing motion listener:', error);
          motionListenerRef.current = undefined;
        }
      }
    };
  }, [state.isRecording, state.isPaused, isMobile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
      }
      if (motionListenerRef.current) {
        motionListenerRef.current.remove();
      }
      if (autoPauseTimerRef.current) {
        clearTimeout(autoPauseTimerRef.current);
      }
    };
  }, []);

  return {
    isRecording: state.isRecording,
    isPaused: state.isPaused,
    coords: state.coords,
    currentLean: state.currentLean,
    maxLeanLeft: state.maxLeanLeft,
    maxLeanRight: state.maxLeanRight,
    startTime: state.startTime,
    distanceKm: state.distanceKm,
    permissionsGranted: state.permissionsGranted,
    startRide,
    stopRide,
    togglePause,
    saveRide,
    checkPermissions,
  };
};

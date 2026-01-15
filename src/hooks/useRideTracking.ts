import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, type Position } from '@capacitor/geolocation';
import { Motion, type AccelListenerEvent } from '@capacitor/motion';
import { Sensors } from '@danyalwe/capacitor-sensors';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { apexToast } from '../lib/toast';
import { useRideStore } from '../stores/useRideStore';
import { logger } from '../lib/logger';

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
  const queryClient = useQueryClient();

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
  const rawRotationRef = useRef<number>(0); // Track current raw rotation for calibration
  const prevSmoothRollRef = useRef<number>(0); // Track previous smoothed roll for EMA
  const currentSpeedRef = useRef<number>(0); // Track current speed in m/s for motion lock
  const CALIBRATION_STORAGE_KEY = 'apex-calibration-offset';
  
  // Signal processing constants
  const ALPHA = 0.15; // Exponential smoothing factor
  const MAX_LEAN = 70; // Maximum realistic lean angle in degrees
  const MOTION_LOCK_SPEED_KMH = 10; // Speed threshold for motion lock (km/h)
  const MOTION_LOCK_SPEED_MS = useMemo(() => MOTION_LOCK_SPEED_KMH / 3.6, []); // Convert to m/s (~2.78 m/s)
  
  // Load calibration offset from localStorage on mount
  const [calibrationOffset, setCalibrationOffset] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(CALIBRATION_STORAGE_KEY);
      return stored ? parseFloat(stored) : 0;
    } catch {
      return 0;
    }
  });

  /**
   * Apply signal processing to raw roll angle:
   * Processing order:
   * 1. Motion lock (stationary filter) - Check first to avoid unnecessary smoothing
   * 2. Exponential smoothing (EMA) - Smooth the signal
   * 3. Reality clamping - Cap at maximum realistic lean angle
   */
  const processLeanAngle = useCallback((rawRollDeg: number): number => {
    // Step 1: Motion Lock (Stationary Filter)
    // If speed < 10 km/h, force lean to 0 and reset smoothing
    // This prevents recording "handling noise" while walking or mounting
    const currentSpeed = currentSpeedRef.current;
    if (currentSpeed < MOTION_LOCK_SPEED_MS) {
      prevSmoothRollRef.current = 0; // Reset smoothing when stationary
      return 0;
    }
    
    // Step 2: Exponential Smoothing (EMA)
    // Makes the needle move fluidly like a physical gauge instead of jittering
    const smoothRoll = (rawRollDeg * ALPHA) + (prevSmoothRollRef.current * (1 - ALPHA));
    prevSmoothRollRef.current = smoothRoll;
    
    // Step 3: Reality Clamping
    // Prevent graph distortion from garbage data (like 98° readings)
    const finalLean = Math.min(Math.abs(smoothRoll), MAX_LEAN);
    
    return finalLean;
  }, [MOTION_LOCK_SPEED_MS]);

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
        logger.warn('Geolocation API not available');
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
        logger.debug('Location permission status:', locationStatus);
        locationGranted = locationStatus.location === 'granted';

        if (!locationGranted) {
          logger.debug('Requesting location permissions...');
          // This will show the native Android permission dialog
          const locationRequest = await Geolocation.requestPermissions();
          logger.debug('Location permission request result:', locationRequest);
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
        logger.error('Location permission error:', locationError);
        const errorMessage = locationError instanceof Error ? locationError.message : String(locationError);
        
        // Check if it's a manifest permission error (shouldn't happen after fix, but handle gracefully)
        if (errorMessage.includes('AndroidManifest.xml') || errorMessage.includes('ACCESS_FINE_LOCATION')) {
          // This is a development issue - log it but show user-friendly message
          logger.error('Manifest permission error detected - app needs to be rebuilt');
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
      logger.error('Permission check error:', error);
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

      logger.debug('Saving ride with route path:', {
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

      logger.debug('Inserting ride:', {
        bikeId,
        coordsCount: coords.length,
        hasRoutePath: !!geoJSON,
        routePathPreview: geoJSON ? `${geoJSON.coordinates.length} points` : 'none',
        firstCoord: coords.length > 0 ? { lat: coords[0].latitude, lng: coords[0].longitude } : null,
        lastCoord: coords.length > 0 ? { lat: coords[coords.length - 1].latitude, lng: coords[coords.length - 1].longitude } : null,
        geoJSONStringLength: geoJSON ? JSON.stringify(geoJSON).length : 0,
      });

      // Use RPC function to insert with PostGIS geometry conversion
      // The RPC function uses ST_GeomFromGeoJSON to convert GeoJSON to geography
      let data, error;
      
      if (geoJSON && coords.length >= 2) {
        // Log the full GeoJSON being sent
        const geoJSONString = JSON.stringify(geoJSON);
        logger.debug('Sending GeoJSON to RPC:', {
          coordinatesCount: geoJSON.coordinates.length,
          geoJSONLength: geoJSONString.length,
          firstPoint: geoJSON.coordinates[0],
          lastPoint: geoJSON.coordinates[geoJSON.coordinates.length - 1],
          geoJSONPreview: geoJSONString.substring(0, 200),
        });
        
        // Try using RPC function first (requires SQL function in Supabase)
        const rpcResult = await supabase.rpc('insert_ride_with_geometry', {
          p_bike_id: bikeId,
          p_user_id: user.id,
          p_start_time: startTime.toISOString(),
          p_end_time: endTime.toISOString(),
          p_distance_km: Math.round(totalDistance * 100) / 100,
          p_max_lean_left: Math.round(maxLeanLeft * 10) / 10, // Round to 1 decimal place
          p_max_lean_right: Math.round(maxLeanRight * 10) / 10, // Round to 1 decimal place
          p_route_path_geojson: geoJSON, // Send as object, not stringified
        });
        
        data = rpcResult.data;
        error = rpcResult.error;
        
        // Log RPC result for debugging
        if (error) {
          logger.error('RPC function error:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            fullError: error,
          });
        } else {
          logger.debug('RPC function succeeded:', { data });
        }
        
        // If RPC function doesn't exist or fails, fall back to direct insert without geometry
        if (error) {
          const isFunctionNotFound = 
            error.message?.includes('function') && 
            (error.message?.includes('does not exist') || error.message?.includes('not found'));
          
          if (isFunctionNotFound) {
            logger.warn('RPC function not found. Inserting ride without route path. Please create the RPC function in Supabase (see supabase_rpc_insert_ride_with_geometry.sql).');
            
            // Fallback: insert without route_path
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
          } else {
            logger.error('RPC function failed with error:', error);
            // Don't fall back on other errors - let the error propagate
            throw error;
          }
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
            max_lean_left: Math.round(maxLeanLeft * 10) / 10, // Round to 1 decimal place
            max_lean_right: Math.round(maxLeanRight * 10) / 10, // Round to 1 decimal place
            route_path: null,
          })
          .select()
          .single();
        
        data = directResult.data;
        error = directResult.error;
      }

      if (error) {
        logger.error('Supabase insert error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: error,
        });
        
        // Create a more detailed error message
        let errorMessage = error.message || 'Failed to save ride';
        if (error.details) {
          errorMessage += `: ${error.details}`;
        }
        if (error.hint) {
          errorMessage += ` (${error.hint})`;
        }
        
        const detailedError = new Error(errorMessage);
        (detailedError as unknown as { code?: string; details?: string; hint?: string }).code = error.code;
        (detailedError as unknown as { code?: string; details?: string; hint?: string }).details = error.details;
        (detailedError as unknown as { code?: string; details?: string; hint?: string }).hint = error.hint;
        
        throw detailedError;
      }
      return data;
    },
    onSuccess: async () => {
      apexToast.success('Ride Saved');
      // Invalidate and refetch rides query to refresh recent rides list immediately
      await queryClient.invalidateQueries({ 
        queryKey: ['rides'],
        refetchType: 'active', // Only refetch active queries (visible components)
      });
      // Force refetch all active rides queries
      await queryClient.refetchQueries({ 
        queryKey: ['rides'],
        type: 'active',
      });
    },
    onError: (error: unknown) => {
      // Log technical details for debugging
      logger.error('Save ride error:', error);
      logger.error('Save ride error details:', JSON.stringify(error, null, 2));
      
      // Show user-friendly error message with more context
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
          } else if (msg.includes('function') && msg.includes('does not exist')) {
            errorMessage = 'Database function missing. Please contact support.';
          } else if (msg.includes('violates') || msg.includes('constraint')) {
            errorMessage = 'Invalid data. Please check your ride information.';
          } else {
            // Show the actual error message if it's user-friendly
            errorMessage = errorObj.message as string;
          }
        }
        
        // Include details/hint if available for debugging
        if ('details' in errorObj && errorObj.details) {
          logger.error('Error details:', errorObj.details);
        }
        if ('hint' in errorObj && errorObj.hint) {
          logger.error('Error hint:', errorObj.hint);
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
        logger.debug('Permissions not granted, cannot start ride');
        return;
      }

      logger.debug('Starting ride tracking...');
      const startTimeNow = new Date();
      
      // Reset signal processing state
      prevSmoothRollRef.current = 0;
      currentSpeedRef.current = 0;
      
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

      // Sync to Zustand store immediately - reset coords array
      useRideStore.getState().setRecording(true);
      useRideStore.getState().setPaused(false);
      useRideStore.getState().setStartTime(startTimeNow);
      useRideStore.getState().setDistanceKm(0);
      useRideStore.getState().setCurrentLean(0);
      useRideStore.getState().updateMaxLean(0, 0);
      // Clear coords array in store
      useRideStore.setState({ coords: [] });

      lastNonZeroSpeedTimeRef.current = Date.now();
      logger.debug('Ride tracking started successfully');
    } catch (error) {
      logger.error('Error starting ride:', error);
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
        // Always prefer store data as it's the source of truth and persists across remounts
        const coordsToSave = storeData.coords.length > 0 ? storeData.coords : state.coords;
        const startTimeToUse = storeData.startTime || state.startTime;
        const maxLeanLeftToUse = storeData.maxLeanLeft > 0 ? storeData.maxLeanLeft : state.maxLeanLeft;
        const maxLeanRightToUse = storeData.maxLeanRight > 0 ? storeData.maxLeanRight : state.maxLeanRight;

        logger.debug('Stopping ride:', {
          bikeId,
          shouldSave,
          stateCoordsCount: state.coords.length,
          storeCoordsCount: storeData.coords.length,
          coordsToSaveCount: coordsToSave.length,
          hasStartTime: !!startTimeToUse,
          coordsPreview: coordsToSave.slice(0, 3).map(c => ({ lat: c.latitude, lng: c.longitude })),
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
            logger.warn('Error clearing GPS watch (may already be cleared):', error);
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
          logger.debug('Saving ride with data:', {
            bikeId,
            coordsCount: coordsToSave.length,
            distance: storeData.distanceKm,
            maxLeanLeft: maxLeanLeftToUse,
            maxLeanRight: maxLeanRightToUse,
          });

          try {
            await saveRide.mutateAsync({
              bikeId,
              coords: coordsToSave,
              startTime: startTimeToUse,
              endTime: new Date(),
              maxLeanLeft: maxLeanLeftToUse,
              maxLeanRight: maxLeanRightToUse,
            });

            // Reset state after successful save
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
          } catch (saveError: unknown) {
            // Log technical details for debugging
            logger.error('Error saving ride:', saveError);
            logger.error('Save ride error details:', JSON.stringify(saveError, null, 2));
            
            // The mutation's onError handler will show a toast, so we don't need to show another one here
            // But we should still reset the recording state so the UI updates
            // Don't reset coords/startTime in case user wants to retry
            
            // Re-throw the error so the caller knows the save failed
            // The error message will already be user-friendly from the mutation's onError handler
            throw saveError;
          }
        } else {
          logger.debug('Not saving ride:', {
            shouldSave,
            hasBikeId: !!bikeId,
            hasCoords: coordsToSave.length > 0,
            hasStartTime: !!startTimeToUse,
          });
          
          // Reset state even if not saving (discard case)
          if (!shouldSave) {
            setState((prev) => ({
              ...prev,
              coords: [],
              startTime: null,
              distanceKm: 0,
              maxLeanLeft: 0,
              maxLeanRight: 0,
            }));
            useRideStore.getState().resetRide();
          }
        }
      } catch (error: unknown) {
        // Log technical details for debugging
        logger.error('Error in stopRide:', error);
        logger.error('Stop ride error details:', JSON.stringify(error, null, 2));
        
        // Only show error toast if it's not a save error (save errors are handled by mutation's onError)
        const isSaveError = error && typeof error === 'object' && 
          ('message' in (error as Record<string, unknown>) && 
           typeof (error as Record<string, unknown>).message === 'string' &&
           ((error as Record<string, unknown>).message as string).toLowerCase().includes('save'));
        
        if (!isSaveError) {
          // Show user-friendly error message for non-save errors
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
              } else {
                errorMessage = errorObj.message as string;
              }
            }
          }
          
          // Show toast for non-save errors
          apexToast.error(errorMessage);
        }
        
        // Re-throw the error so caller can handle it
        throw error;
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
      logger.debug('Recording active but no permissions - requesting...');
      // If we're recording but don't have permissions, check them
      checkPermissions().then((granted) => {
        if (!granted) {
          // If permissions denied, stop recording
          logger.debug('Permissions denied, stopping recording');
          setState((prev) => ({
            ...prev,
            isRecording: false,
            isPaused: false,
          }));
          useRideStore.getState().setRecording(false);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - checkPermissions is stable (useCallback), state values checked conditionally

  // GPS Tracking Effect
  useEffect(() => {
    if (!state.isRecording || state.isPaused || !isMobile) {
      return;
    }

    // If recording but no permission, try to get it
    if (!state.permissionsGranted.location) {
      logger.debug('Recording active, requesting location permission...');
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
          logger.error('Geolocation error:', err);
          return;
        }

        if (position?.coords) {
          const speed = position.coords.speed ?? 0; // m/s, null if unavailable
          const now = Date.now();
          
          // Update current speed ref for motion lock filter
          currentSpeedRef.current = speed && speed > 0 ? speed : 0;

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

            logger.debug('GPS update:', {
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
      logger.debug('GPS watch started, id:', id);
    }).catch((error) => {
      logger.error('Failed to start GPS watch:', error);
    });

    return () => {
      if (watchIdRef.current) {
        try {
          Geolocation.clearWatch({ id: watchIdRef.current }).catch((err) => {
            logger.warn('Error clearing GPS watch on cleanup:', err);
          });
          watchIdRef.current = undefined;
        } catch (error) {
          logger.warn('Error clearing GPS watch on cleanup:', error);
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
    checkPermissions,
  ]);

  // Track pocket mode state for effect dependencies
  const isPocketMode = useRideStore((state) => state.isPocketMode);

  // Motion Tracking Effect (Lean Angle)
  useEffect(() => {
    if (!state.isRecording || state.isPaused || !isMobile || isPocketMode) {
      // Clean up listener if recording stops or pocket mode is active
      if (motionListenerRef.current) {
        try {
          motionListenerRef.current.remove();
          motionListenerRef.current = undefined;
          logger.debug('Motion listener removed (recording stopped or pocket mode active)');
        } catch (error) {
          logger.warn('Error removing motion listener:', error);
          motionListenerRef.current = undefined;
        }
      }
      return;
    }

    // Check if Motion API is available
    if (!Motion || typeof Motion.addListener !== 'function') {
      logger.error('Motion API not available');
      apexToast.error('Motion sensor API not available. Lean angle tracking disabled.');
      return;
    }

    logger.debug('Setting up motion listener for lean angle tracking...');
    logger.debug('Motion API check:', {
      Motion: !!Motion,
      addListener: typeof Motion?.addListener,
      isNative: isMobile,
    });
    
    // Request permission for iOS devices (required before adding listener)
    const setupMotionListener = async () => {
      try {
        // Platform-specific motion sensor implementation:
        // - Android: Native accelerometer via @danyalwe/capacitor-sensors (direct hardware access)
        // - iOS: DeviceMotionEvent via @capacitor/motion (Safari/WebView API)
        // - Web: DeviceMotionEvent via @capacitor/motion (browser API, requires HTTPS)
        const platform = Capacitor.getPlatform();
        logger.debug('Setting up motion listener for platform:', platform);
        
        if (platform === 'android') {
          // Use native Android accelerometer via @danyalwe/capacitor-sensors
          logger.debug('Using native Android accelerometer sensor...');
          
          // Check if accelerometer is available
          const availableSensors = await Sensors.getAvailableSensors();
          logger.debug('Available sensors:', availableSensors);
          
          if (!availableSensors.sensors.includes('ACCELEROMETER')) {
            logger.error('Accelerometer not available on this device');
            apexToast.error('Accelerometer not available on this device.');
            return;
          }
          
          // Initialize the accelerometer
          const sensorData = await Sensors.init({ type: 'ACCELEROMETER', delay: 'UI' });
          logger.debug('Accelerometer initialized:', sensorData);
          
          if (!sensorData) {
            logger.error('Failed to initialize accelerometer');
            apexToast.error('Failed to initialize accelerometer.');
            return;
          }
          
          // Start the accelerometer
          await Sensors.start({ type: 'ACCELEROMETER' });
          logger.debug('✅ Started accelerometer');
          
          let callbackCallCount = 0;
          const startTime = Date.now();
          
          // Add listener for accelerometer data
          // SensorResult.values is [x, y, z] in m/s²
          const listener = await Sensors.addListener('ACCELEROMETER', (result) => {
            const timeSinceStart = Date.now() - startTime;
            callbackCallCount++;
            
            // Extract x, y, z from values array
            const [x, y, z] = result.values;
            
            // Validate sensor data
            if (x === undefined || y === undefined || z === undefined || 
                isNaN(x) || isNaN(y) || isNaN(z)) {
              logger.warn('[Accel] Invalid sensor data:', result);
              return;
            }
            
            // Log every callback for first 10, then every 10th
            const shouldLog = callbackCallCount <= 10 || callbackCallCount % 10 === 0;
            if (shouldLog) {
              logger.debug(`[Accel #${callbackCallCount}] Data received after ${timeSinceStart}ms:`, {
                x: x.toFixed(3),
                y: y.toFixed(3),
                z: z.toFixed(3),
                timestamp: result.timestamp,
              });
            }
            
            // Calculate roll angle (lean left/right)
            // Android accelerometer: x=left/right, y=forward/back, z=up/down
            // Values are in m/s², including gravity
            const rollRad = Math.atan2(x, Math.sqrt(y * y + z * z));
            const rollDeg = rollRad * (180 / Math.PI);
            
            // Store raw rotation for calibration
            rawRotationRef.current = rollDeg;
            
            // Apply calibration offset
            const rawRollWithCalibration = rollDeg - calibrationOffset;
            
            // Defensive check: If pocket mode is active, don't update lean angle
            // Note: The effect should have stopped this listener when pocket mode activated,
            // but this check provides defense-in-depth against race conditions
            const isPocketMode = useRideStore.getState().isPocketMode;
            if (isPocketMode) {
              // Hold last valid lean angle, don't update
              return;
            }
            
            // Apply signal processing: smoothing, motion lock, and clamping
            const processedLeanAngle = processLeanAngle(rawRollWithCalibration);
            
            if (shouldLog) {
              logger.debug(`[Accel ${callbackCallCount}] Calculated:`, {
                rollDeg: rollDeg.toFixed(2),
                rawRollWithCalibration: rawRollWithCalibration.toFixed(2),
                processedLeanAngle: processedLeanAngle.toFixed(2),
                currentSpeed: currentSpeedRef.current.toFixed(2),
              });
            }
            
            setState((prev) => {
              const newCurrentLean = Math.round(processedLeanAngle * 10) / 10;
              let newMaxLeanLeft = prev.maxLeanLeft;
              let newMaxLeanRight = prev.maxLeanRight;
              
              // Only update max lean if we have a valid processed angle (not zero from motion lock)
              if (processedLeanAngle > 0) {
                if (rawRollWithCalibration < 0) {
                  // Leaning left
                  if (processedLeanAngle > prev.maxLeanLeft) {
                    newMaxLeanLeft = newCurrentLean;
                    if (shouldLog) {
                      logger.debug(`[Accel ${callbackCallCount}] New max lean left: ${newMaxLeanLeft.toFixed(1)}°`);
                    }
                  }
                } else {
                  // Leaning right
                  if (processedLeanAngle > prev.maxLeanRight) {
                    newMaxLeanRight = newCurrentLean;
                    if (shouldLog) {
                      logger.debug(`[Accel ${callbackCallCount}] New max lean right: ${newMaxLeanRight.toFixed(1)}°`);
                    }
                  }
                }
              }
              
              useRideStore.getState().setCurrentLean(newCurrentLean);
              useRideStore.getState().updateMaxLean(newMaxLeanLeft, newMaxLeanRight);
              
              return {
                ...prev,
                currentLean: newCurrentLean,
                maxLeanLeft: newMaxLeanLeft,
                maxLeanRight: newMaxLeanRight,
              };
            });
          });
          
          motionListenerRef.current = listener as unknown as Awaited<ReturnType<typeof Motion.addListener>>;
          logger.debug('✅ Native accelerometer listener added successfully');
          return;
        }
        
        // iOS/Web: Use @capacitor/motion (DeviceMotionEvent API)
        // Note: @capacitor/motion is web-only and uses DeviceMotionEvent
        // On iOS, this works through Safari/WebView's DeviceMotionEvent support
        // iOS requires explicit permission request (iOS 13+)
        logger.debug('Using DeviceMotionEvent API for iOS/Web platform');
        
        if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
          logger.error('DeviceMotionEvent not available in this environment');
          apexToast.error('Motion sensors not available on this device.');
          return;
        }
        
        // iOS requires explicit permission request (iOS 13+)
        // This will show a native permission dialog on iOS
        if (typeof (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent?.requestPermission === 'function') {
          logger.debug('Requesting DeviceMotionEvent permission for iOS...');
          const permission = await (window as unknown as { DeviceMotionEvent: { requestPermission: () => Promise<string> } }).DeviceMotionEvent.requestPermission();
          if (permission !== 'granted') {
            logger.error('DeviceMotionEvent permission denied');
            apexToast.error('Motion sensor permission denied. Lean angle tracking disabled.');
            return;
          }
          logger.debug('✅ DeviceMotionEvent permission granted');
        } else {
          logger.debug('DeviceMotionEvent available (no permission required for this iOS version)');
        }
        
        let callbackCallCount = 0;
        const startTime = Date.now();
        
        logger.debug('Calling Motion.addListener (web/iOS)...');
        const listener = await Motion.addListener('accel', (event: AccelListenerEvent) => {
          const timeSinceStart = Date.now() - startTime;
          callbackCallCount++;
          
          logger.debug(`[Motion #${callbackCallCount}] Callback fired after ${timeSinceStart}ms`);
      
          // Calculate roll angle from accelerometer
          // For a phone mounted on a motorcycle (portrait mode):
          // Device coordinate system (portrait):
          // - x-axis: horizontal, positive to the right
          // - y-axis: vertical, positive upward
          // - z-axis: perpendicular to screen, positive outward
          // 
          // When bike leans:
          // - Left lean: x becomes negative (gravity shifts left)
          // - Right lean: x becomes positive (gravity shifts right)
          // 
          // Roll angle calculation:
          // roll = atan2(x, sqrt(y^2 + z^2))
          // This gives the angle of rotation around the y-axis (vertical axis)
          
          const { x, y, z } = event.accelerationIncludingGravity;
          
          // Validate that we have valid sensor data
          if (x === undefined || y === undefined || z === undefined || 
              isNaN(x) || isNaN(y) || isNaN(z)) {
            logger.warn('[Motion] Invalid sensor data:', { x, y, z });
            return;
          }
          
          // Calculate roll angle (lean left/right)
          // Using atan2(x, sqrt(y^2 + z^2)) for accurate roll calculation
          const rollRad = Math.atan2(x, Math.sqrt(y * y + z * z));
          const rollDeg = rollRad * (180 / Math.PI);
          
          // Store raw rotation for calibration
          rawRotationRef.current = rollDeg;
          
          // Apply calibration offset
          // Negative roll = leaning left, Positive roll = leaning right
          const rawRollWithCalibration = rollDeg - calibrationOffset;
          
          // Defensive check: If pocket mode is active, don't update lean angle
          // Note: The effect should have stopped this listener when pocket mode activated,
          // but this check provides defense-in-depth against race conditions
          const isPocketMode = useRideStore.getState().isPocketMode;
          if (isPocketMode) {
            // Hold last valid lean angle, don't update
            return;
          }
          
          // Apply signal processing: smoothing, motion lock, and clamping
          const processedLeanAngle = processLeanAngle(rawRollWithCalibration);
          
          // Log every callback for first 10, then every 10th
          const shouldLog = callbackCallCount <= 10 || callbackCallCount % 10 === 0;
          if (shouldLog) {
            logger.debug(`[Motion ${callbackCallCount}] Sensor data:`, {
              x: x.toFixed(3),
              y: y.toFixed(3),
              z: z.toFixed(3),
              rollDeg: rollDeg.toFixed(2),
              rawRollWithCalibration: rawRollWithCalibration.toFixed(2),
              processedLeanAngle: processedLeanAngle.toFixed(2),
              currentSpeed: currentSpeedRef.current.toFixed(2),
            });
          }

          setState((prev) => {
            // Update current lean
            const newCurrentLean = Math.round(processedLeanAngle * 10) / 10; // Round to 1 decimal

            // Peak filter: Only update max if new value is higher
            let newMaxLeanLeft = prev.maxLeanLeft;
            let newMaxLeanRight = prev.maxLeanRight;

            // Only update max lean if we have a valid processed angle (not zero from motion lock)
            if (processedLeanAngle > 0) {
              if (rawRollWithCalibration < 0) {
                // Leaning left (negative roll)
                if (processedLeanAngle > prev.maxLeanLeft) {
                  newMaxLeanLeft = newCurrentLean;
                  if (shouldLog) {
                    logger.debug(`[Motion ${callbackCallCount}] New max lean left: ${newMaxLeanLeft.toFixed(1)}°`);
                  }
                }
              } else {
                // Leaning right (positive roll)
                if (processedLeanAngle > prev.maxLeanRight) {
                  newMaxLeanRight = newCurrentLean;
                  if (shouldLog) {
                    logger.debug(`[Motion ${callbackCallCount}] New max lean right: ${newMaxLeanRight.toFixed(1)}°`);
                  }
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
        });
        
        motionListenerRef.current = listener;
        logger.debug('✅ Motion listener added successfully, waiting for sensor data...');
      } catch (error: unknown) {
        logger.error('❌ Failed to add motion listener:', error);
        logger.error('Motion listener error details:', JSON.stringify(error, null, 2));
        // Don't block recording if motion fails
        apexToast.error('Motion sensor unavailable. Lean angle tracking disabled.');
      }
    };
    
    // Call the async setup function
    setupMotionListener();

    return () => {
      if (motionListenerRef.current) {
        try {
          const platform = Capacitor.getPlatform();
          if (platform === 'android') {
            // Stop native accelerometer
            Sensors.stop({ type: 'ACCELEROMETER' }).catch((err: unknown) => {
              logger.warn('Error stopping accelerometer:', err);
            });
            // Remove listener
            if (motionListenerRef.current && typeof motionListenerRef.current.remove === 'function') {
              motionListenerRef.current.remove();
            }
          } else {
            // Remove web/iOS listener
            motionListenerRef.current.remove();
          }
          motionListenerRef.current = undefined;
          logger.debug('Motion listener removed');
        } catch (error) {
          logger.warn('Error removing motion listener:', error);
          motionListenerRef.current = undefined;
        }
      }
    };
  }, [state.isRecording, state.isPaused, isMobile, calibrationOffset, isPocketMode, processLeanAngle]);

  /**
   * Calibrate the lean angle sensor by setting offset to current raw rotation
   */
  const calibrate = useCallback(() => {
    const currentRawRotation = rawRotationRef.current;
    setCalibrationOffset(currentRawRotation);
    try {
      localStorage.setItem(CALIBRATION_STORAGE_KEY, currentRawRotation.toString());
    } catch (error) {
      logger.warn('Failed to save calibration offset to localStorage:', error);
    }
  }, []);

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
    calibrate,
  };
};

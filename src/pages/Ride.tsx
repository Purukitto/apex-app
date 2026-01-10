import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useRideTracking } from '../hooks/useRideTracking';
import { useBikes } from '../hooks/useBikes';
import { useRideStore } from '../stores/useRideStore';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, itemVariants, buttonHoverProps } from '../lib/animations';
import { Bike, Smartphone, Download, QrCode } from 'lucide-react';
import { apexToast } from '../lib/toast';
import type { Bike as BikeType } from '../types/database';

/**
 * Web Fallback Component
 * Shows when platform is 'web' - encourages mobile app download
 */
const WebFallback = () => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-apex-black"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="max-w-md w-full text-center space-y-6"
        variants={itemVariants}
      >
        <div className="mb-8">
          <motion.div
            className="mx-auto w-24 h-24 bg-apex-green/10 rounded-full flex items-center justify-center mb-6"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
          >
            <Smartphone size={48} className="text-apex-green" />
          </motion.div>
          <motion.h1
            className="text-3xl font-bold text-apex-white mb-2"
            variants={itemVariants}
          >
            Apex is better on the road
          </motion.h1>
          <motion.p
            className="text-apex-white/60 text-lg"
            variants={itemVariants}
          >
            Ride tracking requires GPS and motion sensors available only on mobile devices.
          </motion.p>
        </div>

        {/* QR Code Placeholder */}
        <motion.div
          className="bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg p-8 mb-6"
          variants={itemVariants}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-48 bg-apex-white/5 border-2 border-dashed border-apex-white/20 rounded-lg flex items-center justify-center">
              <QrCode size={64} className="text-apex-white/20" />
            </div>
            <p className="text-sm text-apex-white/40">
              Scan with your phone to download the app
            </p>
          </div>
        </motion.div>

        <motion.div
          className="space-y-4"
          variants={itemVariants}
        >
          <motion.button
            className="w-full bg-apex-green text-apex-black font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2"
            {...buttonHoverProps}
          >
            <Download size={20} />
            Download Mobile App
          </motion.button>
          <p className="text-xs text-apex-white/40">
            Available for iOS and Android
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Bike Selection Modal
 */
interface BikeSelectionModalProps {
  isOpen: boolean;
  bikes: BikeType[];
  onSelect: (bike: BikeType) => void;
  onClose: () => void;
}

const BikeSelectionModal = ({
  isOpen,
  bikes,
  onSelect,
  onClose,
}: BikeSelectionModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-apex-black/90 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.h2
                className="text-xl font-bold text-apex-white mb-4"
                variants={itemVariants}
              >
                Select Bike
              </motion.h2>
              <motion.div className="space-y-2" variants={containerVariants}>
                {bikes.length === 0 ? (
                  <motion.p
                    className="text-apex-white/60 text-center py-8"
                    variants={itemVariants}
                  >
                    No bikes in garage. Add a bike first.
                  </motion.p>
                ) : (
                  bikes.map((bike) => (
                    <motion.button
                      key={bike.id}
                      onClick={() => onSelect(bike)}
                      className="w-full text-left p-4 bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg hover:border-apex-green/40 transition-colors"
                      variants={itemVariants}
                      {...buttonHoverProps}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-apex-green/10 rounded-lg">
                          <Bike size={20} className="text-apex-green" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-apex-white">
                            {bike.nick_name || `${bike.make} ${bike.model}`}
                          </p>
                          <p className="text-sm text-apex-white/60">
                            {bike.make} {bike.model} {bike.year && `(${bike.year})`}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Long-Press Stop Button
 * Requires 3-second hold to prevent accidental triggers
 */
interface LongPressButtonProps {
  onLongPress: () => void;
  disabled?: boolean;
}

const LongPressStopButton = ({ onLongPress, disabled }: LongPressButtonProps) => {
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const LONG_PRESS_DURATION = 3000; // 3 seconds

  const handlePressStart = () => {
    if (disabled) return;
    setIsPressing(true);
    setProgress(0);

    // Start progress animation
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100);
      setProgress(newProgress);
    }, 16); // ~60fps

    // Trigger after 3 seconds
    pressTimerRef.current = setTimeout(() => {
      onLongPress();
      setIsPressing(false);
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }, LONG_PRESS_DURATION);
  };

  const handlePressEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsPressing(false);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <motion.button
      className="relative w-full max-w-xs mx-auto py-6 px-8 bg-apex-red/20 border-2 border-apex-red rounded-lg font-bold text-apex-red text-xl disabled:opacity-50 disabled:cursor-not-allowed"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <span className="relative z-10">STOP RIDE</span>
      {isPressing && (
        <motion.div
          className="absolute inset-0 bg-apex-red/30 rounded-lg"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      )}
    </motion.button>
  );
};

/**
 * Main Ride Component
 */
export default function Ride() {
  const isNative = Capacitor.isNativePlatform();
  const { bikes, isLoading: bikesLoading } = useBikes();
  const {
    isRecording,
    isPaused,
    coords,
    currentLean,
    maxLeanLeft,
    maxLeanRight,
    startTime,
    distanceKm,
    startRide,
    stopRide,
    saveRide,
  } = useRideTracking();

  // Use Zustand store for persistent state
  const selectedBike = useRideStore((state) => state.selectedBike);
  const setSelectedBike = useRideStore((state) => state.setSelectedBike);
  const resetRide = useRideStore((state) => state.resetRide);

  const [showBikeSelection, setShowBikeSelection] = useState(false);
  const [showSafetyWarning, setShowSafetyWarning] = useState(true);
  const [previousSpeed, setPreviousSpeed] = useState(0);
  const [currentDuration, setCurrentDuration] = useState(0);

  // Restore state from Zustand store on mount
  useEffect(() => {
    const store = useRideStore.getState();
    console.log('Ride component mounted, store state:', {
      isRecording: store.isRecording,
      selectedBike: store.selectedBike?.nick_name,
      coordsCount: store.coords.length,
      distance: store.distanceKm,
    });
    
    // Restore selected bike if it exists in store
    if (store.selectedBike && !selectedBike) {
      console.log('Restoring selected bike from store');
      setSelectedBike(store.selectedBike);
    }
    
    // Note: The hook now restores its state from the store on initialization
    // So if recording was active, it should be restored automatically
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBike]);

  // Calculate current speed from last coordinate (convert m/s to km/h)
  const lastCoord = coords.length > 0 ? coords[coords.length - 1] : null;
  const currentSpeed =
    lastCoord && lastCoord.speed
      ? Math.round(lastCoord.speed * 3.6) // m/s to km/h
      : 0;

  // Sync Zustand store with hook state - this ensures persistence
  useEffect(() => {
    const store = useRideStore.getState();
    store.setRecording(isRecording);
    store.setPaused(isPaused);
    if (startTime) {
      store.setStartTime(startTime);
    }
    // Sync telemetry data continuously
    store.setCurrentLean(currentLean);
    store.updateMaxLean(maxLeanLeft, maxLeanRight);
    store.setDistanceKm(distanceKm);
    
    // Debug log state changes
    if (isRecording) {
      console.log('Ride state sync:', {
        isRecording,
        isPaused,
        coords: coords.length,
        speed: currentSpeed,
        lean: currentLean.toFixed(1),
        distance: distanceKm.toFixed(2),
      });
    }
  }, [isRecording, isPaused, startTime, currentLean, maxLeanLeft, maxLeanRight, distanceKm, coords.length, currentSpeed]);

  // Speed change detection for pulse animation
  // Use a ref to track previous speed to avoid setState in effect
  const previousSpeedRef = useRef(previousSpeed);
  useEffect(() => {
    if (currentSpeed > previousSpeedRef.current && isRecording) {
      previousSpeedRef.current = currentSpeed;
      setPreviousSpeed(currentSpeed);
    }
  }, [currentSpeed, isRecording]);

  // Fade out safety warning after 5 seconds of recording
  useEffect(() => {
    if (isRecording && showSafetyWarning) {
      const timer = setTimeout(() => {
        setShowSafetyWarning(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isRecording, showSafetyWarning]);

  // Update duration every second when recording
  useEffect(() => {
    if (!isRecording || !startTime) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setCurrentDuration(0);
      }, 0);
      return () => clearTimeout(timeoutId);
    }

    const interval = setInterval(() => {
      const totalSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setCurrentDuration(totalSeconds);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isRecording, startTime]);

  // Show bike selection when starting ride
  const handleStartRide = async () => {
    if (bikes.length === 0) {
      apexToast.error('No bikes available. Add a bike to your garage first.');
      return;
    }
    
    // Always show bike selection if no bike is selected
    if (!selectedBike) {
      if (bikes.length === 1) {
        // Auto-select if only one bike
        setSelectedBike(bikes[0]);
        apexToast.success(`Selected: ${bikes[0].nick_name || `${bikes[0].make} ${bikes[0].model}`}`);
        // Don't start automatically - let user click again
        return;
      } else {
        setShowBikeSelection(true);
        return;
      }
    }

    // Bike is selected, start the ride
    try {
      console.log('Starting ride with bike:', selectedBike.id);
      await startRide();
      // Success - no toast needed, UI will update to show recording state
      // Permission request dialog will show automatically if needed
    } catch (error) {
      // Log technical details for debugging
      console.error('Error starting ride:', error);
      console.error('Start ride error details:', JSON.stringify(error, null, 2));
      
      // Show user-friendly error (permission errors are already handled by checkPermissions)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.toLowerCase().includes('permission')) {
        apexToast.error('Failed to start ride. Please try again.');
      }
    }
  };

  const handleBikeSelect = async (bike: BikeType) => {
    setSelectedBike(bike);
    setShowBikeSelection(false);
    apexToast.success(`Selected: ${bike.nick_name || `${bike.make} ${bike.model}`}`);
    // Don't auto-start - let user click Start Ride button
  };

  const handleStopRide = async () => {
    if (!selectedBike) {
      apexToast.error('No bike selected. Cannot save ride.');
      return;
    }

    try {
      console.log('Stopping ride...');
      await stopRide(selectedBike.id, true);
      // Don't show toast here - saveRide mutation handles it via onSuccess/onError
      
      // Reset UI state
      setSelectedBike(null);
      resetRide();
      setShowSafetyWarning(true);
      setPreviousSpeed(0);
      } catch (error) {
        // Log technical details for debugging
        console.error('Error stopping ride:', error);
        console.error('Stop ride error details:', JSON.stringify(error, null, 2));
        
        // Extract user-friendly error message
        let errorMessage = 'Failed to stop ride. Please try again.';
        if (error instanceof Error) {
          const msg = error.message.toLowerCase();
          // Map technical errors to user-friendly messages
          if (msg.includes('watchid') || msg.includes('not found')) {
            errorMessage = 'Ride tracking was already stopped.';
          } else if (!msg.includes('ride saved')) {
            // Use the error message if it's already user-friendly
            errorMessage = error.message;
          } else {
            // Don't show error if ride was saved successfully
            return;
          }
        }
        
        // Only show error if saveRide mutation didn't already show one
        // The mutation's onError will handle the toast
        apexToast.error(errorMessage);
      }
  };

  // Web fallback
  if (!isNative) {
    return <WebFallback />;
  }

  // Loading state
  if (bikesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-apex-black">
        <p className="text-apex-white/60">Loading...</p>
      </div>
    );
  }

  // No bikes state
  if (bikes.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-screen p-6 bg-apex-black"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="text-center space-y-4"
          variants={itemVariants}
        >
          <Bike size={64} className="text-apex-white/20 mx-auto" />
          <h2 className="text-xl font-bold text-apex-white">
            No bikes in garage
          </h2>
          <p className="text-apex-white/60">
            Add a bike to your garage before recording a ride.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-apex-black p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      key={isRecording ? 'recording' : 'ready'}
    >
      {/* Safety Warning */}
      <AnimatePresence>
        {showSafetyWarning && isRecording && (
          <motion.div
            className="fixed left-1/2 -translate-x-1/2 z-50 bg-apex-green/10 border border-apex-green/40 rounded-lg px-6 py-3 max-w-md"
            style={{ top: 'calc(3.5rem + max(env(safe-area-inset-top), 24px))' }}
            initial={{ opacity: 1, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-apex-green text-center font-semibold text-sm">
              Keep your eyes on the road
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bike Selection Modal */}
      <BikeSelectionModal
        isOpen={showBikeSelection}
        bikes={bikes}
        onSelect={handleBikeSelect}
        onClose={() => setShowBikeSelection(false)}
      />

      {!isRecording ? (
        /* Start Ride View */
        <motion.div
          className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] space-y-8"
          variants={itemVariants}
        >
          <motion.div
            className="text-center space-y-4"
            variants={itemVariants}
          >
            <h1 className="text-3xl font-bold text-apex-white">Ready to Ride</h1>
            <p className="text-apex-white/60">
              Select a bike and start tracking your ride
            </p>
          </motion.div>

          {/* Always show selected bike or prompt to select */}
          <motion.div
            className="bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg p-6 max-w-sm w-full"
            variants={itemVariants}
          >
            {selectedBike ? (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-apex-green/10 rounded-lg">
                  <Bike size={20} className="text-apex-green" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-apex-white">
                    {selectedBike.nick_name || `${selectedBike.make} ${selectedBike.model}`}
                  </p>
                  <p className="text-sm text-apex-white/60">
                    {selectedBike.make} {selectedBike.model}
                  </p>
                </div>
                <motion.button
                  onClick={() => setShowBikeSelection(true)}
                  className="text-apex-white/60 hover:text-apex-green text-sm"
                  {...buttonHoverProps}
                >
                  Change
                </motion.button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-apex-white/60 mb-3">No bike selected</p>
                <motion.button
                  onClick={() => setShowBikeSelection(true)}
                  className="bg-apex-white/10 hover:bg-apex-white/20 text-apex-white px-4 py-2 rounded-lg text-sm"
                  {...buttonHoverProps}
                >
                  Select Bike
                </motion.button>
              </div>
            )}
          </motion.div>

          <motion.button
            onClick={handleStartRide}
            className="bg-apex-green text-apex-black font-bold py-4 px-8 rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            variants={itemVariants}
            {...buttonHoverProps}
            disabled={!selectedBike || isRecording}
          >
            {isRecording ? 'Recording...' : selectedBike ? 'Start Ride' : 'Select Bike First'}
          </motion.button>
        </motion.div>
      ) : (
        /* Recording View - Dark Cockpit */
        <div className="flex flex-col min-h-[calc(100vh-8rem)]">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            variants={itemVariants}
          >
            <h2 className="text-xl font-bold text-apex-white mb-2">
              {selectedBike
                ? selectedBike.nick_name || `${selectedBike.make} ${selectedBike.model}`
                : 'Recording Ride'}
            </h2>
            {isPaused && (
              <p className="text-apex-green/60 text-sm">PAUSED</p>
            )}
          </motion.div>

          {/* Telemetry Display */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-12">
            {/* Lean Angle Gauges */}
            <div className="w-full max-w-2xl flex items-center justify-between gap-8">
              {/* Left Lean */}
              <motion.div
                className="flex-1 text-center"
                variants={itemVariants}
              >
                <p className="text-sm text-apex-white/60 mb-2 uppercase tracking-wide">
                  Max Left
                </p>
                <motion.div
                  className="text-4xl font-mono font-bold text-apex-green"
                  animate={{
                    scale: maxLeanLeft > 0 ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {maxLeanLeft.toFixed(1)}°
                </motion.div>
              </motion.div>

              {/* Speedometer */}
              <motion.div
                className="flex-1 text-center"
                variants={itemVariants}
              >
                <p className="text-sm text-apex-white/60 mb-4 uppercase tracking-wide">
                  Speed
                </p>
                <motion.div
                  className="text-7xl font-mono font-bold text-apex-green drop-shadow-[0_0_20px_rgba(0,255,65,0.5)]"
                  animate={{
                    scale: currentSpeed > previousSpeed ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  key={currentSpeed} // Force re-animation on speed change
                >
                  {currentSpeed}
                </motion.div>
                <p className="text-sm text-apex-white/40 mt-2">km/h</p>
              </motion.div>

              {/* Right Lean */}
              <motion.div
                className="flex-1 text-center"
                variants={itemVariants}
              >
                <p className="text-sm text-apex-white/60 mb-2 uppercase tracking-wide">
                  Max Right
                </p>
                <motion.div
                  className="text-4xl font-mono font-bold text-apex-green"
                  animate={{
                    scale: maxLeanRight > 0 ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {maxLeanRight.toFixed(1)}°
                </motion.div>
              </motion.div>
            </div>

            {/* Current Lean Angle */}
            <motion.div
              className="text-center"
              variants={itemVariants}
            >
              <p className="text-sm text-apex-white/60 mb-2 uppercase tracking-wide">
                Current Lean
              </p>
              <motion.div
                className="text-5xl font-mono font-bold text-apex-green"
                animate={{
                  scale: currentLean > 0 ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {currentLean.toFixed(1)}°
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 gap-6 w-full max-w-md"
              variants={containerVariants}
            >
              <motion.div
                className="bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg p-4 text-center"
                variants={itemVariants}
              >
                <p className="text-xs text-apex-white/60 mb-1 uppercase tracking-wide">
                  Distance
                </p>
                <p className="text-2xl font-mono font-bold text-apex-green">
                  {distanceKm.toFixed(2)}
                </p>
                <p className="text-xs text-apex-white/40 mt-1">km</p>
              </motion.div>
              <motion.div
                className="bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg p-4 text-center"
                variants={itemVariants}
              >
                <p className="text-xs text-apex-white/60 mb-1 uppercase tracking-wide">
                  Duration
                </p>
                <p className="text-2xl font-mono font-bold text-apex-white">
                  {currentDuration > 0
                    ? (() => {
                        const hours = Math.floor(currentDuration / 3600);
                        const minutes = Math.floor((currentDuration % 3600) / 60);
                        const seconds = currentDuration % 60;
                        if (hours > 0) {
                          return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        }
                        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                      })()
                    : '0:00'}
                </p>
                <p className="text-xs text-apex-white/40 mt-1">
                  {currentDuration >= 3600 ? 'hrs' : 'min'}
                </p>
              </motion.div>
            </motion.div>

            {/* Stop Button */}
            <motion.div
              className="mt-8"
              variants={itemVariants}
            >
              <LongPressStopButton
                onLongPress={handleStopRide}
                disabled={saveRide.isPending}
              />
              <p className="text-xs text-apex-white/40 text-center mt-2">
                Hold for 3 seconds to stop
              </p>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

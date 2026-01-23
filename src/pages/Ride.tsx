import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useRideTracking } from '../hooks/useRideTracking';
import { useBikes } from '../hooks/useBikes';
import { useDiscord } from '../hooks/useDiscord';
import { useRideStore } from '../stores/useRideStore';
import { useDiscordRpcStore } from '../stores/useDiscordRpcStore';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { containerVariants, itemVariants, buttonHoverProps } from '../lib/animations';
import { Motorbike, Gauge, Copy, Check } from 'lucide-react';
import { apexToast } from '../lib/toast';
import type { Bike as BikeType } from '../types/database';
import QRCode from 'react-qr-code';
import { PocketCurtain } from '../components/PocketCurtain';
import { usePocketModeDetection } from '../hooks/usePocketModeDetection';
import { RideStartupAnimation } from '../components/RideStartupAnimation';
import DebugPanel from '../components/DebugPanel';
import { logger } from '../lib/logger';
import { getCityFromCoords } from '../utils/geocode';

/**
 * Web Fallback Component
 * Full-screen, non-scrollable landing page for web platforms
 */
const WebFallback = () => {
  const downloadUrl = 'https://github.com/Purukitto/apex-app/releases/latest';
  const [qrSize, setQrSize] = useState(240);
  const [availableHeight, setAvailableHeight] = useState(600);
  const [copied, setCopied] = useState(false);

  // Calculate available height and QR code size
  useEffect(() => {
    const calculateDimensions = () => {
      if (typeof window === 'undefined') return;
      
      const isMobile = window.innerWidth < 768;
      // Account for header (3.5rem = 56px) and bottom nav (4rem = 64px) on mobile
      // Desktop has sidebar but no bottom nav
      const headerHeight = isMobile ? 56 : 0;
      const footerHeight = isMobile ? 64 : 0;
      const padding = isMobile ? 48 : 24; // Top and bottom padding
      
      const viewportHeight = window.innerHeight;
      const available = viewportHeight - headerHeight - footerHeight - padding;
      setAvailableHeight(available);
      
      // QR code should be proportional but not too large
      const viewportWidth = window.innerWidth;
      const maxQRSize = Math.min(
        Math.min(viewportWidth * 0.5, available * 0.35),
        280
      );
      setQrSize(Math.max(200, maxQRSize));
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      apexToast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy:', error);
      apexToast.error('Failed to copy link');
    }
  };

  return (
    <div 
      className="w-full bg-apex-black flex flex-col items-center justify-center"
      style={{ 
        height: availableHeight > 0 ? `${availableHeight}px` : 'calc(100vh - 7rem)',
        maxHeight: '100vh',
        overflow: 'hidden'
      }}
    >
      <motion.div
        className="flex flex-col items-center justify-center w-full max-w-sm px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section - Minimal Design */}
        <motion.div
          className="flex flex-col items-center space-y-3 mb-6"
          variants={itemVariants}
        >
          <motion.h1
            className="text-xl md:text-2xl font-medium text-apex-white text-center tracking-tight"
            variants={itemVariants}
          >
            Recorder is Mobile Only
          </motion.h1>
          
          <motion.p
            className="text-xs text-apex-white/40 text-center max-w-xs leading-relaxed"
            variants={itemVariants}
          >
            GPS and motion sensors are required for ride tracking
          </motion.p>
        </motion.div>

        {/* QR Code Section - Refined */}
        <motion.div
          className="flex flex-col items-center space-y-3 w-full"
          variants={itemVariants}
        >
          <div className="bg-apex-white p-3 rounded">
            <QRCode
              value={downloadUrl}
              size={qrSize}
              level="M"
              bgColor="var(--color-apex-white)"
              fgColor="var(--color-apex-black)"
            />
          </div>
          
          <p className="text-[10px] md:text-xs text-apex-white/50 text-center font-normal tracking-wider uppercase">
            Scan to download the latest build (APK)
          </p>
        </motion.div>

        {/* Copy Link Pill */}
        <motion.div
          className="mt-6 w-full"
          variants={itemVariants}
        >
          <motion.button
            onClick={handleCopyLink}
            className="w-full bg-apex-white/5 border border-apex-white/10 rounded-full px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-apex-white/10 hover:border-apex-white/20 transition-colors"
            {...buttonHoverProps}
          >
            {copied ? (
              <>
                <Check size={14} className="text-apex-green" />
                <span className="text-xs text-apex-green font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-apex-white/60" />
                <span className="text-xs text-apex-white/60 font-normal truncate max-w-[200px]">
                  {downloadUrl}
                </span>
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
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
              className="bg-apex-black border border-apex-white/20 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
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
                      className="w-full text-left p-4 bg-linear-to-br from-white/5 to-transparent border border-apex-white/20 rounded-md hover-border-theme transition-colors"
                      variants={itemVariants}
                      {...buttonHoverProps}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-apex-green/10 rounded-lg">
                          <Motorbike size={20} className="text-apex-green" />
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
  const { updatePresence } = useDiscord();
  const rpcEnabled = useDiscordRpcStore((state) => state.enabled);
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
    calibrate,
  } = useRideTracking();

  // Use Zustand store for persistent state
  const selectedBike = useRideStore((state) => state.selectedBike);
  const setSelectedBike = useRideStore((state) => state.setSelectedBike);
  const resetRide = useRideStore((state) => state.resetRide);
  const isPocketMode = useRideStore((state) => state.isPocketMode);
  const setPocketMode = useRideStore((state) => state.setPocketMode);

  // Detect proximity sensor for pocket mode
  usePocketModeDetection();

  const [showBikeSelection, setShowBikeSelection] = useState(false);
  const [showSafetyWarning, setShowSafetyWarning] = useState(true);
  const [previousSpeed, setPreviousSpeed] = useState(0);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [showStartupAnimation, setShowStartupAnimation] = useState(false);
  const hasTriedCityRef = useRef(false);

  const getBikeDisplayName = (bike: BikeType | null) => {
    if (!bike) return undefined;
    return bike.nick_name || `${bike.make} ${bike.model}`;
  };

  // Restore state from Zustand store on mount
  useEffect(() => {
    const store = useRideStore.getState();
    
    // Restore selected bike if it exists in store
    if (store.selectedBike && !selectedBike) {
      logger.trace('Restoring selected bike from store');
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

  // Resolve city from first coord and update Discord presence (when shareCity enabled, buildPresenceDetails uses it)
  useEffect(() => {
    if (!isRecording) {
      hasTriedCityRef.current = false;
      return;
    }
    if (!rpcEnabled || coords.length < 1 || !selectedBike || hasTriedCityRef.current) return;
    hasTriedCityRef.current = true;
    const c = coords[0];
    getCityFromCoords(c.latitude, c.longitude).then((city) => {
      if (city) {
        updatePresence.mutateAsync({
          type: 'start',
          bikeName: getBikeDisplayName(selectedBike) ?? undefined,
          city,
        }).catch((e) => logger.trace('Discord RPC city update failed:', e));
      }
    });
  }, [isRecording, rpcEnabled, coords, selectedBike, updatePresence]);

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
      logger.trace('Starting ride with bike:', selectedBike.id);
      // Show startup animation first
      setShowStartupAnimation(true);
      // Start ride will be triggered after animation completes
    } catch (error) {
      // Log technical details for debugging
      logger.error('Error starting ride:', error);
      logger.error('Start ride error details:', JSON.stringify(error, null, 2));
      
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

  const clearRpcPresence = async (bike: BikeType | null) => {
    if (!rpcEnabled) return;
    try {
      await updatePresence.mutateAsync({
        type: 'end',
        bikeName: getBikeDisplayName(bike),
      });
    } catch (rpcError) {
      logger.error('Discord RPC end update failed:', rpcError);
    }
  };

  const handleStopRide = async () => {
    if (!selectedBike) {
      apexToast.error('No bike selected. Cannot save ride.');
      return;
    }

    try {
      logger.trace('Stopping ride...');
      await stopRide(selectedBike.id, true);
      // Don't show toast here - saveRide mutation handles it via onSuccess/onError
      
      // Reset UI state only if save succeeded (stopRide will throw if save fails)
      setSelectedBike(null);
      resetRide();
      setShowSafetyWarning(true);
      setPreviousSpeed(0);
      setShowStartupAnimation(false);
    } catch (error) {
      // Log technical details for debugging
      logger.error('Error stopping ride:', error);
      logger.error('Stop ride error details:', JSON.stringify(error, null, 2));
      
      // Check if this is a save error - if so, the mutation's onError already showed a toast
      const isSaveError = error instanceof Error && 
        (error.message.toLowerCase().includes('save') ||
         error.message.toLowerCase().includes('failed to save') ||
         error.message.toLowerCase().includes('permission') ||
         error.message.toLowerCase().includes('network') ||
         error.message.toLowerCase().includes('authenticated'));
      
      // Only show toast for non-save errors (save errors are handled by mutation's onError)
      if (!isSaveError) {
        let errorMessage = 'Failed to stop ride. Please try again.';
        if (error instanceof Error) {
          const msg = error.message.toLowerCase();
          // Map technical errors to user-friendly messages
          if (msg.includes('watchid') || msg.includes('not found')) {
            errorMessage = 'Ride tracking was already stopped.';
          } else {
            errorMessage = error.message;
          }
        }
        apexToast.error(errorMessage);
      }
      // Don't reset UI state if save failed - keep ride data visible so user can retry
    } finally {
      await clearRpcPresence(selectedBike);
    }
  };

  const handleCalibrate = async () => {
    if (isCalibrating) return;
    
    setIsCalibrating(true);
    
    // Trigger haptic feedback
    if (isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        logger.warn('Haptic feedback not available:', error);
      }
    }
    
    // Perform calibration
    calibrate();
    
    // Show toast
    apexToast.success('Sensors Zeroed. Ready to lean.');
    
    // Reset calibration animation after a short delay
    setTimeout(() => {
      setIsCalibrating(false);
    }, 1000);
  };

  // Web fallback
  if (!isNative) {
    return <WebFallback />;
  }

  // Loading state
  if (bikesLoading) {
    return <LoadingSpinner fullScreen text="Loading ride recorder..." />;
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
          <Motorbike size={64} className="text-apex-white/20 mx-auto" />
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
    <>
      {/* Startup Animation */}
      {showStartupAnimation && (
        <RideStartupAnimation
          onComplete={async () => {
            setShowStartupAnimation(false);
            // Start ride after animation completes
            try {
              await startRide();
              if (rpcEnabled) {
                try {
                  await updatePresence.mutateAsync({
                    type: 'start',
                    bikeName: getBikeDisplayName(selectedBike),
                    city: undefined,
                  });
                } catch (error) {
                  logger.error('Discord RPC start update failed:', error);
                }
              }
            } catch (error) {
              // Log technical details for debugging
              logger.error('Error starting ride:', error);
              logger.error('Start ride error details:', JSON.stringify(error, null, 2));
              
              // Show user-friendly error (permission errors are already handled by checkPermissions)
              const errorMessage = error instanceof Error ? error.message : String(error);
              if (!errorMessage.toLowerCase().includes('permission')) {
                apexToast.error('Failed to start ride. Please try again.');
              }
            }
          }}
        />
      )}

      {/* Pocket Mode Overlay */}
      <PocketCurtain
        isActive={isPocketMode}
        onDismiss={() => setPocketMode(false)}
      />

      <motion.div
        className={`bg-apex-black ${isRecording ? 'fixed inset-0 p-0 overflow-hidden z-0' : 'h-full p-4 md:p-6 overflow-y-auto'}`}
        style={isRecording ? {
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        } : undefined}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={isRecording ? 'recording' : 'ready'}
      >
        {/* Safety Warning */}
        <AnimatePresence>
          {showSafetyWarning && isRecording && (
            <motion.div
              className="fixed left-1/2 -translate-x-1/2 z-100 bg-apex-black/95 backdrop-blur-sm border border-apex-green/40 rounded-lg px-6 py-3 max-w-md"
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
          className="flex flex-col items-center justify-center py-8 space-y-6"
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
            className="bg-linear-to-br from-white/5 to-transparent border border-apex-white/20 rounded-md p-6 max-w-sm w-full"
            variants={itemVariants}
          >
            {selectedBike ? (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-apex-green/10 rounded-lg">
                  <Motorbike size={20} className="text-apex-green" />
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
            className="bg-apex-green text-apex-black font-bold py-4 px-8 rounded-lg text-lg disabled:bg-apex-white/10 disabled:text-apex-white/50 disabled:cursor-not-allowed"
            variants={itemVariants}
            {...((selectedBike && !isRecording) ? buttonHoverProps : {})}
            disabled={!selectedBike || isRecording}
          >
            {isRecording ? 'Recording...' : selectedBike ? 'Start Ride' : 'Select Bike First'}
          </motion.button>
        </motion.div>
      ) : (
        /* Recording View - Dark Cockpit - Full Screen */
        <div className="flex flex-col h-screen w-full p-6 overflow-y-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-6 mt-4"
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
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-4">
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
                className="bg-linear-to-br from-white/5 to-transparent border border-apex-white/20 rounded-md p-4 text-center"
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
                className="bg-linear-to-br from-white/5 to-transparent border border-apex-white/20 rounded-md p-4 text-center"
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

            {/* Debug Panels */}
            <div className="w-full max-w-md space-y-2">
              <DebugPanel 
                title="coordinates" 
                data={{ count: coords.length, lastCoord: coords[coords.length - 1] || null }}
                maxHeight="max-h-24"
              />
              <DebugPanel 
                title="telemetry" 
                data={{ 
                  currentLean, 
                  maxLeanLeft, 
                  maxLeanRight, 
                  currentSpeed, 
                  distanceKm,
                  duration: currentDuration 
                }}
                maxHeight="max-h-24"
              />
            </div>

            {/* Calibrate Button */}
            <motion.div
              className="mt-4"
              variants={itemVariants}
            >
              <motion.button
                onClick={handleCalibrate}
                disabled={isCalibrating}
                className="relative w-full max-w-xs mx-auto py-3 px-6 bg-apex-white/10 border border-apex-white/20 rounded-lg font-semibold text-apex-white text-sm disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                {...buttonHoverProps}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Gauge size={18} />
                  {isCalibrating ? 'Recalibrating...' : 'Calibrate'}
                </span>
                {isCalibrating && (
                  <>
                    {/* Ripple effect */}
                    <motion.div
                      className="absolute inset-0 bg-apex-green/20"
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{
                        scale: [0, 2, 2.5],
                        opacity: [1, 0.5, 0],
                      }}
                      transition={{
                        duration: 1,
                        ease: 'easeOut',
                        repeat: Infinity,
                      }}
                      style={{
                        borderRadius: '50%',
                        left: '50%',
                        top: '50%',
                        x: '-50%',
                        y: '-50%',
                        width: '100%',
                        height: '100%',
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-apex-green/20"
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{
                        scale: [0, 2, 2.5],
                        opacity: [1, 0.5, 0],
                      }}
                      transition={{
                        duration: 1,
                        ease: 'easeOut',
                        delay: 0.3,
                        repeat: Infinity,
                      }}
                      style={{
                        borderRadius: '50%',
                        left: '50%',
                        top: '50%',
                        x: '-50%',
                        y: '-50%',
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  </>
                )}
              </motion.button>
            </motion.div>

            {/* Stop Buttons */}
            <motion.div
              className="mt-6 space-y-3"
              variants={itemVariants}
            >
              {/* Save and Stop Button */}
              <LongPressStopButton
                onLongPress={handleStopRide}
                disabled={saveRide.isPending}
              />
              <p className="text-xs text-apex-white/40 text-center">
                Hold for 3 seconds to stop and save
              </p>
              
              {/* Discard Button */}
              <motion.button
                onClick={async () => {
                  try {
                    await stopRide(undefined, false);
                    setSelectedBike(null);
                    resetRide();
                    setShowSafetyWarning(true);
                    setPreviousSpeed(0);
                    setShowStartupAnimation(false);
                    apexToast.success('Ride discarded');
                  } catch (error) {
                    logger.error('Error discarding ride:', error);
                    apexToast.error('Failed to discard ride');
                  } finally {
                    await clearRpcPresence(selectedBike);
                  }
                }}
                disabled={saveRide.isPending}
                className="w-full max-w-xs mx-auto py-3 px-6 bg-apex-white/5 border border-apex-white/20 rounded-lg font-semibold text-apex-white/60 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-apex-white/10 hover:border-apex-white/30 hover:text-apex-white transition-colors"
                {...buttonHoverProps}
              >
                Discard Ride
              </motion.button>
              <p className="text-xs text-apex-white/30 text-center">
                Discard without saving
              </p>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
    </>
  );
}

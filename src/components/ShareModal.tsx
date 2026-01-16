import { useState, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { buttonHoverProps } from '../lib/animations';
import type { Ride } from '../types/database';
import type { Bike } from '../types/database';
import { shareRideImage, type ShareMode } from '../lib/shareRide';
import { Capacitor } from '@capacitor/core';
import { apexToast } from '../lib/toast';
import { logger } from '../lib/logger';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: Ride;
  bike: Bike | undefined;
}

const SHARE_MODES: { id: ShareMode; label: string; description: string }[] = [
  {
    id: 'no-map-no-image',
    label: 'Stats Only',
    description: 'No map, no image background',
  },
  {
    id: 'map-no-image',
    label: 'With Map',
    description: 'Map included, no image background',
  },
  {
    id: 'no-map-image-dark',
    label: 'Image Background',
    description: 'Darkened image background, no map',
  },
  {
    id: 'map-image-dark',
    label: 'Map + Image',
    description: 'Both map and darkened image background',
  },
  {
    id: 'no-map-image-transparent',
    label: 'Transparent',
    description: 'Image background, transparent (no dark overlay)',
  },
];

export default function ShareModal({ isOpen, onClose, ride, bike }: ShareModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [dragX, setDragX] = useState(0);

  // Reset to first option when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setDragX(0);
    }
  }, [isOpen]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : SHARE_MODES.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < SHARE_MODES.length - 1 ? prev + 1 : 0));
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      handlePrevious();
    } else if (info.offset.x < -threshold) {
      handleNext();
    }
    setDragX(0);
  };

  const handleShare = async () => {
    if (isSharing) return;

    setIsSharing(true);
    const selectedMode = SHARE_MODES[currentIndex].id;

    try {
      if (Capacitor.isNativePlatform()) {
        apexToast.promise(
          shareRideImage(ride, bike, selectedMode),
          {
            loading: 'Generating share image...',
            success: 'Ride shared',
            error: 'Failed to share ride',
          }
        );
      } else {
        const sharePromise = shareRideImage(ride, bike, selectedMode).then((method) => {
          return method === 'clipboard' 
            ? 'Image copied to clipboard' 
            : 'Image downloaded';
        });
        
        apexToast.promise(
          sharePromise,
          {
            loading: 'Generating share image...',
            success: (message) => message,
            error: 'Failed to share ride',
          }
        );
      }
      onClose();
    } catch (error) {
      logger.error('Error sharing ride:', error);
      apexToast.error('Failed to share ride');
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm z-[1000]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          className="bg-apex-black border border-apex-white/20 rounded-lg w-full max-w-md relative z-[1001] pointer-events-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-apex-white/10">
            <h2 className="text-xl font-bold text-apex-white">Share Ride</h2>
            <motion.button
              onClick={onClose}
              className="p-2 text-apex-white/60 hover:text-apex-white transition-colors"
              {...buttonHoverProps}
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* Swipeable Content */}
          <div className="relative overflow-hidden">
            <motion.div
              className="flex"
              style={{
                x: dragX - currentIndex * 100 + '%',
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDrag={(_, info) => setDragX(info.offset.x)}
              onDragEnd={handleDragEnd}
              animate={{
                x: `-${currentIndex * 100}%`,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            >
              {SHARE_MODES.map((mode) => (
                <div
                  key={mode.id}
                  className="w-full flex-shrink-0 px-6 py-8"
                >
                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold text-apex-white">
                      {mode.label}
                    </h3>
                    <p className="text-sm text-apex-white/60">
                      {mode.description}
                    </p>
                    {/* Preview placeholder */}
                    <div className="mt-6 aspect-square bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg flex items-center justify-center">
                      <p className="text-xs text-apex-white/40 font-mono">
                        Preview
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Navigation Dots */}
          <div className="flex items-center justify-center gap-2 py-4">
            {SHARE_MODES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-apex-green w-8'
                    : 'bg-apex-white/20 hover:bg-apex-white/40'
                }`}
                aria-label={`Go to option ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center justify-between px-6 pb-6">
            <motion.button
              onClick={handlePrevious}
              className="p-2 text-apex-white/60 hover:text-apex-white transition-colors"
              {...buttonHoverProps}
              aria-label="Previous option"
            >
              <ChevronLeft size={24} />
            </motion.button>

            <motion.button
              onClick={handleShare}
              disabled={isSharing}
              className="px-6 py-3 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              {...(isSharing ? {} : buttonHoverProps)}
            >
              {isSharing ? 'Sharing...' : 'Share'}
            </motion.button>

            <motion.button
              onClick={handleNext}
              className="p-2 text-apex-white/60 hover:text-apex-white transition-colors"
              {...buttonHoverProps}
              aria-label="Next option"
            >
              <ChevronRight size={24} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

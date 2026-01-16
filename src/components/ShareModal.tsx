import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { buttonHoverProps } from "../lib/animations";
import type { Ride } from "../types/database";
import type { Bike } from "../types/database";
import {
  shareRideImage,
  generateRideShareImage,
  generateAllRideShareImages,
  type ShareMode,
} from "../lib/shareRide";
import { Capacitor } from "@capacitor/core";
import { apexToast } from "../lib/toast";
import { logger } from "../lib/logger";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: Ride;
  bike: Bike | undefined;
}

const SHARE_MODES: { id: ShareMode; label: string }[] = [
  {
    id: "no-map-no-image",
    label: "Stats Only",
  },
  {
    id: "map-no-image",
    label: "With Map",
  },
  {
    id: "no-map-image-dark",
    label: "Image Background",
  },
  {
    id: "map-image-dark",
    label: "Map + Image",
  },
  {
    id: "no-map-image-transparent",
    label: "Transparent",
  },
];

export default function ShareModal({
  isOpen,
  onClose,
  ride,
  bike,
}: ShareModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [previewImages, setPreviewImages] = useState<Record<string, string>>(
    {}
  );
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState<
    Record<string, boolean>
  >({});

  // Generate preview for a specific mode
  const generatePreview = async (modeId: ShareMode) => {
    // Don't regenerate if we already have it
    if (previewImages[modeId]) return;

    setIsGeneratingPreviews((prev) => ({ ...prev, [modeId]: true }));
    try {
      const preview = await generateRideShareImage(ride, bike, modeId);
      if (preview && preview.startsWith("data:image")) {
        setPreviewImages((prev) => ({ ...prev, [modeId]: preview }));
      } else {
        logger.warn(
          `Invalid preview data for ${modeId}:`,
          preview?.substring(0, 50)
        );
      }
    } catch (error) {
      logger.error(`Failed to generate preview for ${modeId}:`, error);
    } finally {
      setIsGeneratingPreviews((prev) => ({ ...prev, [modeId]: false }));
    }
  };

  // Generate all previews in background when modal opens (optimized batch generation)
  useEffect(() => {
    if (isOpen) {
      // Reset state
      setCurrentIndex(0);
      setDragX(0);
      setPreviewImages({});
      setIsGeneratingPreviews({});

      // Generate all previews at once using optimized batch function
      setIsGeneratingPreviews({
        "no-map-no-image": true,
        "map-no-image": true,
        "no-map-image-dark": true,
        "map-image-dark": true,
        "no-map-image-transparent": true,
      });

      generateAllRideShareImages(ride, bike)
        .then((results) => {
          setPreviewImages(results);
          setIsGeneratingPreviews({});
        })
        .catch((error) => {
          logger.error("Batch preview generation failed:", error);
          setIsGeneratingPreviews({});
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ride.id]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : SHARE_MODES.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < SHARE_MODES.length - 1 ? prev + 1 : 0));
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
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
        apexToast.promise(shareRideImage(ride, bike, selectedMode), {
          loading: "Generating share image...",
          success: "Ride shared",
          error: "Failed to share ride",
        });
      } else {
        const sharePromise = shareRideImage(ride, bike, selectedMode).then(
          (method) => {
            return method === "clipboard"
              ? "Image copied to clipboard"
              : "Image downloaded";
          }
        );

        apexToast.promise(sharePromise, {
          loading: "Generating share image...",
          success: (message) => message,
          error: "Failed to share ride",
        });
      }
      onClose();
    } catch (error) {
      logger.error("Error sharing ride:", error);
      apexToast.error("Failed to share ride");
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
                x: dragX - currentIndex * 100 + "%",
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDrag={(_, info) => setDragX(info.offset.x)}
              onDragEnd={handleDragEnd}
              animate={{
                x: `-${currentIndex * 100}%`,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              {SHARE_MODES.map((mode) => (
                <div key={mode.id} className="w-full flex-shrink-0 px-6 py-8">
                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold text-apex-white">
                      {mode.label}
                    </h3>
                    {/* Preview */}
                    <div
                      className="mt-6 aspect-square bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg overflow-hidden relative cursor-pointer"
                      onClick={() =>
                        !previewImages[mode.id] &&
                        !isGeneratingPreviews[mode.id] &&
                        generatePreview(mode.id)
                      }
                    >
                      {isGeneratingPreviews[mode.id] ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-apex-black/50">
                          <p className="text-xs text-apex-white/40 font-mono">
                            Generating...
                          </p>
                        </div>
                      ) : previewImages[mode.id] ? (
                        <img
                          src={previewImages[mode.id]}
                          alt={`${mode.label} preview`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            logger.error(
                              `Failed to load preview image for ${mode.id}`
                            );
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-xs text-apex-white/40 font-mono">
                            Click to generate preview
                          </p>
                        </div>
                      )}
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
                    ? "bg-apex-green w-8"
                    : "bg-apex-white/20 hover:bg-apex-white/40"
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
              {isSharing ? "Sharing..." : "Share"}
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

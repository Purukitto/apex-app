import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Card } from "./ui/Card";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: Ride;
  bike: Bike | undefined;
}

const SHARE_MODES: { id: ShareMode; label: string; requiresMap?: boolean }[] = [
  {
    id: "no-map-no-image",
    label: "Stats Only",
  },
  {
    id: "map-no-image",
    label: "With Map",
    requiresMap: true,
  },
  {
    id: "no-map-image-dark",
    label: "Image Background",
  },
  {
    id: "map-image-dark",
    label: "Map + Image",
    requiresMap: true,
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
  const [previewImages, setPreviewImages] = useState<Record<string, string>>(
    {}
  );
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState<
    Record<string, boolean>
  >({});
  const hasRoute =
    !!ride.route_path &&
    Array.isArray(ride.route_path.coordinates) &&
    ride.route_path.coordinates.length > 0;
  const availableModes = useMemo(
    () =>
      SHARE_MODES.filter((mode) => (mode.requiresMap ? hasRoute : true)),
    [hasRoute]
  );
  const currentMode = useMemo(
    () => availableModes[currentIndex],
    [availableModes, currentIndex]
  );

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
      setPreviewImages({});
      setIsGeneratingPreviews({});

      // Generate all previews at once using optimized batch function
      const previewState: Record<string, boolean> = {};
      availableModes.forEach((mode) => {
        previewState[mode.id] = true;
      });
      setIsGeneratingPreviews(previewState);

      generateAllRideShareImages(ride, bike)
        .then((results) => {
          const filtered: Record<string, string> = {};
          availableModes.forEach((mode) => {
            filtered[mode.id] = results[mode.id];
          });
          setPreviewImages(filtered);
          setIsGeneratingPreviews({});
        })
        .catch((error) => {
          logger.error("Batch preview generation failed:", error);
          setIsGeneratingPreviews({});
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ride.id, ride.route_path, availableModes]);

  const handlePrevious = () => {
    setCurrentIndex((prev) =>
      prev > 0 ? prev - 1 : Math.max(availableModes.length - 1, 0)
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev < availableModes.length - 1 ? prev + 1 : 0
    );
  };

  const handleShare = async () => {
    if (isSharing) return;

    setIsSharing(true);
    const selectedMode = currentMode?.id ?? SHARE_MODES[0].id;
    if (currentMode?.requiresMap && !previewImages[currentMode.id]) {
      apexToast.error("Map preview still loading");
      setIsSharing(false);
      return;
    }

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
    <Dialog
      open={isOpen}
      modal={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("[data-devtools-button]")) {
            event.preventDefault();
          }
        }}
      >
        <div className="flex items-center justify-between border-b border-apex-white/10 p-6">
          <DialogHeader>
            <DialogTitle>Share Ride</DialogTitle>
            <DialogDescription className="sr-only">
              Preview and share ride images with optional map overlays.
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <motion.button
              onClick={onClose}
              className="p-2 text-apex-white/60 hover:text-apex-white transition-colors"
              {...buttonHoverProps}
            >
              <X size={20} />
            </motion.button>
          </DialogClose>
        </div>

        <div className="px-6 pt-6">
          <Tabs
            value={currentMode?.id}
            onValueChange={(value) => {
              const index = availableModes.findIndex(
                (mode) => mode.id === value
              );
              if (index !== -1) setCurrentIndex(index);
            }}
          >
            <TabsList>
              {availableModes.map((mode) => (
                <TabsTrigger key={mode.id} value={mode.id} asChild>
                  <motion.button
                    {...buttonHoverProps}
                    className="px-3 py-2"
                  >
                    {mode.label}
                  </motion.button>
                </TabsTrigger>
              ))}
            </TabsList>

            {availableModes.map((mode) => (
              <TabsContent key={mode.id} value={mode.id}>
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold text-apex-white">
                    {mode.label}
                  </h3>
                  <Card
                    padding="none"
                    hover={false}
                    animate="none"
                    className="relative aspect-square overflow-hidden"
                  >
                    <motion.button
                      onClick={() =>
                        !previewImages[mode.id] &&
                        !isGeneratingPreviews[mode.id] &&
                        generatePreview(mode.id)
                      }
                      className="absolute inset-0"
                      aria-label={`Generate ${mode.label} preview`}
                      {...buttonHoverProps}
                    />
                    <AnimatePresence mode="wait">
                      {isGeneratingPreviews[mode.id] ? (
                        <motion.div
                          key="loading"
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="h-full w-full animate-shimmer bg-apex-white/5" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-xs text-apex-white/40 font-mono">
                              Generating...
                            </p>
                          </div>
                        </motion.div>
                      ) : previewImages[mode.id] ? (
                        <motion.img
                          key="preview"
                          src={previewImages[mode.id]}
                          alt={`${mode.label} preview`}
                          className="h-full w-full object-contain"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onError={(e) => {
                            logger.error(
                              `Failed to load preview image for ${mode.id}`
                            );
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <motion.div
                          key="empty"
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <p className="text-xs text-apex-white/40 font-mono">
                            {mode.requiresMap
                              ? "Loading map preview..."
                              : "Tap to generate preview"}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="flex items-center justify-between px-6 pb-6 pt-5">
          <Button variant="ghost" size="icon" asChild>
            <motion.button
              onClick={handlePrevious}
              aria-label="Previous option"
              {...buttonHoverProps}
            >
              <ChevronLeft size={22} />
            </motion.button>
          </Button>

          <Button asChild>
            <motion.button
              onClick={handleShare}
              disabled={
                isSharing ||
                (currentMode?.requiresMap &&
                  !previewImages[currentMode.id])
              }
              {...(isSharing ? {} : buttonHoverProps)}
            >
              {isSharing ? "Sharing..." : "Share"}
            </motion.button>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <motion.button
              onClick={handleNext}
              aria-label="Next option"
              {...buttonHoverProps}
            >
              <ChevronRight size={22} />
            </motion.button>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

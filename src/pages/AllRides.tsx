import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useBikes } from "../hooks/useBikes";
import { useRides } from "../hooks/useRides";
import { supabase } from "../lib/supabaseClient";
import ShareModal from "../components/ShareModal";
import { exportToGPX } from "../utils/gpx";
import { logger } from "../lib/logger";
import { apexToast } from "../lib/toast";
import {
  MapPin,
  Timer,
  TrendingUp,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  Share2,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  containerVariants,
  itemVariants,
  buttonHoverProps,
} from "../lib/animations";
import ConfirmModal from "../components/ConfirmModal";
import RideMap from "../components/RideMap";
import LoadingSpinner from "../components/LoadingSpinner";
import DebugPanel from "../components/DebugPanel";
import PullToRefreshIndicator from "../components/PullToRefreshIndicator";
import { useThemeColors } from "../hooks/useThemeColors";
import { formatDateTime, formatDuration, formatShortDate } from "../utils/format";
import type { Ride } from "../types/database";
import { useQueryClient } from "@tanstack/react-query";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { Card } from "../components/ui/Card";

const PAGE_SIZE = 20;

export default function AllRides() {
  const { primary } = useThemeColors();
  const { bikes } = useBikes();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const rideIdFromUrl = searchParams.get("rideId");
  const [page, setPage] = useState(0);
  const [expandedRideId, setExpandedRideId] = useState<string | null>(null);
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);
  const [rideToShare, setRideToShare] = useState<Ride | null>(null);
  const [editRideName, setEditRideName] = useState("");
  const [editRideNotes, setEditRideNotes] = useState("");
  const [editRideImageUrl, setEditRideImageUrl] = useState("");
  const [isFindingRide, setIsFindingRide] = useState(false);

  const { rides, total, isLoading, updateRide, deleteRide, refetch } = useRides({
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = total ? Math.ceil(total / PAGE_SIZE) : 0;

  // Handle rideId from URL - find and expand the ride
  useEffect(() => {
    if (!rideIdFromUrl || isLoading) return;

    // Check if the ride is in the current page
    const rideInCurrentPage = rides.find((r) => r.id === rideIdFromUrl);

    if (rideInCurrentPage) {
      // Ride is on current page, expand it
      if (expandedRideId !== rideIdFromUrl) {
        setExpandedRideId(rideIdFromUrl);
      }
      // Clear the URL param
      setSearchParams({}, { replace: true });
      // Scroll to the ride after a brief delay to ensure it's rendered
      setTimeout(() => {
        const element = document.querySelector(
          `[data-ride-id="${rideIdFromUrl}"]`
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
      return;
    }

    // Ride is not on current page, need to find which page it's on
    if (isFindingRide) return; // Already searching

    setIsFindingRide(true);

    const findRidePage = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsFindingRide(false);
          return;
        }

        // Fetch the ride to get its start_time
        const { data: ride, error } = await supabase
          .from("rides")
          .select("start_time")
          .eq("id", rideIdFromUrl)
          .eq("user_id", user.id)
          .single();

        if (error || !ride) {
          logger.error("Error finding ride:", error);
          setIsFindingRide(false);
          setSearchParams({}, { replace: true });
          return;
        }

        // Count how many rides come before this one (ordered by start_time DESC)
        const { count } = await supabase
          .from("rides")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gt("start_time", ride.start_time);

        if (count !== null) {
          // Calculate which page this ride is on
          const targetPage = Math.floor(count / PAGE_SIZE);
          setPage(targetPage);
          // The expansion will happen when the ride loads on the new page
        }
      } catch (error) {
        logger.error("Error finding ride page:", error);
        setIsFindingRide(false);
        setSearchParams({}, { replace: true });
      } finally {
        // Don't set isFindingRide to false here - let it stay true until the ride is found
        // It will be reset when the ride is found and expanded
      }
    };

    findRidePage();
  }, [
    rideIdFromUrl,
    rides,
    isLoading,
    isFindingRide,
    expandedRideId,
    setSearchParams,
  ]);

  // Expand the ride once it's loaded on the correct page (after page change)
  useEffect(() => {
    if (
      rideIdFromUrl &&
      !isLoading &&
      rides.length > 0 &&
      expandedRideId !== rideIdFromUrl
    ) {
      const rideInCurrentPage = rides.find((r) => r.id === rideIdFromUrl);
      if (rideInCurrentPage) {
        setExpandedRideId(rideIdFromUrl);
        setIsFindingRide(false); // Reset finding state
        setSearchParams({}, { replace: true });
        // Scroll to the ride
        setTimeout(() => {
          const element = document.querySelector(
            `[data-ride-id="${rideIdFromUrl}"]`
          );
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
  }, [rideIdFromUrl, rides, isLoading, expandedRideId, setSearchParams]);

  // Create a map of bike IDs to bike objects for quick lookup
  const bikeMap = new Map(bikes.map((bike) => [bike.id, bike]));

  const formatRideDate = (dateString: string): string =>
    formatShortDate(dateString, { includeYear: true, useRelative: true });

  const handleToggleExpand = (rideId: string) => {
    setExpandedRideId(expandedRideId === rideId ? null : rideId);
  };

  const handleEditClick = (ride: Ride) => {
    setEditingRide(ride);
    setEditRideName(ride.ride_name || "");
    setEditRideNotes(ride.notes || "");
    setEditRideImageUrl(ride.image_url || "");
  };

  const handleSaveEdit = async () => {
    if (!editingRide) return;

    try {
      // Build updates object, only including fields that have values or need to be cleared
      const updates: Partial<Pick<Ride, "ride_name" | "notes" | "image_url">> =
        {};

      const trimmedName = editRideName.trim();
      const trimmedNotes = editRideNotes.trim();
      const trimmedImageUrl = editRideImageUrl.trim();

      // Only include fields that have changed or need to be set
      if (trimmedName !== (editingRide.ride_name || "")) {
        updates.ride_name = trimmedName || null;
      }
      if (trimmedNotes !== (editingRide.notes || "")) {
        updates.notes = trimmedNotes || null;
      }
      if (trimmedImageUrl !== (editingRide.image_url || "")) {
        updates.image_url = trimmedImageUrl || null;
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await updateRide.mutateAsync({
          id: editingRide.id,
          updates,
        });
      }

      setEditingRide(null);
      setEditRideName("");
      setEditRideNotes("");
      setEditRideImageUrl("");
    } catch (error) {
      logger.error("Error updating ride:", error);
    }
  };

  const handleDeleteClick = (ride: Ride) => {
    setRideToDelete(ride);
  };

  const handleConfirmDelete = async () => {
    if (!rideToDelete) return;

    try {
      await deleteRide.mutateAsync(rideToDelete.id);
      setRideToDelete(null);
      if (expandedRideId === rideToDelete.id) {
        setExpandedRideId(null);
      }
    } catch (error) {
      logger.error("Error deleting ride:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setExpandedRideId(null);
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleShareClick = (ride: Ride) => {
    setRideToShare(ride);
  };

  const handleExportGPX = async (ride: Ride) => {
    try {
      apexToast.promise(exportToGPX(ride.id), {
        loading: "Exporting GPX...",
        success: "GPX file ready to share",
        error: (error) => {
          if (error instanceof Error) {
            return error.message;
          }
          return "Failed to export GPX file";
        },
      });
    } catch (error) {
      logger.error("Error exporting GPX:", error);
      apexToast.error(
        error instanceof Error ? error.message : "Failed to export GPX file"
      );
    }
  };

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ["bikes"] }),
    ]);
  }, [refetch, queryClient]);

  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
    logLabel: "rides",
  });

  if (isLoading && rides.length === 0) {
    return <LoadingSpinner fullScreen text="Loading rides..." />;
  }

  return (
    <div className="h-full flex flex-col">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        accentColor={primary}
      />
      <motion.div
        className="p-6 pb-32 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Subheader */}
        <motion.div variants={itemVariants}>
          {total !== undefined && (
            <p className="text-sm text-white/60">
              {total} {total === 1 ? "ride" : "rides"} total
            </p>
          )}
        </motion.div>

        {/* Rides List */}
        {rides.length === 0 ? (
          <Card padding="lg" animate="item" className="text-center">
            <Timer className="mx-auto mb-3 text-white/20" size={32} />
            <p className="text-sm text-white/40">
              No rides recorded yet. Start tracking your rides to see them here.
            </p>
          </Card>
        ) : (
          <motion.div className="space-y-3" variants={containerVariants}>
            {rides.map((ride) => {
              const bike = bikeMap.get(ride.bike_id);
              const bikeName =
                bike?.nick_name || bike
                  ? `${bike.make} ${bike.model}`
                  : "Unknown Bike";
              const maxLean = Math.max(ride.max_lean_left, ride.max_lean_right);
              const isExpanded = expandedRideId === ride.id;

              return (
                <Card
                  key={ride.id}
                  data-ride-id={ride.id}
                  padding="none"
                  animate="fastItem"
                  className="overflow-hidden"
                  layout
                >
                  {/* Card Header - Always Visible */}
                  <motion.div
                    className="p-5 cursor-pointer"
                    onClick={() => handleToggleExpand(ride.id)}
                    whileHover={{
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                    }}
                    whileTap={{ backgroundColor: "rgba(255, 255, 255, 0.04)" }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {ride.ride_name || bikeName}
                        </h3>
                        {ride.ride_name && (
                          <p className="text-sm text-white/40 truncate mt-1">
                            {bikeName}
                          </p>
                        )}
                      </div>
                      <motion.div
                        className="ml-2 shrink-0"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={20} className="text-white/40" />
                      </motion.div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} style={{ color: primary }} />
                        <span className="text-sm text-white/80 font-mono">
                          {ride.distance_km.toFixed(1)} km
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer size={16} style={{ color: primary }} />
                        <span className="text-sm text-white/80">
                          {formatDuration(ride.start_time, ride.end_time)}
                        </span>
                      </div>
                      {maxLean > 0 && (
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} style={{ color: primary }} />
                          <span className="text-sm text-white/80 font-mono">
                            {maxLean.toFixed(1)}°
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-white/40 font-mono">
                        {formatRideDate(ride.start_time)}
                      </span>
                    </div>
                  </motion.div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0 border-t border-white/5 space-y-4">
                          {/* Additional Ride Details */}
                          <div className="grid grid-cols-2 gap-4 pt-4">
                            <div>
                              <p className="text-xs text-white/60 mb-1">
                                Start Time
                              </p>
                              <p className="text-sm text-white/80 font-mono">
                                {formatDateTime(ride.start_time)}
                              </p>
                            </div>
                            {ride.end_time && (
                              <div>
                                <p className="text-xs text-white/60 mb-1">
                                  End Time
                                </p>
                                <p className="text-sm text-white/80 font-mono">
                                  {formatDateTime(ride.end_time)}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Fuel Cost Estimate */}
                          {(() => {
                            const bike = bikeMap.get(ride.bike_id);
                            if (
                              bike &&
                              bike.avg_mileage &&
                              bike.last_fuel_price
                            ) {
                              const fuelCost =
                                (ride.distance_km / bike.avg_mileage) *
                                bike.last_fuel_price;
                              return (
                                <div className="p-3 bg-apex-green/10 border border-apex-green/20 rounded-lg">
                                  <p className="text-xs text-apex-white/60 mb-1">
                                    Est. Fuel Cost
                                  </p>
                                  <p className="text-sm font-mono text-apex-green">
                                    ₹{fuelCost.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-apex-white/40 mt-1">
                                    Based on {bike.avg_mileage.toFixed(2)} km/L
                                    @ ₹{bike.last_fuel_price.toFixed(2)}/L
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {ride.notes && (
                            <div>
                              <p className="text-xs text-white/60 mb-1">
                                Notes
                              </p>
                              <p className="text-sm text-white/80 whitespace-pre-wrap">
                                {ride.notes}
                              </p>
                            </div>
                          )}

                          {/* Ride Image */}
                          {ride.image_url && ride.image_url.trim() !== "" && (
                            <div>
                              <p className="text-xs text-white/60 mb-2">
                                Image
                              </p>
                              <div className="relative w-full aspect-video rounded-md overflow-hidden border border-apex-white/20 bg-gradient-to-br from-white/5 to-transparent">
                                <img
                                  src={ride.image_url}
                                  alt="Ride image"
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    logger.error('Failed to load ride image', {
                                      rideId: ride.id,
                                      imageUrl: ride.image_url,
                                      imgSrc: (e.target as HTMLImageElement).src,
                                    });
                                    const img = e.target as HTMLImageElement;
                                    img.style.display = "none";
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Route Map */}
                          {ride.route_path && (
                            <div>
                              <p className="text-xs text-white/60 mb-2">
                                Route
                              </p>
                              <DebugPanel
                                title="route_path"
                                data={ride.route_path}
                              />
                              {ride.route_path.coordinates &&
                              Array.isArray(ride.route_path.coordinates) &&
                              ride.route_path.coordinates.length > 0 ? (
                                <RideMap
                                  coordinates={ride.route_path.coordinates.map(
                                    ([lng, lat]: [number, number]) =>
                                      [lat, lng] as [number, number]
                                  )}
                                  className="w-full"
                                  interactive={false}
                                  height="250px"
                                />
                              ) : (
                                <div className="p-4 bg-apex-black/30 border border-apex-white/10 rounded-md text-center">
                                  <p className="text-xs text-apex-white/60 font-mono">
                                    Route data format not recognized
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap justify-start gap-2 pt-2 mx-auto max-w-fit">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareClick(ride);
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-apex-green/10 border border-apex-green/30 rounded-lg text-apex-green text-sm hover:bg-apex-green/20 transition-colors whitespace-nowrap"
                              {...buttonHoverProps}
                            >
                              <Share2 size={16} />
                              Share
                            </motion.button>
                            {ride.route_path && ride.route_path.coordinates && ride.route_path.coordinates.length > 0 && (
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportGPX(ride);
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-apex-green/10 border border-apex-green/30 rounded-lg text-apex-green text-sm hover:bg-apex-green/20 transition-colors whitespace-nowrap"
                                {...buttonHoverProps}
                              >
                                <Download size={16} />
                                GPX
                              </motion.button>
                            )}
                            <motion.button
                              onClick={async (e) => {
                                e.stopPropagation();
                                // Ensure we have the latest ride data before opening edit modal
                                // Find the ride from the current rides array (which should be updated after query invalidation)
                                const currentRide =
                                  rides.find((r) => r.id === ride.id) || ride;
                                handleEditClick(currentRide);
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-apex-white/10 border border-apex-white/20 rounded-lg text-apex-white text-sm hover:bg-apex-white/20 transition-colors whitespace-nowrap"
                              {...buttonHoverProps}
                            >
                              <Edit2 size={16} />
                              Edit
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(ride);
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-apex-red/20 border border-apex-red/30 rounded-lg text-apex-red text-sm hover:bg-apex-red/30 transition-colors whitespace-nowrap"
                              {...buttonHoverProps}
                            >
                              <Trash2 size={16} />
                              Delete
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <motion.div
            className="flex items-center justify-center gap-4 pt-4"
            variants={itemVariants}
          >
            <motion.button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
              className="px-4 py-2 bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg text-apex-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-apex-white/10 transition-colors"
              {...(page === 0 ? {} : buttonHoverProps)}
            >
              Previous
            </motion.button>
            <span className="text-sm text-white/60 font-mono">
              Page {page + 1} of {totalPages}
            </span>
            <motion.button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg text-apex-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-apex-white/10 transition-colors"
              {...(page >= totalPages - 1 ? {} : buttonHoverProps)}
            >
              Next
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingRide && (
          <>
            <motion.div
              className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm z-[1000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingRide(null);
                setEditRideName("");
                setEditRideNotes("");
                setEditRideImageUrl("");
              }}
            />
            <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
              <motion.div
                className="bg-apex-black border border-apex-white/20 rounded-lg p-6 w-full max-w-md relative z-[1001]"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-apex-white">
                    Edit Ride
                  </h2>
                  <motion.button
                    onClick={() => {
                      setEditingRide(null);
                      setEditRideName("");
                      setEditRideNotes("");
                      setEditRideImageUrl("");
                    }}
                    className="p-2 text-apex-white/60 hover:text-apex-white transition-colors"
                    {...buttonHoverProps}
                  >
                    <X size={20} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-apex-white/60 mb-2">
                      Ride Name
                    </label>
                    <input
                      type="text"
                      value={editRideName}
                      onChange={(e) => setEditRideName(e.target.value)}
                      placeholder="Enter ride name (optional)"
                      className="w-full px-4 py-2 bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg text-apex-white placeholder:text-apex-white/40 focus:outline-none focus:border-apex-green/40 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-apex-white/60 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={editRideNotes}
                      onChange={(e) => setEditRideNotes(e.target.value)}
                      placeholder="Add notes about this ride (optional)"
                      rows={4}
                      className="w-full px-4 py-2 bg-zinc-900 border border-white/5 rounded-lg text-apex-white placeholder:text-white/40 focus:outline-none focus:border-apex-green/40 transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-apex-white/60 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={editRideImageUrl}
                      onChange={(e) => setEditRideImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2 bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg text-apex-white placeholder:text-apex-white/40 focus:outline-none focus:border-apex-green/40 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <motion.button
                    onClick={() => {
                      setEditingRide(null);
                      setEditRideName("");
                      setEditRideNotes("");
                      setEditRideImageUrl("");
                    }}
                    className="px-4 py-2 text-apex-white/60 hover:text-apex-white transition-colors"
                    {...buttonHoverProps}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleSaveEdit}
                    disabled={updateRide.isPending}
                    className="px-4 py-2 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    {...(updateRide.isPending ? {} : buttonHoverProps)}
                  >
                    {updateRide.isPending ? "Saving..." : "Save"}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {rideToDelete && (
        <ConfirmModal
          isOpen={!!rideToDelete}
          onClose={() => setRideToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Ride"
          message={`Are you sure you want to delete this ride? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          isLoading={deleteRide.isPending}
        />
      )}

      {/* Share Modal */}
      {rideToShare && (
        <ShareModal
          isOpen={!!rideToShare}
          onClose={() => setRideToShare(null)}
          ride={rideToShare}
          bike={bikeMap.get(rideToShare.bike_id)}
        />
      )}
    </div>
  );
}

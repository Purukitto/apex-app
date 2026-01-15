import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useBikes } from '../hooks/useBikes';
import { useRides } from '../hooks/useRides';
import { supabase } from '../lib/supabaseClient';
import { shareRideImage } from '../lib/shareRide';
import { apexToast } from '../lib/toast';
import {
  MapPin,
  Timer,
  TrendingUp,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  containerVariants,
  itemVariants,
  fastItemVariants,
  buttonHoverProps,
} from '../lib/animations';
import ConfirmModal from '../components/ConfirmModal';
import RideMap from '../components/RideMap';
import LoadingSpinner from '../components/LoadingSpinner';
import DebugPanel from '../components/DebugPanel';
import { useThemeColors } from '../hooks/useThemeColors';
import type { Ride } from '../types/database';

const PAGE_SIZE = 20;

export default function AllRides() {
  const { primary } = useThemeColors();
  const { bikes } = useBikes();
  const [searchParams, setSearchParams] = useSearchParams();
  const rideIdFromUrl = searchParams.get('rideId');
  const [page, setPage] = useState(0);
  const [expandedRideId, setExpandedRideId] = useState<string | null>(null);
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);
  const [editRideName, setEditRideName] = useState('');
  const [editRideNotes, setEditRideNotes] = useState('');
  const [isFindingRide, setIsFindingRide] = useState(false);

  const {
    rides,
    total,
    isLoading,
    updateRide,
    deleteRide,
  } = useRides({
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
        const element = document.querySelector(`[data-ride-id="${rideIdFromUrl}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
          .from('rides')
          .select('start_time')
          .eq('id', rideIdFromUrl)
          .eq('user_id', user.id)
          .single();

        if (error || !ride) {
          console.error('Error finding ride:', error);
          setIsFindingRide(false);
          setSearchParams({}, { replace: true });
          return;
        }

        // Count how many rides come before this one (ordered by start_time DESC)
        const { count } = await supabase
          .from('rides')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gt('start_time', ride.start_time);

        if (count !== null) {
          // Calculate which page this ride is on
          const targetPage = Math.floor(count / PAGE_SIZE);
          setPage(targetPage);
          // The expansion will happen when the ride loads on the new page
        }
      } catch (error) {
        console.error('Error finding ride page:', error);
        setIsFindingRide(false);
        setSearchParams({}, { replace: true });
      } finally {
        // Don't set isFindingRide to false here - let it stay true until the ride is found
        // It will be reset when the ride is found and expanded
      }
    };

    findRidePage();
  }, [rideIdFromUrl, rides, isLoading, isFindingRide, expandedRideId, setSearchParams]);

  // Expand the ride once it's loaded on the correct page (after page change)
  useEffect(() => {
    if (rideIdFromUrl && !isLoading && rides.length > 0 && expandedRideId !== rideIdFromUrl) {
      const rideInCurrentPage = rides.find((r) => r.id === rideIdFromUrl);
      if (rideInCurrentPage) {
        setExpandedRideId(rideIdFromUrl);
        setIsFindingRide(false); // Reset finding state
        setSearchParams({}, { replace: true });
        // Scroll to the ride
        setTimeout(() => {
          const element = document.querySelector(`[data-ride-id="${rideIdFromUrl}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [rideIdFromUrl, rides, isLoading, expandedRideId, setSearchParams]);

  // Create a map of bike IDs to bike objects for quick lookup
  const bikeMap = new Map(bikes.map((bike) => [bike.id, bike]));

  // Format duration from start_time and end_time
  const formatDuration = (startTime: string, endTime?: string): string => {
    if (!endTime) return 'In progress';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format full date and time
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleToggleExpand = (rideId: string) => {
    setExpandedRideId(expandedRideId === rideId ? null : rideId);
  };

  const handleEditClick = (ride: Ride) => {
    setEditingRide(ride);
    setEditRideName(ride.ride_name || '');
    setEditRideNotes(ride.notes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingRide) return;

    try {
      await updateRide.mutateAsync({
        id: editingRide.id,
        updates: {
          ride_name: editRideName.trim() || undefined,
          notes: editRideNotes.trim() || undefined,
        },
      });
      setEditingRide(null);
      setEditRideName('');
      setEditRideNotes('');
    } catch (error) {
      console.error('Error updating ride:', error);
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
      console.error('Error deleting ride:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setExpandedRideId(null);
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareClick = async (ride: Ride) => {
    const bike = bikeMap.get(ride.bike_id);
    
    try {
      if (Capacitor.isNativePlatform()) {
        // Native: Use promise toast for share
        apexToast.promise(
          shareRideImage(ride, bike),
          {
            loading: 'Generating share image...',
            success: 'Ride shared',
            error: 'Failed to share ride',
          }
        );
      } else {
        // Web: Show loading, then appropriate success message based on method
        const sharePromise = shareRideImage(ride, bike).then((method) => {
          // Return success message based on method
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
    } catch (error) {
      console.error('Error sharing ride:', error);
      apexToast.error('Failed to share ride');
    }
  };

  if (isLoading && rides.length === 0) {
    return <LoadingSpinner fullScreen text="Loading rides..." />;
  }

  return (
    <div className="h-full bg-zinc-950 flex flex-col">
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
              {total} {total === 1 ? 'ride' : 'rides'} total
            </p>
          )}
        </motion.div>

        {/* Rides List */}
        {rides.length === 0 ? (
          <motion.div
            className="bg-zinc-900 border border-white/5 rounded-apex p-8 text-center"
            variants={itemVariants}
          >
            <Timer className="mx-auto mb-3 text-white/20" size={32} />
            <p className="text-sm text-white/40">
              No rides recorded yet. Start tracking your rides to see them here.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3"
            variants={containerVariants}
          >
            {rides.map((ride) => {
              const bike = bikeMap.get(ride.bike_id);
              const bikeName =
                bike?.nick_name || bike
                  ? `${bike.make} ${bike.model}`
                  : 'Unknown Bike';
              const maxLean = Math.max(ride.max_lean_left, ride.max_lean_right);
              const isExpanded = expandedRideId === ride.id;

              return (
                <motion.div
                  key={ride.id}
                  data-ride-id={ride.id}
                  className="bg-zinc-900 border border-white/5 rounded-apex overflow-hidden"
                  variants={fastItemVariants}
                  layout
                >
                  {/* Card Header - Always Visible */}
                  <motion.div
                    className="p-5 cursor-pointer"
                    onClick={() => handleToggleExpand(ride.id)}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
                    whileTap={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
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
                        {formatDate(ride.start_time)}
                      </span>
                    </div>
                  </motion.div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0 border-t border-white/5 space-y-4">
                          {/* Additional Ride Details */}
                          <div className="grid grid-cols-2 gap-4 pt-4">
                            <div>
                              <p className="text-xs text-white/60 mb-1">Start Time</p>
                              <p className="text-sm text-white/80 font-mono">
                                {formatDateTime(ride.start_time)}
                              </p>
                            </div>
                            {ride.end_time && (
                              <div>
                                <p className="text-xs text-white/60 mb-1">End Time</p>
                                <p className="text-sm text-white/80 font-mono">
                                  {formatDateTime(ride.end_time)}
                                </p>
                              </div>
                            )}
                          </div>

                          {ride.notes && (
                            <div>
                              <p className="text-xs text-white/60 mb-1">Notes</p>
                              <p className="text-sm text-white/80 whitespace-pre-wrap">
                                {ride.notes}
                              </p>
                            </div>
                          )}

                          {/* Route Map */}
                          {ride.route_path && (
                            <div>
                              <p className="text-xs text-white/60 mb-2">Route</p>
                              <DebugPanel title="route_path" data={ride.route_path} />
                              {ride.route_path.coordinates && 
                               Array.isArray(ride.route_path.coordinates) && 
                               ride.route_path.coordinates.length > 0 ? (
                                <RideMap
                                  coordinates={ride.route_path.coordinates.map(
                                    ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
                                  )}
                                  className="w-full"
                                />
                              ) : (
                                <div className="p-4 bg-apex-black/30 border border-apex-white/10 rounded-lg text-center">
                                  <p className="text-xs text-apex-white/60 font-mono">
                                    Route data format not recognized
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareClick(ride);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-apex-green/10 border border-apex-green/30 rounded-lg text-apex-green text-sm hover:bg-apex-green/20 transition-colors"
                              {...buttonHoverProps}
                            >
                              <Share2 size={16} />
                              Share
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(ride);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 border border-white/5 rounded-lg text-white text-sm hover:bg-zinc-700 transition-colors"
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
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm hover:bg-red-500/30 transition-colors"
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
                </motion.div>
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
              className="px-4 py-2 bg-zinc-900 border border-white/5 rounded-lg text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
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
              className="px-4 py-2 bg-zinc-900 border border-white/5 rounded-lg text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
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
                setEditRideName('');
                setEditRideNotes('');
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
                  <h2 className="text-xl font-bold text-apex-white">Edit Ride</h2>
                  <motion.button
                    onClick={() => {
                      setEditingRide(null);
                      setEditRideName('');
                      setEditRideNotes('');
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
                      className="w-full px-4 py-2 bg-zinc-900 border border-white/5 rounded-lg text-apex-white placeholder:text-white/40 focus:outline-none focus:border-apex-green/40 transition-colors"
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
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <motion.button
                    onClick={() => {
                      setEditingRide(null);
                      setEditRideName('');
                      setEditRideNotes('');
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
                    {updateRide.isPending ? 'Saving...' : 'Save'}
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
    </div>
  );
}

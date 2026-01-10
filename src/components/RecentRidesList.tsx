import { useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, MapPin, TrendingUp, RefreshCw, ChartNoAxesGantt } from 'lucide-react';
import { useBikes } from '../hooks/useBikes';
import { useRides } from '../hooks/useRides';
import { useQueryClient } from '@tanstack/react-query';
import { containerVariants, fastItemVariants, buttonHoverProps } from '../lib/animations';
import { apexToast } from '../lib/toast';

interface RecentRidesListProps {
  limit?: number;
  bikeId?: string;
  showHeader?: boolean; // If true, show title and refresh button in header
}

/**
 * Component to display recent rides with bike information
 */
export default function RecentRidesList({ limit = 10, bikeId, showHeader = false }: RecentRidesListProps) {
  const { rides, isLoading, refetch, isFetching } = useRides({ bikeId, limit });
  const { bikes } = useBikes();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['rides'] });
      await refetch();
      apexToast.success('Rides synced');
    } catch (error) {
      console.error('Error syncing rides:', error);
      apexToast.error('Failed to sync rides');
    } finally {
      setIsSyncing(false);
    }
  };

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Show loading state only on initial load, not during refetch
  if (isLoading && !rides) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border border-apex-white/10 rounded-lg p-4 bg-apex-black/50 relative overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <div className="flex items-center justify-between relative">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-apex-white/10 rounded w-32" />
                <div className="h-3 bg-apex-white/5 rounded w-24" />
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 bg-apex-white/10 rounded w-20 ml-auto" />
                <div className="h-3 bg-apex-white/5 rounded w-16 ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!rides || rides.length === 0) {
    return (
      <div className="mt-4 text-center py-8">
        <Timer className="mx-auto mb-3 text-apex-white/20" size={32} />
        <p className="text-sm text-apex-white/40 mb-4">
          No rides recorded yet. Start tracking your rides to see them here.
        </p>
        <motion.button
          onClick={handleSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-apex-green/10 border border-apex-green/40 rounded-lg text-apex-green hover:bg-apex-green/20 disabled:opacity-50 disabled:cursor-not-allowed"
          {...buttonHoverProps}
        >
          <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          <span className="text-sm font-medium">{isSyncing ? 'Syncing...' : 'Sync'}</span>
        </motion.button>
      </div>
    );
  }

  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-apex-green/10 rounded-lg">
              <ChartNoAxesGantt size={20} className="text-apex-green" />
            </div>
            <h2 className="text-lg font-semibold text-apex-white">Recent Rides</h2>
          </div>
          <motion.button
            onClick={handleSync}
            disabled={isSyncing || isFetching}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-apex-green/10 border border-apex-green/40 rounded-lg text-apex-green hover:bg-apex-green/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm shrink-0"
            {...buttonHoverProps}
          >
            <RefreshCw size={14} className={(isSyncing || isFetching) ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      )}
      {!showHeader && (
        <div className="flex items-center justify-end mb-3">
          <motion.button
            onClick={handleSync}
            disabled={isSyncing || isFetching}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-apex-green/10 border border-apex-green/40 rounded-lg text-apex-green hover:bg-apex-green/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            {...buttonHoverProps}
          >
            <RefreshCw size={14} className={(isSyncing || isFetching) ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      )}
      {/* Show subtle loading indicator during refetch without hiding content */}
      {isFetching && rides && rides.length > 0 && (
        <div className="mb-2 text-xs text-apex-green/60 text-center">
          Updating...
        </div>
      )}
      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={rides?.length || 0} // Force re-animation when rides change
      >
        {rides.map((ride) => {
        const bike = bikeMap.get(ride.bike_id);
        const bikeName = bike?.nick_name || bike ? `${bike.make} ${bike.model}` : 'Unknown Bike';
        const maxLean = Math.max(ride.max_lean_left, ride.max_lean_right);

        return (
          <motion.div
            key={ride.id}
            className="border border-apex-white/20 rounded-lg p-4 bg-gradient-to-br from-white/5 to-transparent hover:border-apex-green/40 transition-colors group"
            variants={fastItemVariants}
            whileHover={{ borderColor: 'rgba(0, 255, 65, 0.4)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-apex-white font-semibold truncate">{bikeName}</h3>
                  <span className="text-xs text-apex-white/40 font-mono">
                    {formatDate(ride.start_time)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-apex-white/60">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-apex-green/60" />
                    <span className="font-mono">{ride.distance_km.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Timer size={14} className="text-apex-green/60" />
                    <span>{formatDuration(ride.start_time, ride.end_time)}</span>
                  </div>
                  {maxLean > 0 && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-apex-green/60" />
                      <span className="font-mono">{maxLean.toFixed(1)}°</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
      </motion.div>
    </div>
  );
}

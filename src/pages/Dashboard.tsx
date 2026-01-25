import { useCallback } from 'react';
import { useBikes } from '../hooks/useBikes';
import { useUserProfile } from '../hooks/useUserProfile';
import { useRides } from '../hooks/useRides';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  buttonHoverProps,
  containerVariants,
  listContainerVariants,
} from '../lib/animations';
import { useThemeColors } from '../hooks/useThemeColors';
import LoadingSpinner from '../components/LoadingSpinner';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import { useQueryClient } from '@tanstack/react-query';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { formatDuration, formatShortDate } from '../utils/format';
import { BentoCard } from '../components/ui/BentoCard';
import RideMap from '../components/RideMap';

export default function Dashboard() {
  const { bikes, isLoading } = useBikes();
  const { profile } = useUserProfile();
  const { rides, isLoading: ridesLoading, refetch: refetchRides } = useRides({
    limit: 5,
    includeRoute: true,
  });
  const navigate = useNavigate();
  const { primary } = useThemeColors();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchRides(),
      queryClient.invalidateQueries({ queryKey: ['bikes'] }),
      queryClient.invalidateQueries({ queryKey: ['userProfile'] }),
    ]);
  }, [refetchRides, queryClient]);

  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
    logLabel: 'dashboard',
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  // Calculate total distance across all bikes
  const totalKm = bikes.reduce((sum, bike) => sum + bike.current_odo, 0);
  const bikeCount = bikes.length;
  const totalRides = rides?.length || 0;

  const formatRideDate = (dateString: string): string =>
    formatShortDate(dateString, { includeYear: false, useRelative: true });

  const lastRide = rides?.[0];
  const lastRideBike = lastRide ? bikes.find((bike) => bike.id === lastRide.bike_id) : undefined;
  const lastRideBikeLabel = lastRideBike
    ? lastRideBike.nick_name || `${lastRideBike.make} ${lastRideBike.model}`
    : 'Unknown bike';
  const lastRideDuration = lastRide
    ? formatDuration(lastRide.start_time, lastRide.end_time)
    : '--';
  const lastRideMaxLean = lastRide
    ? Math.max(lastRide.max_lean_left, lastRide.max_lean_right)
    : 0;
  const lastRideCoordinates =
    lastRide?.route_path?.coordinates &&
    Array.isArray(lastRide.route_path.coordinates) &&
    lastRide.route_path.coordinates.length > 0
      ? lastRide.route_path.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number])
      : [];

  const riderName = profile?.riderName || 'Rider';

  return (
    <div className="h-full flex flex-col">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        accentColor={primary}
      />

      {/* Scrollable Content */}
      <motion.div
        className="p-6 pb-32 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="grid grid-cols-12 gap-4"
          variants={listContainerVariants}
        >
          <BentoCard
            padding="md"
            animate="fastItem"
            className="col-span-12 lg:col-span-8"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="text-sm text-apex-white/60">Welcome back</p>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-apex-green">
                    {riderName}!
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-sm text-apex-white/60">Total distance (km)</p>
                  <p className="text-3xl md:text-4xl font-mono font-bold text-apex-white tabular-nums">
                    {totalKm.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  type="button"
                  onClick={() => navigate('/garage')}
                  className="rounded-2xl bg-apex-black/40 border border-apex-white/5 p-4 text-left transition-colors hover:bg-apex-black/60"
                  {...buttonHoverProps}
                >
                  <p className="text-sm text-apex-white/60">Bikes</p>
                  <p className="text-2xl font-mono font-bold text-apex-white tabular-nums">
                    {bikeCount}
                  </p>
                  <p className="text-sm text-apex-white/60">
                    {bikeCount === 1 ? 'machine' : 'machines'}
                  </p>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => navigate('/rides')}
                  className="rounded-2xl bg-apex-black/40 border border-apex-white/5 p-4 text-left transition-colors hover:bg-apex-black/60"
                  {...buttonHoverProps}
                >
                  <p className="text-sm text-apex-white/60">Total rides</p>
                  <p className="text-2xl font-mono font-bold text-apex-white tabular-nums">
                    {totalRides}
                  </p>
                  <p className="text-sm text-apex-white/60">
                    {totalRides === 1 ? 'ride' : 'rides'}
                  </p>
                </motion.button>
              </div>
            </div>
          </BentoCard>
          <BentoCard
            padding="md"
            animate="fastItem"
            className="col-span-12 lg:col-span-5"
            clickable
            onClick={() => {
              if (lastRide) {
                navigate(`/rides?rideId=${lastRide.id}`);
              }
            }}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-apex-white/60">Last ride</p>
                  <h3 className="text-lg font-semibold tracking-tight text-apex-green">
                    {lastRide ? lastRide.ride_name || formatRideDate(lastRide.start_time) : 'No rides yet'}
                  </h3>
                  {lastRide && (
                    <p className="text-sm text-apex-white/60">
                      {lastRideBikeLabel}
                    </p>
                  )}
                </div>
                {lastRide && (
                  <span className="text-sm font-mono text-apex-white/60 tabular-nums">
                    {lastRide.distance_km.toFixed(1)} km
                  </span>
                )}
              </div>
              {lastRide && (
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-apex-white/70">
                  <span className="font-mono tabular-nums">{lastRideDuration}</span>
                  {lastRideMaxLean > 0 && (
                    <span className="font-mono tabular-nums">{lastRideMaxLean.toFixed(1)}°</span>
                  )}
                  <span className="text-apex-white/60">{formatRideDate(lastRide.start_time)}</span>
                </div>
              )}
              <div className="mt-4 flex-1">
                {ridesLoading ? (
                  <div className="h-[220px] rounded-2xl border border-apex-white/5 bg-apex-black/40 flex items-center justify-center">
                    <LoadingSpinner size="sm" text="Loading map..." />
                  </div>
                ) : lastRideCoordinates.length > 0 ? (
                  <RideMap
                    coordinates={lastRideCoordinates}
                    className="w-full"
                    interactive={false}
                    height="220px"
                  />
                ) : (
                  <div className="h-[220px] rounded-2xl border border-apex-white/5 bg-apex-black/40 flex items-center justify-center">
                    <p className="text-sm text-apex-white/60 font-mono">
                      No route data available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </BentoCard>
        </motion.div>
      </motion.div>
    </div>
  );
}

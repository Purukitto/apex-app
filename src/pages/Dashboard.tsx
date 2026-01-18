import { useCallback } from 'react';
import { useBikes } from '../hooks/useBikes';
import { useUserProfile } from '../hooks/useUserProfile';
import { useRides } from '../hooks/useRides';
import { useNavigate } from 'react-router-dom';
import { User, Bell, MapPin, Timer, TrendingUp, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants, fastItemVariants, buttonHoverProps } from '../lib/animations';
import { useNotificationHandler } from '../components/layout/NotificationContext';
import { useThemeColors } from '../hooks/useThemeColors';
import LoadingSpinner from '../components/LoadingSpinner';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import { useQueryClient } from '@tanstack/react-query';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { formatDuration, formatShortDate } from '../utils/format';

export default function Dashboard() {
  const { bikes, isLoading } = useBikes();
  const { profile } = useUserProfile();
  const { rides, isLoading: ridesLoading, refetch: refetchRides } = useRides({ limit: 5 });
  const navigate = useNavigate();
  const { openNotifications, unreadCount } = useNotificationHandler();
  const { primary, highlight } = useThemeColors();
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

  // Create a map of bike IDs to bike objects for quick lookup
  const bikeMap = new Map(bikes.map((bike) => [bike.id, bike]));

  const riderName = profile?.riderName || 'Rider';

  return (
    <div className="h-full flex flex-col">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        accentColor={primary}
      />

      {/* Dashboard-specific Greeting Section */}
      <div className="p-6 pb-0">
        <motion.div
          className="flex items-center justify-between"
          variants={itemVariants}
        >
          <div className="flex flex-col">
            <span className="text-sm md:text-base text-white/60 font-normal">
              Hi,
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {riderName}!
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Profile Button */}
            <motion.button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-white/60 hover:border-white/40 transition-colors"
              {...buttonHoverProps}
            >
              <User size={20} />
            </motion.button>
            {/* Notifications Button */}
            <motion.button
              onClick={openNotifications}
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
              style={{ backgroundColor: primary }}
              {...buttonHoverProps}
            >
              <Bell size={20} className="text-apex-black" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-apex-black text-apex-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center border-2 border-apex-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Scrollable Content */}
      <motion.div
        className="p-6 pb-32 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        {/* Top Grid: Hero Card + Stat Tiles */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
          variants={containerVariants}
        >
          {/* Hero Card - Distance (Non-clickable) */}
          <motion.div
            className="col-span-2 md:col-span-2 bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-apex p-6"
            variants={itemVariants}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-sm text-white/60 uppercase tracking-wide mb-2">
                  Distance
                </h2>
                <p className="text-5xl font-mono font-bold text-white mb-2">
                  {totalKm.toLocaleString()}
                </p>
                <p className="text-sm font-mono" style={{ color: primary }}>km</p>
              </div>
            </div>
          </motion.div>

          {/* Stat Tiles - Bento Grid */}
          <motion.div
            className="col-span-2 md:col-span-1 grid grid-cols-2 gap-4 md:flex md:flex-col md:space-y-4"
            variants={containerVariants}
          >
            {/* Bikes in Garage Tile (Clickable) */}
            <motion.div
              className="bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-apex p-5 cursor-pointer transition-all"
              variants={itemVariants}
              onClick={() => navigate('/garage')}
              whileHover={{ borderColor: highlight, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className="text-xs text-white/60 uppercase tracking-wide mb-2">
                Bikes in Garage
              </h3>
              <p className="text-3xl md:text-4xl font-mono font-bold text-white">
                {bikeCount}
              </p>
              <p className="text-xs md:text-sm mt-1" style={{ color: primary }}>
                {bikeCount === 1 ? 'machine' : 'machines'}
              </p>
            </motion.div>

            {/* Total Rides Tile (Clickable) */}
            <motion.div
              className="bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-apex p-5 cursor-pointer transition-all"
              variants={itemVariants}
              onClick={() => navigate('/rides')}
              whileHover={{ borderColor: highlight, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className="text-xs text-white/60 uppercase tracking-wide mb-2">
                Total Rides
              </h3>
              <p className="text-3xl md:text-4xl font-mono font-bold text-white">
                {totalRides}
              </p>
              <p className="text-xs md:text-sm mt-1" style={{ color: primary }}>
                {totalRides === 1 ? 'ride' : 'rides'}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Recent Rides Section */}
        <motion.div
          className="space-y-4"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold text-white">Recent Rides</h2>
          {ridesLoading ? (
            <div className="bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-apex p-8 text-center">
              <div className="animate-spin mx-auto mb-3">
                <RefreshCw size={32} className="text-white/20" />
              </div>
              <LoadingSpinner size="sm" text="Loading rides..." />
            </div>
          ) : rides && rides.length > 0 ? (
            <motion.div
              className="space-y-3"
              variants={containerVariants}
            >
              {rides.map((ride) => {
                const bike = bikeMap.get(ride.bike_id);
                const bikeName = bike?.nick_name || bike ? `${bike.make} ${bike.model}` : 'Unknown Bike';
                const maxLean = Math.max(ride.max_lean_left, ride.max_lean_right);

                return (
                  <motion.div
                    key={ride.id}
                    className="bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-apex overflow-hidden"
                    variants={fastItemVariants}
                    layout
                  >
                    {/* Card Header - Same as AllRides but navigates on click */}
                    <motion.div
                      className="p-5 cursor-pointer"
                      onClick={() => navigate(`/rides?rideId=${ride.id}`)}
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
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-apex p-8 text-center">
              <Timer className="mx-auto mb-3 text-white/20" size={32} />
              <p className="text-sm text-white/40">
                No rides recorded yet. Start tracking your rides to see them here.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { useBikes } from '../hooks/useBikes';
import { useMaintenanceChecker } from '../hooks/useMaintenanceChecker';
import { useUserProfile } from '../hooks/useUserProfile';
import { useRides } from '../hooks/useRides';
import { useNavigate } from 'react-router-dom';
import { User, Bell, MapPin, Timer, TrendingUp, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants, fastItemVariants, buttonHoverProps } from '../lib/animations';
import { useNotificationHandler } from '../components/layout/NotificationContext';
import { useThemeColors } from '../hooks/useThemeColors';
import LoadingSpinner from '../components/LoadingSpinner';
import { useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';

export default function Dashboard() {
  const { bikes, isLoading } = useBikes();
  const { profile } = useUserProfile();
  const { rides, isLoading: ridesLoading, refetch: refetchRides } = useRides({ limit: 5 });
  const navigate = useNavigate();
  const { openNotifications, unreadCount } = useNotificationHandler();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { primary, highlight } = useThemeColors();
  const queryClient = useQueryClient();
  const touchStartY = useRef(0);
  const isPullingRef = useRef(false);
  const currentPullDistanceRef = useRef(0);
  
  // Run maintenance checker on Dashboard load
  useMaintenanceChecker();

  // Pull-to-refresh handler - refreshes all data
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Refresh all dashboard data
      await Promise.all([
        refetchRides(),
        queryClient.invalidateQueries({ queryKey: ['bikes'] }),
        queryClient.invalidateQueries({ queryKey: ['userProfile'] }),
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      // Silent failure for pull-to-refresh
    } finally {
      // Small delay to show the refresh animation
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        currentPullDistanceRef.current = 0;
      }, 300);
    }
  }, [refetchRides, queryClient, isRefreshing]);

  // Pull-to-refresh touch handlers - app-only (native platforms)
  useEffect(() => {
    // Only enable pull-to-refresh on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Find the main scroll container (from MainLayout)
    const mainContainer = document.querySelector('main');
    if (!mainContainer) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh when at the top of the scroll container
      if (mainContainer.scrollTop === 0 && !isRefreshing) {
        touchStartY.current = e.touches[0].clientY;
        isPullingRef.current = true;
        currentPullDistanceRef.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - touchStartY.current);
      currentPullDistanceRef.current = distance;
      
      // Only allow pull if we're still at the top
      if (mainContainer.scrollTop === 0 && distance > 0) {
        // Prevent default scrolling while pulling
        if (distance > 10) {
          e.preventDefault();
        }
        setPullDistance(Math.min(distance, 120)); // Cap at 120px
      } else {
        // Reset if user scrolled down
        isPullingRef.current = false;
        setPullDistance(0);
        currentPullDistanceRef.current = 0;
      }
    };

    const handleTouchEnd = () => {
      const finalDistance = currentPullDistanceRef.current;
      if (isPullingRef.current && finalDistance >= 80 && !isRefreshing) {
        handleRefresh();
      }
      isPullingRef.current = false;
      setPullDistance(0);
      currentPullDistanceRef.current = 0;
    };

    mainContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    mainContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    mainContainer.addEventListener('touchend', handleTouchEnd);

    return () => {
      mainContainer.removeEventListener('touchstart', handleTouchStart);
      mainContainer.removeEventListener('touchmove', handleTouchMove);
      mainContainer.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, handleRefresh]);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  // Calculate total distance across all bikes
  const totalKm = bikes.reduce((sum, bike) => sum + bike.current_odo, 0);
  const bikeCount = bikes.length;
  const totalRides = rides?.length || 0;

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

  // Create a map of bike IDs to bike objects for quick lookup
  const bikeMap = new Map(bikes.map((bike) => [bike.id, bike]));

  const riderName = profile?.riderName || 'Rider';

  return (
    <div className="h-full bg-apex-black flex flex-col">
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 bg-apex-black flex items-center justify-center pb-2"
          style={{
            paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))`,
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: isRefreshing ? 1 : Math.min(pullDistance / 80, 1),
            y: isRefreshing ? 0 : Math.min(pullDistance * 0.5, 60),
          }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-full px-4 py-2 flex items-center gap-2">
            <RefreshCw
              size={16}
              className={`transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
              style={{
                transform: isRefreshing ? 'none' : `rotate(${pullDistance * 4}deg)`,
                color: pullDistance >= 80 || isRefreshing ? primary : 'currentColor',
              }}
            />
            <span className="text-xs text-apex-white">
              {isRefreshing 
                ? 'Refreshing...' 
                : pullDistance >= 80 
                  ? 'Release to refresh' 
                  : 'Pull to refresh'}
            </span>
          </div>
        </motion.div>
      )}

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
              <Bell size={20} className="text-zinc-950" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-950 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center border-2 border-white">
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
            className="col-span-2 md:col-span-2 bg-zinc-900 border border-white/5 rounded-apex p-6"
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
              className="bg-zinc-900 border border-white/5 rounded-apex p-5 cursor-pointer transition-all"
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
              className="bg-zinc-900 border border-white/5 rounded-apex p-5 cursor-pointer transition-all"
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
            <div className="bg-zinc-900 border border-white/5 rounded-apex p-8 text-center">
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
                    className="bg-zinc-900 border border-white/5 rounded-apex overflow-hidden"
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
                          {formatDate(ride.start_time)}
                        </span>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="bg-zinc-900 border border-white/5 rounded-apex p-8 text-center">
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

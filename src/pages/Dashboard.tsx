import { useBikes } from '../hooks/useBikes';
import { useMaintenanceChecker } from '../hooks/useMaintenanceChecker';
import { useNotificationStore } from '../stores/useNotificationStore';
import { Bike, Activity, AlertTriangle, Calendar, Bell } from 'lucide-react';
import { useState } from 'react';
import NotificationPane from '../components/layout/NotificationPane';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants, buttonHoverProps } from '../lib/animations';

const SERVICE_INTERVAL_KM = 5000;

export default function Dashboard() {
  const { bikes, isLoading } = useBikes();
  const { getUnreadCount } = useNotificationStore();
  const [notificationPaneOpen, setNotificationPaneOpen] = useState(false);
  
  // Run maintenance checker on Dashboard load
  useMaintenanceChecker();

  const unreadCount = getUnreadCount();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-apex-white/60">Loading...</div>
      </div>
    );
  }

  // Calculate total miles across all bikes
  const totalMiles = bikes.reduce((sum, bike) => sum + bike.current_odo, 0);
  const bikeCount = bikes.length;

  // Check for maintenance alerts (within 500km of service interval)
  const maintenanceAlerts = bikes
    .map((bike) => {
      const nextService = Math.ceil(bike.current_odo / SERVICE_INTERVAL_KM) * SERVICE_INTERVAL_KM;
      const kmUntilService = nextService - bike.current_odo;
      return {
        bike,
        nextService,
        kmUntilService,
      };
    })
    .filter((alert) => alert.kmUntilService <= 500 && alert.kmUntilService > 0)
    .sort((a, b) => a.kmUntilService - b.kmUntilService);


  return (
    <motion.div
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Notifications */}
      <motion.div
        className="flex items-center justify-between mb-4"
        variants={itemVariants}
      >
        <h1 className="text-2xl font-bold text-apex-white">Dashboard</h1>
        <motion.button
          onClick={() => setNotificationPaneOpen(true)}
          className="relative p-2 text-apex-white/60 hover:text-apex-green transition-colors"
          aria-label="Notifications"
          {...buttonHoverProps}
        >
          <Bell size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-apex-green text-apex-black text-xs font-mono font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </motion.button>
      </motion.div>

      {/* Status Header */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={containerVariants}
      >
        {/* Odometer Widget */}
        <motion.div
          className="border border-apex-white/20 rounded-lg p-6 bg-apex-black"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-apex-green/10 rounded-lg">
              <Activity size={20} className="text-apex-green" />
            </div>
            <h2 className="text-sm text-apex-white/60 uppercase tracking-wide">
              Total Distance
            </h2>
          </div>
          <p
            className="text-3xl font-mono font-bold text-apex-green drop-shadow-[0_0_8px_rgba(0,255,65,0.3)]"
            style={{ textShadow: '0 0 8px rgba(0, 255, 65, 0.3)' }}
          >
            {totalMiles.toLocaleString()}
          </p>
          <p className="text-sm text-apex-white/40 mt-1">kilometers</p>
        </motion.div>

        <motion.div
          className="border border-apex-white/20 rounded-lg p-6 bg-apex-black"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-apex-green/10 rounded-lg">
              <Bike size={20} className="text-apex-green" />
            </div>
            <h2 className="text-sm text-apex-white/60 uppercase tracking-wide">
              Bikes in Garage
            </h2>
          </div>
          <p className="text-3xl font-mono font-bold text-apex-white">
            {bikeCount}
          </p>
          <p className="text-sm text-apex-white/40 mt-1">
            {bikeCount === 1 ? 'machine' : 'machines'}
          </p>
        </motion.div>
      </motion.div>

      {/* Maintenance Alerts */}
      {maintenanceAlerts.length > 0 && (
        <motion.div
          className="border border-apex-green/40 rounded-lg p-6 bg-apex-green/5"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-apex-green" />
            <h2 className="text-lg font-semibold text-apex-white">
              Service Due Soon
            </h2>
          </div>
          <motion.div
            className="space-y-3"
            variants={containerVariants}
          >
            {maintenanceAlerts.map((alert) => (
              <motion.div
                key={alert.bike.id}
                className="flex items-center justify-between p-3 bg-gradient-to-br from-white/5 to-transparent rounded-lg border border-apex-green/20 hover:border-apex-green/40 transition-colors"
                variants={itemVariants}
                whileHover={{ borderColor: 'rgba(0, 255, 65, 0.4)' }}
              >
                <div>
                  <p className="text-apex-white font-medium">
                    {alert.bike.nick_name || `${alert.bike.make} ${alert.bike.model}`}
                  </p>
                  <p className="text-sm text-apex-white/60">
                    Service due at {alert.nextService.toLocaleString()} km
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-apex-green font-mono font-semibold">
                    {alert.kmUntilService.toLocaleString()} km
                  </p>
                  <p className="text-xs text-apex-white/40">remaining</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Recent Rides */}
      <motion.div
        className="border border-apex-white/20 rounded-lg p-6 bg-apex-black"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-apex-green/10 rounded-lg">
              <Calendar size={20} className="text-apex-green" />
            </div>
            <h2 className="text-lg font-semibold text-apex-white">Recent Rides</h2>
          </div>
        </div>

        {/* Skeleton Loaders with Shimmer Effect */}
        {isLoading ? (
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
        ) : (
          <div className="mt-4 text-center">
            <p className="text-sm text-apex-white/40">
              No rides recorded yet. Start tracking your rides to see them here.
            </p>
          </div>
        )}
      </motion.div>

      {/* Notification Pane */}
      <NotificationPane
        isOpen={notificationPaneOpen}
        onClose={() => setNotificationPaneOpen(false)}
      />
    </motion.div>
  );
}

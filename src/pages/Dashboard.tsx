import { useBikes } from '../hooks/useBikes';
import { useMaintenanceChecker } from '../hooks/useMaintenanceChecker';
import { Motorbike, Activity, AlertTriangle } from 'lucide-react';
import RecentRidesList from '../components/RecentRidesList';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '../lib/animations';

const SERVICE_INTERVAL_KM = 5000;

export default function Dashboard() {
  const { bikes, isLoading } = useBikes();
  
  // Run maintenance checker on Dashboard load
  useMaintenanceChecker();

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
          <p className="text-3xl font-mono font-bold text-apex-green">
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
              <Motorbike size={20} className="text-apex-green" />
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
        <RecentRidesList limit={10} showHeader />
      </motion.div>
    </motion.div>
  );
}

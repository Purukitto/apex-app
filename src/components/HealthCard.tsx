import { motion } from 'framer-motion';
import { Wrench, AlertCircle } from 'lucide-react';
import type { MaintenanceSchedule, Bike } from '../types/database';
import { buttonHoverProps, fastItemVariants, getCardHoverProps } from '../lib/animations';
import { useThemeColors } from '../hooks/useThemeColors';

interface HealthCardProps {
  schedule: MaintenanceSchedule;
  bike: Bike;
  onCompleteService: () => void;
}

/**
 * Calculate health percentage based on km and time intervals
 * Health % = 100 - MAX(KmUsed/IntervalKm, TimeUsed/IntervalMonths)
 */
function calculateHealth(
  schedule: MaintenanceSchedule,
  bike: Bike
): { health: number; kmUsed: number; timeUsed: number; kmRemaining: number; timeRemaining: number } {
  const currentOdo = bike.current_odo;
  const lastServiceOdo = schedule.last_service_odo || 0;
  const lastServiceDate = schedule.last_service_date
    ? new Date(schedule.last_service_date)
    : null;

  // Calculate km used
  const kmUsed = Math.max(0, currentOdo - lastServiceOdo);
  const kmRemaining = Math.max(0, schedule.interval_km - kmUsed);

  // Calculate time used (in months)
  let timeUsed = 0;
  let timeRemaining = 0;
  if (schedule.interval_months > 0) {
    if (lastServiceDate) {
      const now = new Date();
      const monthsDiff = (now.getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
      timeUsed = Math.max(0, monthsDiff);
      timeRemaining = Math.max(0, schedule.interval_months - timeUsed);
    } else {
      // No last service date - service has never been done
      // For display purposes, show 0.0 months used (not undefined)
      timeUsed = 0;
      timeRemaining = 0; // Can't calculate remaining without a start date
    }
  }

  // Calculate health percentage
  let health = 100;
  if (schedule.interval_km > 0) {
    const kmHealth = 100 - (kmUsed / schedule.interval_km) * 100;
    health = Math.min(health, kmHealth);
  }
  if (schedule.interval_months > 0) {
    if (lastServiceDate) {
      // Service has been done before - calculate health based on time elapsed
      const timeHealth = 100 - (timeUsed / schedule.interval_months) * 100;
      health = Math.min(health, timeHealth);
    } else {
      // No service date means service has never been done - health should be 0%
      // This applies to items like Insurance that require an initial setup
      health = 0;
    }
  }

  // Clamp health between 0 and 100
  health = Math.max(0, Math.min(100, health));

  return { health, kmUsed, timeUsed, kmRemaining, timeRemaining };
}

/**
 * Get color based on health percentage
 */
function getHealthColor(health: number): string {
  if (health >= 60) return '#00FF41'; // apex-green
  if (health >= 20) return '#FFA500'; // orange/yellow
  return '#FF3B30'; // apex-red
}

export default function HealthCard({
  schedule,
  bike,
  onCompleteService,
}: HealthCardProps) {
  const { primary } = useThemeColors();
  const { health, kmUsed, timeUsed } = calculateHealth(
    schedule,
    bike
  );
  const healthColor = getHealthColor(health);
  const needsService = health < 20;

  return (
    <motion.div
      className="bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg p-4 hover:border-apex-green/40 transition-colors group"
      variants={fastItemVariants}
      {...getCardHoverProps()}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="p-1.5 rounded-lg transition-colors group-hover:opacity-80"
            style={{ backgroundColor: `${primary}1A` }}
          >
            <Wrench size={16} style={{ color: primary }} />
          </div>
          <h4 className="text-apex-white font-semibold truncate">
            {schedule.part_name}
          </h4>
        </div>
        {needsService && (
          <motion.div
            className="flex items-center gap-1 text-apex-red text-xs"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AlertCircle size={14} />
            <span className="font-semibold">Due</span>
          </motion.div>
        )}
      </div>

      {/* Health Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-apex-white/60">Health</span>
          <span
            className="text-sm font-mono font-semibold"
            style={{ color: healthColor }}
          >
            {Math.round(health)}%
          </span>
        </div>
        <div className="h-2 bg-apex-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full transition-colors"
            style={{ backgroundColor: healthColor }}
            initial={{ width: 0 }}
            animate={{ width: `${health}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Status Info */}
      <div className="space-y-1.5 text-xs text-apex-white/60 mb-3">
        {schedule.interval_km > 0 && (
          <div className="flex justify-between">
            <span>Distance</span>
            <span className="font-mono text-apex-green">
              {kmUsed.toLocaleString()} / {schedule.interval_km.toLocaleString()} km
            </span>
          </div>
        )}
        {schedule.interval_months > 0 && (
          <div className="flex justify-between">
            <span>Time</span>
            <span className="font-mono text-apex-green">
              {timeUsed.toFixed(1)} / {schedule.interval_months} months
            </span>
          </div>
        )}
        {schedule.last_service_date && (
          <div className="flex justify-between">
            <span>Last Service</span>
            <span className="font-mono">
              {new Date(schedule.last_service_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      {needsService && (
        <motion.button
          onClick={onCompleteService}
          className="w-full px-4 py-2 bg-apex-red/20 border border-apex-red/30 rounded-lg text-apex-red text-sm font-semibold hover:bg-apex-red/30 transition-colors"
          {...buttonHoverProps}
        >
          Fix Now
        </motion.button>
      )}
      {!needsService && health < 100 && (
        <motion.button
          onClick={onCompleteService}
          className="w-full px-4 py-2 bg-apex-green/10 border border-apex-green/20 rounded-lg text-apex-green text-sm font-semibold hover:bg-apex-green/20 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
          {...buttonHoverProps}
        >
          Mark Done
        </motion.button>
      )}
    </motion.div>
  );
}

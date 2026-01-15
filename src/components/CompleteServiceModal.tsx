import { useState } from 'react';
import { X, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MaintenanceSchedule, Bike } from '../types/database';
import { buttonHoverProps, itemVariants } from '../lib/animations';
import { logger } from '../lib/logger';

interface CompleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: MaintenanceSchedule;
  bike: Bike;
  onComplete: (data: {
    scheduleId: string;
    bikeId: string;
    serviceOdo: number;
    cost?: number;
    notes?: string;
  }) => Promise<void>;
}

export default function CompleteServiceModal({
  isOpen,
  onClose,
  schedule,
  bike,
  onComplete,
}: CompleteServiceModalProps) {
  const [formData, setFormData] = useState({
    serviceOdo: bike.current_odo.toString(),
    cost: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const serviceOdo = parseInt(formData.serviceOdo, 10);
      if (isNaN(serviceOdo) || serviceOdo < 0) {
        throw new Error('Please enter a valid odometer reading');
      }

      const cost = formData.cost.trim()
        ? parseFloat(formData.cost.trim())
        : undefined;

      if (cost !== undefined && (isNaN(cost) || cost < 0)) {
        throw new Error('Please enter a valid cost');
      }

      await onComplete({
        scheduleId: schedule.id,
        bikeId: bike.id,
        serviceOdo,
        cost,
        notes: formData.notes.trim() || undefined,
      });

      // Reset form
      setFormData({
        serviceOdo: bike.current_odo.toString(),
        cost: '',
        notes: '',
      });
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      logger.error('Error completing service:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative bg-apex-black border border-apex-white/20 rounded-lg p-6 w-full max-w-md z-10"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-apex-green/10 rounded-lg">
              <Wrench size={20} className="text-apex-green" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-apex-white">
                Complete Service
              </h2>
              <p className="text-sm text-apex-white/60 mt-1">
                {schedule.part_name}
              </p>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            className="p-2 text-apex-white/60 hover:text-apex-white transition-colors"
            aria-label="Close"
            {...buttonHoverProps}
          >
            <X size={24} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="serviceOdo"
              className="block text-sm font-semibold text-apex-white mb-2"
            >
              Odometer Reading at Time of Service (km)
            </label>
            <input
              id="serviceOdo"
              type="number"
              min="0"
              value={formData.serviceOdo}
              onChange={(e) =>
                setFormData({ ...formData, serviceOdo: e.target.value })
              }
              className="w-full px-4 py-2 bg-apex-white/5 border border-apex-white/20 rounded-lg text-apex-white font-mono focus:outline-none focus:border-apex-green/40 transition-colors"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-apex-white/40 mt-1">
              Current odometer: {bike.current_odo.toLocaleString()} km (pre-filled, adjust if different)
            </p>
          </div>

          <div>
            <label
              htmlFor="cost"
              className="block text-sm font-semibold text-apex-white mb-2"
            >
              Cost (Optional)
            </label>
            <input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={(e) =>
                setFormData({ ...formData, cost: e.target.value })
              }
              className="w-full px-4 py-2 bg-apex-white/5 border border-apex-white/20 rounded-lg text-apex-white font-mono focus:outline-none focus:border-apex-green/40 transition-colors"
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-apex-white mb-2"
            >
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 bg-apex-white/5 border border-apex-white/20 rounded-lg text-apex-white focus:outline-none focus:border-apex-green/40 transition-colors resize-none"
              placeholder="Add any notes about this service..."
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="p-3 bg-apex-red/10 border border-apex-red/20 rounded-lg">
              <p className="text-sm text-apex-red">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <motion.button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-apex-white/5 border border-apex-white/20 rounded-lg text-apex-white text-sm font-semibold hover:bg-apex-white/10 transition-colors"
              disabled={isSubmitting}
              {...buttonHoverProps}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              className="flex-1 px-4 py-2 bg-apex-green text-apex-black rounded-lg text-sm font-semibold hover:bg-apex-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
              {...buttonHoverProps}
            >
              {isSubmitting ? 'Saving...' : 'Complete Service'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

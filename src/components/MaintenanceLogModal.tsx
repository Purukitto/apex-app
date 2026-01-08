import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { MaintenanceLog, Bike } from '../types/database';
import { apexToast } from '../lib/toast';
import { motion } from 'framer-motion';

interface MaintenanceLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    logData: Omit<MaintenanceLog, 'id' | 'created_at'>
  ) => Promise<void>;
  editingLog?: MaintenanceLog | null;
  bike: Bike;
}

export default function MaintenanceLogModal({
  isOpen,
  onClose,
  onSubmit,
  editingLog,
  bike,
}: MaintenanceLogModalProps) {
  const [formData, setFormData] = useState({
    service_type: '',
    odo_at_service: '',
    date_performed: '',
    notes: '',
    receipt_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingLog) {
      setFormData({
        service_type: editingLog.service_type || '',
        odo_at_service: editingLog.odo_at_service.toString(),
        date_performed: editingLog.date_performed,
        notes: editingLog.notes || '',
        receipt_url: editingLog.receipt_url || '',
      });
    } else {
      // Pre-fill with current odometer for new logs
      setFormData({
        service_type: '',
        odo_at_service: bike.current_odo.toString(),
        date_performed: new Date().toISOString().split('T')[0],
        notes: '',
        receipt_url: '',
      });
    }
    setError(null);
  }, [editingLog, isOpen, bike.current_odo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const logData: Omit<MaintenanceLog, 'id' | 'created_at'> = {
        bike_id: bike.id,
        service_type: formData.service_type.trim() || undefined,
        odo_at_service: parseInt(formData.odo_at_service, 10) || 0,
        date_performed: formData.date_performed,
        notes: formData.notes.trim() || undefined,
        receipt_url: formData.receipt_url.trim() || undefined,
      };

      if (!logData.date_performed) {
        throw new Error('Date performed is required');
      }

      if (logData.odo_at_service < 0) {
        throw new Error('Odometer reading cannot be negative');
      }

      if (logData.odo_at_service > bike.current_odo) {
        throw new Error(
          'Odometer reading cannot be greater than current odometer'
        );
      }

      // Use toast.promise for add (not edit)
      if (!editingLog) {
        const promise = onSubmit(logData);
        apexToast.promise(promise, {
          loading: 'Adding maintenance log...',
          success: 'Maintenance log added',
          error: 'Failed to add maintenance log',
        });
        try {
          await promise;
          onClose();
        } catch {
          // Error handled by toast
        } finally {
          setIsSubmitting(false);
        }
      } else {
        // For editing, use regular promise handling
        await onSubmit(logData);
        apexToast.success('Maintenance log updated');
        onClose();
        setIsSubmitting(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      if (!editingLog) {
        apexToast.error(errorMessage);
      }
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-apex-black border border-apex-white/20 rounded-lg p-6 w-full max-w-md z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-apex-white">
            {editingLog ? 'Edit Maintenance Log' : 'Add Maintenance Log'}
          </h2>
          <motion.button
            onClick={onClose}
            className="text-apex-white/60 hover:text-apex-white transition-colors"
            aria-label="Close modal"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <X size={24} />
          </motion.button>
        </div>

        <div className="mb-4 p-3 bg-apex-white/5 rounded-lg border border-apex-white/10">
          <p className="text-sm text-apex-white/60 mb-1">Bike</p>
          <p className="text-apex-white font-medium">
            {bike.nick_name || `${bike.make} ${bike.model}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-apex-white/60 mb-2">
              Service Type
            </label>
            <input
              type="text"
              value={formData.service_type}
              onChange={(e) =>
                setFormData({ ...formData, service_type: e.target.value })
              }
              className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
              placeholder="e.g., Oil Change, Tire Replacement"
            />
          </div>

          <div>
            <label className="block text-sm text-apex-white/60 mb-2">
              Odometer at Service (km) *
            </label>
            <input
              type="number"
              value={formData.odo_at_service}
              onChange={(e) =>
                setFormData({ ...formData, odo_at_service: e.target.value })
              }
              required
              min="0"
              max={bike.current_odo}
              step="1"
              className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors font-mono"
            />
            <p className="text-xs text-apex-white/40 mt-1">
              Current odometer: {bike.current_odo.toLocaleString()} km
            </p>
          </div>

          <div>
            <label className="block text-sm text-apex-white/60 mb-2">
              Date Performed *
            </label>
            <input
              type="date"
              value={formData.date_performed}
              onChange={(e) =>
                setFormData({ ...formData, date_performed: e.target.value })
              }
              required
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-apex-white/60 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors resize-none"
              placeholder="Additional details about the service..."
            />
          </div>

          <div>
            <label className="block text-sm text-apex-white/60 mb-2">
              Receipt URL
            </label>
            <input
              type="url"
              value={formData.receipt_url}
              onChange={(e) =>
                setFormData({ ...formData, receipt_url: e.target.value })
              }
              className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
              placeholder="https://..."
            />
          </div>

          {error && <div className="text-apex-red text-sm">{error}</div>}

          <div className="flex gap-3 pt-4">
            <motion.button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-apex-white/20 text-apex-white rounded-lg hover:bg-apex-white/5 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            >
              {isSubmitting
                ? 'Saving...'
                : editingLog
                  ? 'Update'
                  : 'Add Log'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}


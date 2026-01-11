import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { MaintenanceLog, Bike } from '../types/database';
import { apexToast } from '../lib/toast';
import { motion } from 'framer-motion';
import { buttonHoverProps } from '../lib/animations';

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
  const [fieldErrors, setFieldErrors] = useState<{
    service_type?: string;
    odo_at_service?: string;
    date_performed?: string;
    receipt_url?: string;
  }>({});

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
    setFieldErrors({});
  }, [editingLog, isOpen, bike.current_odo]);

  // Validation function
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    // Validate service_type (required)
    if (!formData.service_type.trim()) {
      errors.service_type = 'Service type is required';
    }

    // Validate odo_at_service (required, must be a valid number >= 0 and <= current_odo)
    const odoValue = formData.odo_at_service.trim();
    if (!odoValue) {
      errors.odo_at_service = 'Odometer reading is required';
    } else {
      const odoNum = parseInt(odoValue, 10);
      if (isNaN(odoNum)) {
        errors.odo_at_service = 'Odometer reading must be a valid number';
      } else if (odoNum < 0) {
        errors.odo_at_service = 'Odometer reading cannot be negative';
      } else if (odoNum > bike.current_odo) {
        errors.odo_at_service = `Odometer reading cannot exceed current odometer (${bike.current_odo.toLocaleString()} km)`;
      }
    }

    // Validate date_performed (required)
    if (!formData.date_performed.trim()) {
      errors.date_performed = 'Date performed is required';
    }

    // Validate receipt_url (optional, but if provided must be a valid URL)
    if (formData.receipt_url.trim()) {
      try {
        new URL(formData.receipt_url.trim());
      } catch {
        errors.receipt_url = 'Please enter a valid URL';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if form is valid (for button disable state)
  const isFormValid = (): boolean => {
    if (!formData.service_type.trim()) return false;
    const odoValue = formData.odo_at_service.trim();
    if (!odoValue) return false;
    const odoNum = parseInt(odoValue, 10);
    if (isNaN(odoNum) || odoNum < 0 || odoNum > bike.current_odo) return false;
    if (!formData.date_performed.trim()) return false;
    if (formData.receipt_url.trim()) {
      try {
        new URL(formData.receipt_url.trim());
      } catch {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form before submission
    if (!validateForm()) {
      setError('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);

    try {
      const logData: Omit<MaintenanceLog, 'id' | 'created_at'> = {
        bike_id: bike.id,
        service_type: formData.service_type.trim(),
        odo_at_service: parseInt(formData.odo_at_service, 10),
        date_performed: formData.date_performed,
        notes: formData.notes.trim() || undefined,
        receipt_url: formData.receipt_url.trim() || undefined,
      };

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
            {...buttonHoverProps}
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
              Service Type *
            </label>
            <input
              type="text"
              value={formData.service_type}
              onChange={(e) => {
                setFormData({ ...formData, service_type: e.target.value });
                // Clear error when user starts typing
                if (fieldErrors.service_type) {
                  setFieldErrors({ ...fieldErrors, service_type: undefined });
                }
              }}
              onBlur={validateForm}
              required
              className={`w-full px-4 py-2 bg-apex-black border rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none transition-colors ${
                fieldErrors.service_type
                  ? 'border-apex-red focus:border-apex-red'
                  : 'border-apex-white/20 focus:border-apex-green'
              }`}
              placeholder="e.g., Oil Change, Tire Replacement"
            />
            {fieldErrors.service_type && (
              <p className="text-xs text-apex-red mt-1">
                {fieldErrors.service_type}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-apex-white/60 mb-2">
              Odometer at Service (km) *
            </label>
            <input
              type="number"
              value={formData.odo_at_service}
              onChange={(e) => {
                setFormData({ ...formData, odo_at_service: e.target.value });
                // Clear error when user starts typing
                if (fieldErrors.odo_at_service) {
                  setFieldErrors({ ...fieldErrors, odo_at_service: undefined });
                }
              }}
              onBlur={validateForm}
              required
              min="0"
              max={bike.current_odo}
              step="1"
              className={`w-full px-4 py-2 bg-apex-black border rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none transition-colors font-mono ${
                fieldErrors.odo_at_service
                  ? 'border-apex-red focus:border-apex-red'
                  : 'border-apex-white/20 focus:border-apex-green'
              }`}
            />
            {fieldErrors.odo_at_service && (
              <p className="text-xs text-apex-red mt-1">
                {fieldErrors.odo_at_service}
              </p>
            )}
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
              onChange={(e) => {
                setFormData({ ...formData, date_performed: e.target.value });
                // Clear error when user starts typing
                if (fieldErrors.date_performed) {
                  setFieldErrors({ ...fieldErrors, date_performed: undefined });
                }
              }}
              onBlur={validateForm}
              required
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 bg-apex-black border rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none transition-colors ${
                fieldErrors.date_performed
                  ? 'border-apex-red focus:border-apex-red'
                  : 'border-apex-white/20 focus:border-apex-green'
              }`}
            />
            {fieldErrors.date_performed && (
              <p className="text-xs text-apex-red mt-1">
                {fieldErrors.date_performed}
              </p>
            )}
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
              onChange={(e) => {
                setFormData({ ...formData, receipt_url: e.target.value });
                // Clear error when user starts typing
                if (fieldErrors.receipt_url) {
                  setFieldErrors({ ...fieldErrors, receipt_url: undefined });
                }
              }}
              onBlur={validateForm}
              className={`w-full px-4 py-2 bg-apex-black border rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none transition-colors ${
                fieldErrors.receipt_url
                  ? 'border-apex-red focus:border-apex-red'
                  : 'border-apex-white/20 focus:border-apex-green'
              }`}
              placeholder="https://..."
            />
            {fieldErrors.receipt_url && (
              <p className="text-xs text-apex-red mt-1">
                {fieldErrors.receipt_url}
              </p>
            )}
          </div>

          {error && <div className="text-apex-red text-sm">{error}</div>}

          <div className="flex gap-3 pt-4">
            <motion.button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-apex-white/20 text-apex-white rounded-lg hover:bg-apex-white/5 transition-colors"
              {...buttonHoverProps}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className="flex-1 px-4 py-2 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              {...(isSubmitting || !isFormValid() ? {} : buttonHoverProps)}
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


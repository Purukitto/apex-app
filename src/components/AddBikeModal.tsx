import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Bike } from '../types/database';
import { apexToast } from '../lib/toast';

interface AddBikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bikeData: Omit<Bike, 'id' | 'user_id'>) => Promise<void>;
  editingBike?: Bike | null;
}

export default function AddBikeModal({
  isOpen,
  onClose,
  onSubmit,
  editingBike,
}: AddBikeModalProps) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    nick_name: '',
    current_odo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingBike) {
      setFormData({
        make: editingBike.make,
        model: editingBike.model,
        year: editingBike.year?.toString() || '',
        nick_name: editingBike.nick_name || '',
        current_odo: editingBike.current_odo.toString(),
      });
    } else {
      setFormData({
        make: '',
        model: '',
        year: '',
        nick_name: '',
        current_odo: '',
      });
    }
    setError(null);
  }, [editingBike, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const bikeData: Omit<Bike, 'id' | 'user_id'> = {
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: formData.year ? parseInt(formData.year, 10) : undefined,
        nick_name: formData.nick_name.trim() || undefined,
        current_odo: parseFloat(formData.current_odo) || 0,
      };

      if (!bikeData.make || !bikeData.model) {
        throw new Error('Make and Model are required');
      }

      if (bikeData.current_odo < 0) {
        throw new Error('Odometer cannot be negative');
      }

      // Use toast.promise for add bike (not edit)
      if (!editingBike) {
        const promise = onSubmit(bikeData);
        apexToast.promise(promise, {
          loading: 'Adding machine to garage...',
          success: 'Bike successfully added to your fleet.',
          error: 'Failed to add bike. Check your connection.',
        });
        // Close modal on success, keep open on error
        try {
          await promise;
          onClose();
        } catch {
          // Error is already handled by toast.promise, keep modal open
        } finally {
          setIsSubmitting(false);
        }
      } else {
        // For editing, use regular promise handling
        await onSubmit(bikeData);
        apexToast.success('Bike updated successfully');
        onClose();
        setIsSubmitting(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      if (!editingBike) {
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
            {editingBike ? 'Edit Bike' : 'Add Bike'}
          </h2>
          <button
            onClick={onClose}
            className="text-apex-white/60 hover:text-apex-white transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-apex-white/60 mb-2">
              Make *
            </label>
            <input
              type="text"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              required
              className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
              placeholder="e.g., Yamaha"
            />
          </div>

          <div>
            <label className="block text-sm text-apex-white/60 mb-2">
              Model *
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
              className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
              placeholder="e.g., MT-07"
            />
          </div>

          <div>
            <label className="block text-sm text-apex-white/60 mb-2">Year</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              min="1900"
              max={new Date().getFullYear() + 1}
              className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
              placeholder="e.g., 2023"
            />
          </div>

          <div>
            <label className="block text-sm text-apex-white/60 mb-2">
              Nickname
            </label>
            <input
              type="text"
              value={formData.nick_name}
              onChange={(e) =>
                setFormData({ ...formData, nick_name: e.target.value })
              }
              className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
              placeholder="e.g., My Daily Rider"
            />
          </div>

          <div>
            <label className="block text-sm text-apex-white/60 mb-2">
              Initial Odometer (km) *
            </label>
            <input
              type="number"
              value={formData.current_odo}
              onChange={(e) =>
                setFormData({ ...formData, current_odo: e.target.value })
              }
              required
              min="0"
              step="0.1"
              className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors font-mono"
              placeholder="0"
            />
          </div>

          {error && (
            <div className="text-apex-red text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-apex-white/20 text-apex-white rounded-lg hover:bg-apex-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? 'Saving...'
                : editingBike
                  ? 'Update'
                  : 'Add Bike'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


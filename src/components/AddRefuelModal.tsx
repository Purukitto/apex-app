import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { FuelLog, Bike } from '../types/database';
import { apexToast } from '../lib/toast';
import { motion } from 'framer-motion';
import { buttonHoverProps } from '../lib/animations';

interface AddRefuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (logData: Omit<FuelLog, 'id' | 'created_at'>) => Promise<void>;
  editingLog?: FuelLog | null;
  bike: Bike;
}

export default function AddRefuelModal({
  isOpen,
  onClose,
  onSubmit,
  editingLog,
  bike,
}: AddRefuelModalProps) {
  const [formData, setFormData] = useState({
    odometer: '',
    litres: '',
    total_cost: '',
    price_per_litre: '', // Allow manual entry
    is_full_tank: false,
    date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    odometer?: string;
    litres?: string;
    total_cost?: string;
    price_per_litre?: string;
    date?: string;
  }>({});
  const [isPricePerLitreManual, setIsPricePerLitreManual] = useState(false);

  useEffect(() => {
    if (editingLog) {
      setFormData({
        odometer: editingLog.odometer.toString(),
        litres: editingLog.litres.toString(),
        total_cost: editingLog.total_cost.toString(),
        price_per_litre: editingLog.price_per_litre.toString(),
        is_full_tank: editingLog.is_full_tank,
        date: editingLog.date,
      });
      setIsPricePerLitreManual(true); // When editing, assume manual entry
    } else {
      // Pre-fill with current odometer and last fuel price for new logs
      setFormData({
        odometer: bike.current_odo.toString(),
        litres: '',
        total_cost: '',
        price_per_litre: bike.last_fuel_price?.toString() || '',
        is_full_tank: false,
        date: new Date().toISOString().split('T')[0],
      });
      setIsPricePerLitreManual(false); // Start with auto-calculated
    }
    setError(null);
    setFieldErrors({});
  }, [editingLog, isOpen, bike.current_odo, bike.last_fuel_price]);

  // Auto-calculate price_per_litre from total_cost/litres when not manually edited
  // Or calculate total_cost from price_per_litre * litres when price is manually entered
  const calculatedPricePerLitre =
    formData.litres && formData.total_cost && !isPricePerLitreManual
      ? parseFloat(formData.total_cost) / parseFloat(formData.litres)
      : 0;

  const calculatedTotalCost =
    formData.litres && formData.price_per_litre && isPricePerLitreManual
      ? parseFloat(formData.litres) * parseFloat(formData.price_per_litre)
      : 0;

  // Validation function
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    // Validate odometer (required, must be a valid number >= 0)
    const odoValue = formData.odometer.trim();
    if (!odoValue) {
      errors.odometer = 'Odometer reading is required';
    } else {
      const odoNum = parseInt(odoValue, 10);
      if (isNaN(odoNum)) {
        errors.odometer = 'Odometer reading must be a valid number';
      } else if (odoNum < 0) {
        errors.odometer = 'Odometer reading cannot be negative';
      }
    }

    // Validate litres (required, must be > 0)
    const litresValue = formData.litres.trim();
    if (!litresValue) {
      errors.litres = 'Litres is required';
    } else {
      const litresNum = parseFloat(litresValue);
      if (isNaN(litresNum) || litresNum <= 0) {
        errors.litres = 'Litres must be a valid number greater than 0';
      }
    }

    // Validate total_cost (required, must be >= 0)
    const costValue = formData.total_cost.trim();
    if (!costValue) {
      errors.total_cost = 'Total cost is required';
    } else {
      const costNum = parseFloat(costValue);
      if (isNaN(costNum) || costNum < 0) {
        errors.total_cost = 'Total cost must be a valid number >= 0';
      }
    }

    // Validate price_per_litre if manually entered (must be >= 0)
    if (isPricePerLitreManual && formData.price_per_litre.trim()) {
      const priceValue = formData.price_per_litre.trim();
      const priceNum = parseFloat(priceValue);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.price_per_litre = 'Price per litre must be a valid number >= 0';
      }
    }

    // Validate date (required)
    if (!formData.date.trim()) {
      errors.date = 'Date is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if form is valid (for button disable state)
  const isFormValid = (): boolean => {
    const odoValue = formData.odometer.trim();
    if (!odoValue) return false;
    const odoNum = parseInt(odoValue, 10);
    if (isNaN(odoNum) || odoNum < 0) return false;

    const litresValue = formData.litres.trim();
    if (!litresValue) return false;
    const litresNum = parseFloat(litresValue);
    if (isNaN(litresNum) || litresNum <= 0) return false;

    // If price_per_litre is manual, we need both price and it should be valid
    if (isPricePerLitreManual) {
      const priceValue = formData.price_per_litre.trim();
      if (!priceValue) return false;
      const priceNum = parseFloat(priceValue);
      if (isNaN(priceNum) || priceNum < 0) return false;
    } else {
      // If auto-calculating, we need total_cost
      const costValue = formData.total_cost.trim();
      if (!costValue) return false;
      const costNum = parseFloat(costValue);
      if (isNaN(costNum) || costNum < 0) return false;
    }

    if (!formData.date.trim()) return false;

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
      const litresNum = parseFloat(formData.litres);
      let totalCostNum: number;
      let pricePerLitreCalc: number;

      if (isPricePerLitreManual && formData.price_per_litre.trim()) {
        // User entered price_per_litre manually, calculate total_cost
        pricePerLitreCalc = parseFloat(formData.price_per_litre);
        totalCostNum = litresNum * pricePerLitreCalc;
      } else {
        // User entered total_cost, calculate price_per_litre
        totalCostNum = parseFloat(formData.total_cost);
        pricePerLitreCalc = totalCostNum / litresNum;
      }

      const logData: Omit<FuelLog, 'id' | 'created_at'> = {
        bike_id: bike.id,
        odometer: parseInt(formData.odometer, 10),
        litres: Math.round(litresNum * 100) / 100, // Round to 2 decimal places
        price_per_litre: Math.round(pricePerLitreCalc * 100) / 100, // Round to 2 decimal places
        total_cost: Math.round(totalCostNum * 100) / 100, // Round to 2 decimal places
        is_full_tank: formData.is_full_tank,
        date: formData.date,
      };

      // Use toast.promise for add (not edit)
      if (!editingLog) {
        const promise = onSubmit(logData);
        apexToast.promise(promise, {
          loading: 'Adding fuel log...',
          success: 'Fuel log added',
          error: 'Failed to add fuel log',
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
        apexToast.success('Fuel log updated');
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        padding: '1rem',
        paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))`,
        paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0px))`,
        paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
        paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
      }}
    >
      <div
        className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-apex-black border border-apex-white/20 rounded-lg p-6 w-full max-w-md z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-apex-white">
            {editingLog ? 'Edit Fuel Log' : 'Add Refuel'}
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
              Current Odometer (km) *
            </label>
            <input
              type="number"
              value={formData.odometer}
              onChange={(e) => {
                setFormData({ ...formData, odometer: e.target.value });
                if (fieldErrors.odometer) {
                  setFieldErrors({ ...fieldErrors, odometer: undefined });
                }
              }}
              onBlur={validateForm}
              required
              min="0"
              className={`w-full px-4 py-2 bg-apex-black border rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none transition-colors font-mono ${
                fieldErrors.odometer
                  ? 'border-apex-red focus:border-apex-red'
                  : 'border-apex-white/20 focus:border-apex-green'
              }`}
              placeholder="0"
            />
            {fieldErrors.odometer && (
              <p className="text-xs text-apex-red mt-1">
                {fieldErrors.odometer}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-apex-white/60 mb-2">
                Litres *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.litres}
                onChange={(e) => {
                  const newLitres = e.target.value;
                  setFormData({ ...formData, litres: newLitres });
                  // If price_per_litre is manual, recalculate total_cost
                  if (isPricePerLitreManual && formData.price_per_litre && newLitres) {
                    const newTotal = parseFloat(newLitres) * parseFloat(formData.price_per_litre);
                    setFormData(prev => ({ ...prev, litres: newLitres, total_cost: isNaN(newTotal) ? '' : newTotal.toFixed(2) }));
                  }
                  if (fieldErrors.litres) {
                    setFieldErrors({ ...fieldErrors, litres: undefined });
                  }
                }}
                onBlur={validateForm}
                required
                className={`w-full px-4 py-2 bg-apex-black border rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none transition-colors font-mono ${
                  fieldErrors.litres
                    ? 'border-apex-red focus:border-apex-red'
                    : 'border-apex-white/20 focus:border-apex-green'
                }`}
                placeholder="0.00"
              />
              {fieldErrors.litres && (
                <p className="text-xs text-apex-red mt-1">
                  {fieldErrors.litres}
                </p>
              )}
            </div>

            {!isPricePerLitreManual ? (
              <div>
                <label className="block text-sm text-apex-white/60 mb-2">
                  Total Cost *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_cost}
                  onChange={(e) => {
                    setFormData({ ...formData, total_cost: e.target.value });
                    if (fieldErrors.total_cost) {
                      setFieldErrors({ ...fieldErrors, total_cost: undefined });
                    }
                  }}
                  onBlur={validateForm}
                  required
                  className={`w-full px-4 py-2 bg-apex-black border rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none transition-colors font-mono ${
                    fieldErrors.total_cost
                      ? 'border-apex-red focus:border-apex-red'
                      : 'border-apex-white/20 focus:border-apex-green'
                  }`}
                  placeholder="0.00"
                />
                {fieldErrors.total_cost && (
                  <p className="text-xs text-apex-red mt-1">
                    {fieldErrors.total_cost}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm text-apex-white/60 mb-2">
                  Price per Litre *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_per_litre}
                  onChange={(e) => {
                    const newPrice = e.target.value;
                    setFormData({ ...formData, price_per_litre: newPrice });
                    // Recalculate total_cost when price changes
                    if (formData.litres && newPrice) {
                      const newTotal = parseFloat(formData.litres) * parseFloat(newPrice);
                      setFormData(prev => ({ ...prev, price_per_litre: newPrice, total_cost: isNaN(newTotal) ? '' : newTotal.toFixed(2) }));
                    }
                    if (fieldErrors.price_per_litre) {
                      setFieldErrors({ ...fieldErrors, price_per_litre: undefined });
                    }
                  }}
                  onBlur={validateForm}
                  required
                  className={`w-full px-4 py-2 bg-apex-black border rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none transition-colors font-mono ${
                    fieldErrors.price_per_litre
                      ? 'border-apex-red focus:border-apex-red'
                      : 'border-apex-white/20 focus:border-apex-green'
                  }`}
                  placeholder="0.00"
                />
                {fieldErrors.price_per_litre && (
                  <p className="text-xs text-apex-red mt-1">
                    {fieldErrors.price_per_litre}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Show calculated value and toggle */}
          <div className="space-y-2">
            {!isPricePerLitreManual && calculatedPricePerLitre > 0 && (
              <div className="p-3 bg-apex-green/10 border border-apex-green/20 rounded-lg">
                <p className="text-xs text-apex-white/60 mb-1">Calculated Price per Litre</p>
                <p className="text-sm font-mono text-apex-green">
                  ₹{calculatedPricePerLitre.toFixed(2)}/L
                </p>
              </div>
            )}
            
            {isPricePerLitreManual && calculatedTotalCost > 0 && (
              <div className="p-3 bg-apex-green/10 border border-apex-green/20 rounded-lg">
                <p className="text-xs text-apex-white/60 mb-1">Calculated Total Cost</p>
                <p className="text-sm font-mono text-apex-green">
                  ₹{calculatedTotalCost.toFixed(2)}
                </p>
              </div>
            )}

            <motion.button
              type="button"
              onClick={() => {
                setIsPricePerLitreManual(!isPricePerLitreManual);
                // Clear the field that's not being used
                if (!isPricePerLitreManual) {
                  // Switching to manual price entry
                  setFormData(prev => ({ ...prev, total_cost: '' }));
                } else {
                  // Switching to auto-calculate from total cost
                  setFormData(prev => ({ ...prev, price_per_litre: bike.last_fuel_price?.toString() || '' }));
                }
              }}
              className="w-full text-xs text-apex-green hover:text-apex-green/80 transition-colors text-left"
              {...buttonHoverProps}
            >
              {isPricePerLitreManual 
                ? 'Switch to: Enter Total Cost (auto-calculate price/L)'
                : 'Switch to: Enter Price per Litre (auto-calculate total)'}
            </motion.button>
          </div>

          <div>
            <label className="block text-sm text-apex-white/60 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => {
                setFormData({ ...formData, date: e.target.value });
                if (fieldErrors.date) {
                  setFieldErrors({ ...fieldErrors, date: undefined });
                }
              }}
              onBlur={validateForm}
              required
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 bg-apex-black border rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none transition-colors ${
                fieldErrors.date
                  ? 'border-apex-red focus:border-apex-red'
                  : 'border-apex-white/20 focus:border-apex-green'
              }`}
            />
            {fieldErrors.date && (
              <p className="text-xs text-apex-red mt-1">{fieldErrors.date}</p>
            )}
          </div>

          {/* Full Tank Toggle */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg">
            <input
              type="checkbox"
              id="is_full_tank"
              checked={formData.is_full_tank}
              onChange={(e) =>
                setFormData({ ...formData, is_full_tank: e.target.checked })
              }
              className="w-5 h-5 rounded border-apex-white/20 bg-apex-black text-apex-green focus:ring-apex-green focus:ring-offset-apex-black"
            />
            <label
              htmlFor="is_full_tank"
              className="flex-1 text-sm text-apex-white cursor-pointer"
            >
              <span className="font-semibold">Full Tank?</span>
              <span className="block text-xs text-apex-white/60 mt-1">
                Enable this for accurate mileage calculation. Only full tank refuels are used to calculate average mileage.
              </span>
            </label>
          </div>

          {error && (
            <div className="text-apex-red text-sm">{error}</div>
          )}

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
                  : 'Add Refuel'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}

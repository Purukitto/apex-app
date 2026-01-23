import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { FuelLog, Bike } from '../types/database';
import { apexToast } from '../lib/toast';
import { motion } from 'framer-motion';
import { buttonHoverProps } from '../lib/animations';
import { useKeyboard } from '../hooks/useKeyboard';

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
    fuel?: string;
  }>({});
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();
  const formRef = useRef<HTMLFormElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const keyboardPadding =
    typeof window !== 'undefined' && window.visualViewport ? 0 : keyboardHeight;

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
    }
    setError(null);
    setFieldErrors({});
  }, [editingLog, isOpen, bike.current_odo, bike.last_fuel_price]);

  useEffect(() => {
    const handleInputFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setTimeout(() => {
          const scrollContainer = scrollContainerRef.current;
          if (!scrollContainer) return;

          const inputRect = target.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
          const keyboardOffset = window.visualViewport ? 0 : (isKeyboardVisible ? keyboardHeight : 0);
          const visibleTop = containerRect.top + 16;
          const visibleBottom = Math.min(containerRect.bottom, viewportHeight - keyboardOffset) - 16;
          if (visibleBottom <= visibleTop) return;

          const inputTop = inputRect.top;
          const inputBottom = inputRect.bottom;

          if (inputBottom > visibleBottom) {
            const scrollNeeded = inputBottom - visibleBottom + 24;
            scrollContainer.scrollTop += scrollNeeded;
          } else if (inputTop < visibleTop) {
            const scrollNeeded = visibleTop - inputTop + 24;
            scrollContainer.scrollTop = Math.max(0, scrollContainer.scrollTop - scrollNeeded);
          }
        }, isKeyboardVisible ? 500 : 100);
      }
    };

    const form = formRef.current;
    if (form) {
      form.addEventListener('focusin', handleInputFocus);
      return () => {
        form.removeEventListener('focusin', handleInputFocus);
      };
    }
  }, [isKeyboardVisible, keyboardHeight]);

  const parsePositiveNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = parseFloat(trimmed);
    return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
  };

  const litresValue = parsePositiveNumber(formData.litres);
  const totalCostValue = parsePositiveNumber(formData.total_cost);
  const pricePerLitreValue = parsePositiveNumber(formData.price_per_litre);

  const providedFuelFields = [
    litresValue,
    totalCostValue,
    pricePerLitreValue,
  ].filter((value) => value !== null).length;

  const calculatedFuelValues = {
    litres:
      !litresValue && totalCostValue && pricePerLitreValue
        ? totalCostValue / pricePerLitreValue
        : null,
    totalCost:
      !totalCostValue && litresValue && pricePerLitreValue
        ? litresValue * pricePerLitreValue
        : null,
    pricePerLitre:
      !pricePerLitreValue && litresValue && totalCostValue
        ? totalCostValue / litresValue
        : null,
  };

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

    if (formData.litres.trim() && !litresValue) {
      errors.litres = 'Litres must be a valid number greater than 0';
    }

    if (formData.total_cost.trim() && !totalCostValue) {
      errors.total_cost = 'Total cost must be a valid number greater than 0';
    }

    if (formData.price_per_litre.trim() && !pricePerLitreValue) {
      errors.price_per_litre = 'Price per litre must be a valid number greater than 0';
    }

    if (providedFuelFields < 2) {
      errors.fuel = 'Enter any two: litres, price per litre, or total cost.';
    }

    if (providedFuelFields === 3 && litresValue && pricePerLitreValue && totalCostValue) {
      const expectedTotal = litresValue * pricePerLitreValue;
      const diff = Math.abs(totalCostValue - expectedTotal);
      if (diff > 0.05) {
        errors.fuel = 'Values do not match. Clear one field to auto-calculate.';
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

    if (providedFuelFields < 2) return false;
    if (providedFuelFields === 3 && litresValue && pricePerLitreValue && totalCostValue) {
      const expectedTotal = litresValue * pricePerLitreValue;
      const diff = Math.abs(totalCostValue - expectedTotal);
      if (diff > 0.05) return false;
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
      const litresNum =
        litresValue ??
        (totalCostValue && pricePerLitreValue
          ? totalCostValue / pricePerLitreValue
          : 0);
      const totalCostNum =
        totalCostValue ??
        (litresValue && pricePerLitreValue
          ? litresValue * pricePerLitreValue
          : 0);
      const pricePerLitreCalc =
        pricePerLitreValue ??
        (litresValue && totalCostValue ? totalCostValue / litresValue : 0);

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
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="fixed inset-0 flex"
        style={{
          paddingTop: `calc(env(safe-area-inset-top, 0px) + 1rem)`,
          paddingBottom: isKeyboardVisible
            ? `calc(env(safe-area-inset-bottom, 0px) + ${keyboardPadding}px + 1rem)`
            : `calc(env(safe-area-inset-bottom, 0px) + 6rem)`,
          paddingLeft: `calc(env(safe-area-inset-left, 0px) + 1rem)`,
          paddingRight: `calc(env(safe-area-inset-right, 0px) + 1rem)`,
        }}
      >
        <div
          className={`relative bg-apex-black border border-apex-white/20 rounded-lg p-6 w-full max-w-md z-10 flex flex-col mx-auto max-h-full overflow-hidden ${isKeyboardVisible ? 'my-2' : 'my-8'}`}
          style={{ minHeight: isKeyboardVisible ? 'auto' : 'min-content' }}
        >
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

        <form ref={formRef} onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 space-y-4"
          >
            <div className="mb-4 p-3 bg-apex-white/5 rounded-lg border border-apex-white/10">
              <p className="text-sm text-apex-white/60 mb-1">Bike</p>
              <p className="text-apex-white font-medium">
                {bike.nick_name || `${bike.make} ${bike.model}`}
              </p>
            </div>
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

          <div className="space-y-2">
            <p className="text-xs text-apex-white/60">
              Enter any two fields below. The third value is auto-calculated.
            </p>
            {fieldErrors.fuel && (
              <p className="text-xs text-apex-red">{fieldErrors.fuel}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-apex-white/60 mb-2">
                Litres
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.litres}
                onChange={(e) => {
                  setFormData({ ...formData, litres: e.target.value });
                  if (fieldErrors.litres || fieldErrors.fuel) {
                    setFieldErrors({
                      ...fieldErrors,
                      litres: undefined,
                      fuel: undefined,
                    });
                  }
                }}
                onBlur={validateForm}
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

            <div>
              <label className="block text-sm text-apex-white/60 mb-2">
                Price per Litre
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price_per_litre}
                onChange={(e) => {
                  setFormData({ ...formData, price_per_litre: e.target.value });
                  if (fieldErrors.price_per_litre || fieldErrors.fuel) {
                    setFieldErrors({
                      ...fieldErrors,
                      price_per_litre: undefined,
                      fuel: undefined,
                    });
                  }
                }}
                onBlur={validateForm}
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

            <div>
              <label className="block text-sm text-apex-white/60 mb-2">
                Total Cost
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.total_cost}
                onChange={(e) => {
                  setFormData({ ...formData, total_cost: e.target.value });
                  if (fieldErrors.total_cost || fieldErrors.fuel) {
                    setFieldErrors({
                      ...fieldErrors,
                      total_cost: undefined,
                      fuel: undefined,
                    });
                  }
                }}
                onBlur={validateForm}
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
          </div>

          {calculatedFuelValues.litres !== null && (
            <div className="p-3 bg-apex-green/10 border border-apex-green/20 rounded-lg">
              <p className="text-xs text-apex-white/60 mb-1">Calculated Litres</p>
              <p className="text-sm font-mono text-apex-green">
                {calculatedFuelValues.litres.toFixed(2)} L
              </p>
            </div>
          )}

          {calculatedFuelValues.pricePerLitre !== null && (
            <div className="p-3 bg-apex-green/10 border border-apex-green/20 rounded-lg">
              <p className="text-xs text-apex-white/60 mb-1">Calculated Price per Litre</p>
              <p className="text-sm font-mono text-apex-green">
                ₹{calculatedFuelValues.pricePerLitre.toFixed(2)}/L
              </p>
            </div>
          )}

          {calculatedFuelValues.totalCost !== null && (
            <div className="p-3 bg-apex-green/10 border border-apex-green/20 rounded-lg">
              <p className="text-xs text-apex-white/60 mb-1">Calculated Total Cost</p>
              <p className="text-sm font-mono text-apex-green">
                ₹{calculatedFuelValues.totalCost.toFixed(2)}
              </p>
            </div>
          )}

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
          <div className="flex items-center gap-3 p-4 bg-linear-to-br from-apex-white/5 to-transparent border border-apex-white/20 rounded-md">
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
          </div>

          <div className="flex gap-3 pt-4 mt-4 border-t border-apex-white/10 shrink-0">
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
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, CheckCircle2, AlertTriangle, Flag } from 'lucide-react';
import type { Bike } from '../types/database';
import type { GlobalBikeSpec } from '../types/database';
import { apexToast } from '../lib/toast';
import { motion } from 'framer-motion';
import { buttonHoverProps, cardHoverProps } from '../lib/animations';
import { searchGlobalBikesMultiple, reportBikeSpec } from '../services/bikeLibrary';
import { logger } from '../lib/logger';
import { useKeyboard } from '../hooks/useKeyboard';

interface AddBikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bikeData: Omit<Bike, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
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
    image_url: '',
    specs_engine: '',
    specs_power: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalBikeResults, setGlobalBikeResults] = useState<GlobalBikeSpec[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [reportingBikeId, setReportingBikeId] = useState<string | null>(null);
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();
  const formRef = useRef<HTMLFormElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingBike) {
      setFormData({
        make: editingBike.make,
        model: editingBike.model,
        year: editingBike.year?.toString() || '',
        nick_name: editingBike.nick_name || '',
        current_odo: editingBike.current_odo.toString(),
        image_url: editingBike.image_url || '',
        specs_engine: editingBike.specs_engine || '',
        specs_power: editingBike.specs_power || '',
      });
      setShowManualEntry(true);
    } else {
      setFormData({
        make: '',
        model: '',
        year: '',
        nick_name: '',
        current_odo: '',
        image_url: '',
        specs_engine: '',
        specs_power: '',
      });
      setShowManualEntry(false);
    }
    setError(null);
    setSearchQuery('');
    setGlobalBikeResults([]);
  }, [editingBike, isOpen]);

  // Debounced search: Search global bike database
  useEffect(() => {
    if (editingBike || !searchQuery.trim() || searchQuery.length < 3) {
      setGlobalBikeResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setGlobalBikeResults([]);

      try {
        // Search global database and get multiple results (limit 5)
        const results = await searchGlobalBikesMultiple({ query: searchQuery }, 5);
        if (results && results.length > 0) {
          setGlobalBikeResults(results);
        }
      } catch (error) {
        logger.error('Search error:', error);
        setGlobalBikeResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, editingBike]);

  // Handle selecting a bike from the results list
  const handleSelectBike = (bike: GlobalBikeSpec) => {
    setFormData((prev) => ({
      ...prev,
      make: bike.make,
      model: bike.model,
      year: bike.year?.toString() || prev.year,
      image_url: bike.image_url || prev.image_url,
      specs_engine: bike.displacement || prev.specs_engine,
      specs_power: bike.power || prev.specs_power,
    }));
    setShowManualEntry(true);
  };

  // Handle reporting bad data
  const handleReportBike = async (bikeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the bike when clicking report
    setReportingBikeId(bikeId);
    try {
      const success = await reportBikeSpec(bikeId);
      if (success) {
        apexToast.success('Bike reported');
        // Refresh results to show updated report_count
        const results = await searchGlobalBikesMultiple({ query: searchQuery }, 5);
        if (results) {
          setGlobalBikeResults(results);
        }
      } else {
        apexToast.error('Failed to report bike');
      }
    } catch (error) {
      logger.error('Error reporting bike:', error);
      apexToast.error('Failed to report bike');
    } finally {
      setReportingBikeId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const bikeData: Omit<Bike, 'id' | 'user_id' | 'created_at'> = {
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: formData.year ? parseInt(formData.year, 10) : undefined,
        nick_name: formData.nick_name.trim() || undefined,
        current_odo: Math.round(parseFloat(formData.current_odo) || 0), // Round to integer to match int4 type
        image_url: formData.image_url.trim() || undefined,
        specs_engine: formData.specs_engine.trim() || undefined,
        specs_power: formData.specs_power.trim() || undefined,
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

  // Handle input focus to scroll into view when keyboard appears
  useEffect(() => {
    const handleInputFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        // Wait for keyboard to appear, then scroll input into view
        setTimeout(() => {
          const scrollContainer = scrollContainerRef.current;
          if (!scrollContainer) return;
          
          const inputRect = target.getBoundingClientRect();
          const viewportHeight = window.visualViewport?.height || window.innerHeight;
          const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0', 10) || 0;
          
          // Calculate available space above keyboard
          const topPadding = safeAreaTop + 100; // Header space
          const bottomPadding = 20; // Padding above keyboard
          const availableHeight = isKeyboardVisible 
            ? (window.visualViewport?.height || viewportHeight) - keyboardHeight
            : viewportHeight;
          
          const visibleTop = topPadding;
          const visibleBottom = availableHeight - bottomPadding;
          
          const inputTop = inputRect.top;
          const inputBottom = inputRect.bottom;
          
          // Check if input needs scrolling
          if (inputBottom > visibleBottom) {
            // Input is below visible area - scroll down
            const scrollNeeded = inputBottom - visibleBottom + 30;
            scrollContainer.scrollTop += scrollNeeded;
          } else if (inputTop < visibleTop) {
            // Input is above visible area (behind header) - scroll up
            const scrollNeeded = visibleTop - inputTop + 30;
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

  // Check if required fields are filled
  const canSubmit = formData.make.trim() && formData.model.trim();

  if (!isOpen) return null;

  return (
    <div 
      ref={scrollContainerRef}
      className="fixed inset-0 z-[100] overflow-y-auto"
      style={{
        paddingTop: `calc(env(safe-area-inset-top, 0px) + 1rem)`,
        paddingBottom: isKeyboardVisible 
          ? `calc(env(safe-area-inset-bottom, 0px) + ${keyboardHeight}px + 1rem)` 
          : `calc(env(safe-area-inset-bottom, 0px) + 6rem)`,
        paddingLeft: `calc(env(safe-area-inset-left, 0px) + 1rem)`,
        paddingRight: `calc(env(safe-area-inset-right, 0px) + 1rem)`,
      }}
    >
      <div
        className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        ref={modalContentRef}
        className="relative bg-apex-black border border-apex-white/20 rounded-lg p-6 w-full max-w-md z-10 flex flex-col mx-auto my-8"
        style={{
          minHeight: isKeyboardVisible ? 'auto' : 'min-content',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-apex-white">
            {editingBike ? 'Edit Bike' : 'Add Bike'}
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

        <form 
          id="add-bike-form"
          ref={formRef} 
          onSubmit={handleSubmit} 
          className="space-y-4 flex-1 min-h-0"
        >
          {/* Bike Search - Only show when adding (not editing) */}
          {!editingBike && (
            <div>
              <label className="block text-sm text-apex-white/60 mb-2">
                Search Bike Database (optional)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-apex-white/40" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
                  placeholder="e.g., Royal Enfield Classic 350, Yamaha MT-07"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-apex-green animate-spin" size={18} />
                )}
              </div>
              
              {/* Global Database Results List */}
              {globalBikeResults.length > 0 && (
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {globalBikeResults.map((bike) => (
                    <motion.div
                      key={bike.id}
                      className="p-3 bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg cursor-pointer hover:border-apex-green/40 transition-colors group"
                      onClick={() => handleSelectBike(bike)}
                      {...cardHoverProps}
                    >
                      <div className="flex items-start gap-3">
                        {bike.image_url && (
                          <img
                            src={bike.image_url}
                            alt={`${bike.make} ${bike.model}`}
                            className="w-12 h-12 object-cover rounded border border-apex-white/20 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-apex-white font-semibold text-sm truncate">
                              {bike.make} {bike.model}
                            </p>
                            {bike.is_verified && (
                              <div title="Verified">
                                <CheckCircle2 className="text-apex-green shrink-0" size={14} />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {bike.category && (
                              <span className="text-apex-white/60 text-xs px-2 py-0.5 bg-apex-white/5 rounded">
                                {bike.category}
                                {bike.year && ` • ${bike.year}`}
                              </span>
                            )}
                            {!bike.category && bike.year && (
                              <span className="text-apex-white/60 text-xs px-2 py-0.5 bg-apex-white/5 rounded font-mono">
                                {bike.year}
                              </span>
                            )}
                            {bike.report_count > 0 && (
                              <span className="text-apex-white/40 text-xs flex items-center gap-1">
                                <AlertTriangle size={12} />
                                {bike.report_count} report{bike.report_count !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <motion.button
                          type="button"
                          onClick={(e) => handleReportBike(bike.id, e)}
                          disabled={reportingBikeId === bike.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-apex-white/60 hover:text-apex-red rounded hover:bg-apex-red/10 shrink-0"
                          title="Report incorrect data"
                          {...buttonHoverProps}
                        >
                          {reportingBikeId === bike.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Flag size={14} />
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 3 && !isSearching && globalBikeResults.length === 0 && (
                <p className="mt-2 text-apex-white/40 text-xs">
                  No results found. You can still enter bike details manually.
                </p>
              )}
              
              {/* Manual entry button - show when there are results OR no results */}
              {searchQuery && !showManualEntry && (
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowManualEntry(true);
                  }}
                  className="mt-3 w-full px-4 py-2 border border-apex-green/40 text-apex-green rounded-lg hover:bg-apex-green/10 transition-colors text-sm font-medium"
                  {...buttonHoverProps}
                >
                  {globalBikeResults.length > 0 
                    ? 'Enter details manually instead' 
                    : 'Enter details manually'}
                </motion.button>
              )}
              
              {/* Back to search results button - only show when manual entry is active AND there are results */}
              {searchQuery && showManualEntry && globalBikeResults.length > 0 && (
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowManualEntry(false);
                  }}
                  className="mt-2 text-xs text-apex-white/60 hover:text-apex-white transition-colors"
                  {...buttonHoverProps}
                >
                  ← Back to search results
                </motion.button>
              )}
            </div>
          )}

          {/* Manual entry fields - only show when:
              1. Editing a bike
              2. No search query (user can type directly)
              3. User selected a bike from results (showManualEntry = true)
              4. User clicked manual entry button
          */}
          {(editingBike || !searchQuery || showManualEntry) && (
            <>
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

          {/* Additional fields for rich data */}
          <div>
            <label className="block text-sm text-apex-white/60 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors text-sm"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-apex-white/60 mb-2">
                Engine Specs
              </label>
              <input
                type="text"
                value={formData.specs_engine}
                onChange={(e) => setFormData({ ...formData, specs_engine: e.target.value })}
                className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors text-sm"
                placeholder="e.g., 373cc"
              />
            </div>
            <div>
              <label className="block text-sm text-apex-white/60 mb-2">
                Power Specs
              </label>
              <input
                type="text"
                value={formData.specs_power}
                onChange={(e) => setFormData({ ...formData, specs_power: e.target.value })}
                className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors text-sm"
                placeholder="e.g., 40 PS"
              />
            </div>
          </div>
            </>
          )}

          {error && (
            <div className="text-apex-red text-sm">{error}</div>
          )}
        </form>

        {/* Action buttons - sticky at bottom of modal */}
        {/* Only show buttons when manual entry is visible or editing */}
        {(editingBike || !searchQuery || showManualEntry) && (
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
              type="button"
              onClick={() => {
                if (!canSubmit && !editingBike) {
                  apexToast.error('Please fill in Make and Model fields');
                  return;
                }
                // Create a synthetic submit event
                const form = formRef.current;
                if (form) {
                  // Create a minimal event object that satisfies the type
                  // Using double cast through 'unknown' as TypeScript requires
                  const syntheticEvent = {
                    preventDefault: () => {},
                    currentTarget: form,
                    target: form,
                  } as unknown as React.FormEvent<HTMLFormElement>;
                  handleSubmit(syntheticEvent);
                }
              }}
              disabled={isSubmitting || (!canSubmit && !editingBike)}
              className="flex-1 px-4 py-2 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              {...(isSubmitting ? {} : buttonHoverProps)}
            >
              {isSubmitting
                ? 'Saving...'
                : editingBike
                  ? 'Update'
                  : 'Add Bike'}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}


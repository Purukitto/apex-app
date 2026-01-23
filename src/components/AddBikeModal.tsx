import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, CheckCircle2, AlertTriangle, Flag } from 'lucide-react';
import type { Bike } from '../types/database';
import type { GlobalBikeSpec } from '../types/database';
import { apexToast } from '../lib/toast';
import { motion } from 'framer-motion';
import { buttonHoverProps } from '../lib/animations';
import { Card } from './ui/Card';
import { searchGlobalBikesMultiple, reportBikeSpec } from '../services/bikeLibrary';
import { logger } from '../lib/logger';
import { useKeyboard } from '../hooks/useKeyboard';
import { toTitleCase } from '../lib/capitalize';

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
  const [selectedBike, setSelectedBike] = useState<GlobalBikeSpec | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [reportingBikeId, setReportingBikeId] = useState<string | null>(null);
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();
  const formRef = useRef<HTMLFormElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const keyboardPadding =
    typeof window !== 'undefined' && window.visualViewport ? 0 : keyboardHeight;

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
    setSelectedBike(null);
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
      make: toTitleCase(bike.make), // Capitalize make
      model: toTitleCase(bike.model), // Capitalize model
      year: bike.year?.toString() || prev.year,
      image_url: bike.image_url || prev.image_url,
      specs_engine: bike.displacement || prev.specs_engine,
      specs_power: bike.power || prev.specs_power,
    }));
    setSelectedBike(bike); // Store selected bike for reporting
    setShowManualEntry(true);
    // Clear search results since bike has been selected and form is auto-filled
    setGlobalBikeResults([]);
  };

  // Handle reporting bad data
  const handleReportBike = async (bikeId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent selecting the bike when clicking report from list
    }
    setReportingBikeId(bikeId);
    try {
      const success = await reportBikeSpec(bikeId);
      if (success) {
        apexToast.success('Bike reported');
        // If reporting from search results, refresh the list
        if (globalBikeResults.length > 0) {
          const results = await searchGlobalBikesMultiple({ query: searchQuery }, 5);
          if (results) {
            setGlobalBikeResults(results);
          }
        }
        // If reporting selected bike, update its report_count
        if (selectedBike && selectedBike.id === bikeId) {
          setSelectedBike({
            ...selectedBike,
            report_count: selectedBike.report_count + 1,
          });
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
        year: formData.year ? parseInt(formData.year, 10) : null,
        nick_name: formData.nick_name.trim() || null,
        current_odo: Math.round(parseFloat(formData.current_odo) || 0), // Round to integer to match int4 type
        image_url: formData.image_url.trim() || null,
        specs_engine: formData.specs_engine.trim() || null,
        specs_power: formData.specs_power.trim() || null,
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

  // Handle input focus to scroll into view within the modal body
  useEffect(() => {
    const handleInputFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        // Wait for keyboard to appear, then scroll input into view
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
          
          // Check if input needs scrolling
          if (inputBottom > visibleBottom) {
            // Input is below visible area - scroll down
            const scrollNeeded = inputBottom - visibleBottom + 24;
            scrollContainer.scrollTop += scrollNeeded;
          } else if (inputTop < visibleTop) {
            // Input is above visible area (behind header) - scroll up
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

  // Check if required fields are filled
  const canSubmit = formData.make.trim() && formData.model.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100">
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
          className="flex-1 min-h-0 flex flex-col"
        >
          <div
            ref={scrollContainerRef}
            className="modal-scroll-body flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 space-y-4"
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
              
              {/* Global Database Results List - only show when not in manual entry mode */}
              {globalBikeResults.length > 0 && !showManualEntry && (
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {globalBikeResults.map((bike) => (
                    <Card
                      key={bike.id}
                      padding="sm"
                      animate="none"
                      clickable
                      onClick={() => handleSelectBike(bike)}
                      className="group"
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
                              {toTitleCase(bike.make)} {toTitleCase(bike.model)}
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
                                {toTitleCase(bike.category)}
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
                    </Card>
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
                    setSelectedBike(null); // Clear selected bike when going back
                  }}
                  className="mt-2 text-xs text-apex-white/60 hover:text-apex-white transition-colors"
                  {...buttonHoverProps}
                >
                  ← Back to search results
                </motion.button>
              )}
            </div>
          )}

          {/* Selected Bike Display - show when a bike was selected from search */}
          {selectedBike && showManualEntry && (
            <div className="p-3 bg-linear-to-br from-apex-white/5 to-transparent border border-apex-green/40 rounded-md">
              <div className="flex items-start gap-3">
                {selectedBike.image_url && (
                  <img
                    src={selectedBike.image_url}
                    alt={`${selectedBike.make} ${selectedBike.model}`}
                    className="w-12 h-12 object-cover rounded border border-apex-white/20 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-apex-white font-semibold text-sm">
                      {toTitleCase(selectedBike.make)} {toTitleCase(selectedBike.model)}
                    </p>
                    {selectedBike.is_verified && (
                      <div title="Verified">
                        <CheckCircle2 className="text-apex-green shrink-0" size={14} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {selectedBike.category && (
                      <span className="text-apex-white/60 text-xs px-2 py-0.5 bg-apex-white/5 rounded">
                        {toTitleCase(selectedBike.category)}
                        {selectedBike.year && ` • ${selectedBike.year}`}
                      </span>
                    )}
                    {!selectedBike.category && selectedBike.year && (
                      <span className="text-apex-white/60 text-xs px-2 py-0.5 bg-apex-white/5 rounded font-mono">
                        {selectedBike.year}
                      </span>
                    )}
                    {selectedBike.report_count > 0 && (
                      <span className="text-apex-white/40 text-xs flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {selectedBike.report_count} report{selectedBike.report_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={() => handleReportBike(selectedBike.id)}
                  disabled={reportingBikeId === selectedBike.id}
                  className="p-2 text-apex-white/60 hover:text-apex-red rounded hover:bg-apex-red/10 shrink-0 transition-colors"
                  title="Report incorrect data"
                  {...buttonHoverProps}
                >
                  {reportingBikeId === selectedBike.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Flag size={16} />
                  )}
                </motion.button>
              </div>
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
          </div>

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
        </form>
      </div>
    </div>
    </div>
  );
}


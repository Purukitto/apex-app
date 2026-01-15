import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import type { Bike } from '../types/database';
import { apexToast } from '../lib/toast';
import { motion } from 'framer-motion';
import { buttonHoverProps } from '../lib/animations';
import { searchBike, extractEngineSpecs, extractPowerSpecs } from '../services/bikeData';
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
  const [wikiSearchQuery, setWikiSearchQuery] = useState('');
  const [wikiSearchResult, setWikiSearchResult] = useState<Awaited<ReturnType<typeof searchBike>> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();
  const formRef = useRef<HTMLFormElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

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
    setWikiSearchQuery('');
    setWikiSearchResult(null);
  }, [editingBike, isOpen]);

  // Debounced Wikipedia search
  useEffect(() => {
    if (editingBike || !wikiSearchQuery.trim() || wikiSearchQuery.length < 3) {
      setWikiSearchResult(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await searchBike(wikiSearchQuery);
        setWikiSearchResult(result);
        if (result) {
          // Auto-fill form data from Wikipedia result
          // Parse title to extract make and model (e.g., "Bajaj Dominar 400" -> make: "Bajaj", model: "Dominar 400")
          const titleParts = result.title.split(' ');
          if (titleParts.length >= 2) {
            setFormData((prev) => ({
              ...prev,
              make: titleParts[0],
              model: titleParts.slice(1).join(' '),
              image_url: result.imageUrl || prev.image_url,
              specs_engine: extractEngineSpecs(result.extract) || prev.specs_engine,
              specs_power: extractPowerSpecs(result.extract) || prev.specs_power,
            }));
          } else {
            // If title is single word, use it as model
            setFormData((prev) => ({
              ...prev,
              model: result.title,
              image_url: result.imageUrl || prev.image_url,
              specs_engine: extractEngineSpecs(result.extract) || prev.specs_engine,
              specs_power: extractPowerSpecs(result.extract) || prev.specs_power,
            }));
          }
        }
      } catch (error) {
        logger.error('Wikipedia search error:', error);
        setWikiSearchResult(null);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [wikiSearchQuery, editingBike]);

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
    if (!isKeyboardVisible) return;

    const handleInputFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        // Wait for keyboard animation to complete
        setTimeout(() => {
          scrollInputIntoView(target);
        }, 400);
      }
    };

    const scrollInputIntoView = (input: HTMLElement) => {
      if (!formRef.current || !modalContentRef.current) return;
      
      const formContainer = formRef.current;
      const inputRect = input.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0', 10) || 0;
      
      // Calculate available space above keyboard
      // Leave some padding at top (for header) and bottom (above keyboard)
      const topPadding = safeAreaTop + 120; // Header + safe area + padding
      const bottomPadding = 20; // Padding above keyboard
      const availableHeight = viewportHeight - keyboardHeight;
      const visibleTop = topPadding;
      const visibleBottom = availableHeight - bottomPadding;
      
      const inputTop = inputRect.top;
      const inputBottom = inputRect.bottom;
      
      // Check if input needs to be scrolled into view
      if (inputBottom > visibleBottom) {
        // Input is below visible area - scroll down
        const scrollNeeded = inputBottom - visibleBottom + 30; // Extra padding
        const currentScroll = formContainer.scrollTop;
        formContainer.scrollTo({
          top: currentScroll + scrollNeeded,
          behavior: 'smooth'
        });
      } else if (inputTop < visibleTop) {
        // Input is above visible area (behind header) - scroll up
        const scrollNeeded = visibleTop - inputTop + 30; // Extra padding
        const currentScroll = formContainer.scrollTop;
        formContainer.scrollTo({
          top: Math.max(0, currentScroll - scrollNeeded),
          behavior: 'smooth'
        });
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

  // Calculate bottom padding to account for bottom pill nav (when keyboard is not visible)
  const bottomPadding = isKeyboardVisible 
    ? `calc(1rem + env(safe-area-inset-bottom, 0px) + ${keyboardHeight}px)`
    : `calc(6rem + env(safe-area-inset-bottom, 0px))`; // Extra space for bottom pill nav

  // When keyboard is visible, align modal to top; otherwise center it
  const modalAlignment = isKeyboardVisible ? 'items-start' : 'items-center';

  return (
    <div 
      className={`fixed inset-0 z-[100] flex ${modalAlignment} justify-center overflow-hidden`}
      style={{
        padding: '1rem',
        paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))`,
        paddingBottom: bottomPadding,
        paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
        paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
      }}
    >
      <div
        className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        ref={modalContentRef}
        className="relative bg-apex-black border border-apex-white/20 rounded-lg p-6 w-full max-w-md z-10 flex flex-col"
        style={isKeyboardVisible ? {
          marginTop: '0',
          maxHeight: `calc(100vh - env(safe-area-inset-top, 0px) - ${keyboardHeight}px - 2rem)`,
          height: `calc(100vh - env(safe-area-inset-top, 0px) - ${keyboardHeight}px - 2rem)`,
        } : {
          maxHeight: '90vh',
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
          className="space-y-4 overflow-y-auto flex-1 pr-2 min-h-0 scroll-smooth" 
          style={{ 
            maxHeight: isKeyboardVisible 
              ? `calc(100vh - env(safe-area-inset-top, 0px) - ${keyboardHeight}px - 10rem)` 
              : 'calc(90vh - 8rem)'
          }}
        >
          {/* Wikipedia Search - Only show when adding (not editing) */}
          {!editingBike && (
            <div>
              <label className="block text-sm text-apex-white/60 mb-2">
                Search Wikipedia (optional)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-apex-white/40" size={18} />
                <input
                  type="text"
                  value={wikiSearchQuery}
                  onChange={(e) => setWikiSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
                  placeholder="e.g., Dominar 400, Yamaha MT-07"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-apex-green animate-spin" size={18} />
                )}
              </div>
              {wikiSearchResult && (
                <div className="mt-2 p-3 bg-gradient-to-br from-white/5 to-transparent border border-apex-green/40 rounded-lg">
                  <div className="flex items-start gap-3">
                    {wikiSearchResult.imageUrl && (
                      <img
                        src={wikiSearchResult.imageUrl}
                        alt={wikiSearchResult.title}
                        className="w-16 h-16 object-cover rounded border border-apex-white/20"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-apex-white font-semibold text-sm">{wikiSearchResult.title}</p>
                      {wikiSearchResult.extract && (
                        <p className="text-apex-white/60 text-xs mt-1 line-clamp-2">
                          {wikiSearchResult.extract.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {wikiSearchQuery.length >= 3 && !isSearching && !wikiSearchResult && (
                <p className="mt-2 text-apex-white/40 text-xs">
                  No results found. You can still enter bike details manually.
                </p>
              )}
              {wikiSearchQuery && !showManualEntry && (
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowManualEntry(true);
                    // Don't clear search query - let user see what they searched for
                    // They can still edit the auto-filled fields
                  }}
                  className="mt-3 w-full px-4 py-2 border border-apex-green/40 text-apex-green rounded-lg hover:bg-apex-green/10 transition-colors text-sm font-medium"
                  {...buttonHoverProps}
                >
                  {wikiSearchResult 
                    ? 'Edit details manually' 
                    : 'Enter details manually instead'}
                </motion.button>
              )}
              {wikiSearchQuery && showManualEntry && (
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

          {/* Manual entry fields - always show when editing, or when no search query, or when search result found (so user can edit), or when user wants manual entry */}
          {/* Only show Add Bike button when required fields are visible and filled */}
          {(editingBike || !wikiSearchQuery || wikiSearchResult || showManualEntry) && (
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
        {(editingBike || !wikiSearchQuery || wikiSearchResult || showManualEntry) && (
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


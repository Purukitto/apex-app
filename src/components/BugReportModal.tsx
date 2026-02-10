import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Bug, Loader2 } from 'lucide-react';
import { buttonHoverProps } from '../lib/animations';
import { submitBugReport } from '../lib/bugReport';
import { apexToast } from '../lib/toast';
import { logger } from '../lib/logger';
import { useBugReportStore } from '../stores/useBugReportStore';
import { useKeyboard } from '../hooks/useKeyboard';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';

export default function BugReportModal() {
  const { isOpen, close } = useBugReportStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const keyboardPadding =
    typeof window !== 'undefined' && window.visualViewport ? 0 : keyboardHeight;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setStepsToReproduce('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Scroll active field into view when keyboard shows
  useEffect(() => {
    if (!isKeyboardVisible || !formRef.current) return;

    const handleFocusIn = () => {
      const active = document.activeElement as HTMLElement | null;
      if (active && formRef.current?.contains(active)) {
        setTimeout(() => {
          active.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    };

    formRef.current.addEventListener('focusin', handleFocusIn);
    const ref = formRef.current;
    return () => {
      ref.removeEventListener('focusin', handleFocusIn);
    };
  }, [isKeyboardVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      apexToast.error('Please enter a title');
      return;
    }
    if (!description.trim()) {
      apexToast.error('Please describe the bug');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitBugReport({
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: stepsToReproduce.trim() || undefined,
      });

      apexToast.success('Bug report submitted');
      logger.info('Bug report created:', result.issueUrl);
      close();
    } catch (error) {
      logger.error('Bug report submission failed:', error);
      apexToast.error(
        error instanceof Error ? error.message : 'Failed to submit bug report',
        {
          action: {
            label: 'Retry',
            onClick: () => {
              void handleSubmit(new Event('submit') as unknown as React.FormEvent);
            },
          },
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      modal={false}
      onOpenChange={(open) => !open && !isSubmitting && close()}
    >
      <DialogContent
        onInteractOutside={(event) => {
          if (isSubmitting) {
            event.preventDefault();
            return;
          }
          const target = event.target as HTMLElement;
          if (target.closest('[data-devtools-button]')) {
            event.preventDefault();
          }
        }}
        className="flex flex-col max-h-[85vh]"
      >
        {/* Header - same structure as ShareModal */}
        <div className="flex items-center justify-between border-b border-apex-white/10 p-6 shrink-0">
          <DialogHeader>
            <DialogTitle>Bug Report</DialogTitle>
            <DialogDescription className="sr-only">
              Report a bug with automatic environment and log information.
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <motion.button
              onClick={close}
              disabled={isSubmitting}
              className="p-2 text-apex-white/60 hover:text-apex-white transition-colors disabled:opacity-50"
              {...buttonHoverProps}
            >
              <X size={20} />
            </motion.button>
          </DialogClose>
        </div>

        {/* Scrollable form body - padding matches ShareModal content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain px-6 pt-6 pr-5"
          style={{
            paddingBottom: isKeyboardVisible ? `${keyboardPadding + 16}px` : undefined,
          }}
        >
          <form ref={formRef} onSubmit={handleSubmit} id="bug-report-form" className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="bug-title" className="block text-xs text-apex-white/60 uppercase tracking-wide mb-2">
                Title <span className="text-apex-red">*</span>
              </label>
              <input
                id="bug-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                disabled={isSubmitting}
                className="w-full px-4 py-2 text-base text-apex-white bg-apex-black border border-apex-white/20 rounded-lg placeholder:text-apex-white/40 focus:outline-none focus:border-apex-green transition-colors disabled:opacity-50"
                maxLength={120}
                autoComplete="off"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="bug-description" className="block text-xs text-apex-white/60 uppercase tracking-wide mb-2">
                Description <span className="text-apex-red">*</span>
              </label>
              <textarea
                id="bug-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? What did you expect to happen?"
                disabled={isSubmitting}
                rows={4}
                className="w-full px-4 py-2 text-base text-apex-white bg-apex-black border border-apex-white/20 rounded-lg placeholder:text-apex-white/40 focus:outline-none focus:border-apex-green transition-colors resize-none disabled:opacity-50"
              />
            </div>

            {/* Steps to Reproduce (optional) */}
            <div>
              <label htmlFor="bug-steps" className="block text-xs text-apex-white/60 uppercase tracking-wide mb-2">
                Steps to Reproduce <span className="text-apex-white/30 normal-case">(optional)</span>
              </label>
              <textarea
                id="bug-steps"
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder={"1. Go to...\n2. Tap on...\n3. See error"}
                disabled={isSubmitting}
                rows={3}
                className="w-full px-4 py-2 text-base text-apex-white bg-apex-black border border-apex-white/20 rounded-lg placeholder:text-apex-white/40 focus:outline-none focus:border-apex-green transition-colors resize-none disabled:opacity-50"
              />
            </div>

            {/* Auto-attach note - secondary text per typography rules */}
            <p className="text-xs text-apex-white/60">
              Device info and recent logs are attached automatically.
            </p>
          </form>
        </div>

        {/* Footer - same padding as ShareModal actions */}
        <DialogFooter className="px-6 pb-6 pt-5 border-t border-apex-white/10">
          <Button asChild>
            <motion.button
              type="submit"
              form="bug-report-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 w-full justify-center"
              {...(isSubmitting ? {} : buttonHoverProps)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Bug size={18} />
                  Submit Bug Report
                </>
              )}
            </motion.button>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

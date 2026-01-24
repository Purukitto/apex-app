import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonHoverProps } from '../lib/animations';
import type { ReactNode } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
  disabled?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  disabled = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const variantStyles = {
    danger: {
      button: 'bg-apex-red text-apex-white hover:bg-apex-red/90',
      icon: 'text-apex-red',
    },
    warning: {
      button: 'bg-apex-green text-apex-black hover:bg-apex-green/90',
      icon: 'text-apex-green',
    },
    default: {
      button: 'bg-apex-green text-apex-black hover:bg-apex-green/90',
      icon: 'text-apex-green',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm z-[1000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div 
            className="fixed inset-0 z-[1001] flex items-center justify-center"
            style={{
              padding: '1rem',
              paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))`,
              paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0px))`,
              paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
              paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
            }}
          >
            <motion.div
              className="bg-apex-black border border-apex-white/20 rounded-lg p-6 w-full max-w-md relative z-[1001]"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-apex-white/60 hover:text-apex-white transition-colors"
                aria-label="Close"
                {...buttonHoverProps}
              >
                <X size={20} />
              </motion.button>

              {/* Content */}
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-2 rounded-lg flex-shrink-0 ${variant === 'danger' ? 'bg-apex-red/10' : 'bg-apex-green/10'}`}>
                  <AlertTriangle size={24} className={styles.icon} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-apex-white mb-2">
                    {title}
                  </h3>
                  {typeof message === 'string' ? (
                    <p className="text-sm text-apex-white/60">
                      {message}
                    </p>
                  ) : (
                    <div className="text-sm text-apex-white/60">
                      {message}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <motion.button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-apex-white/60 hover:text-apex-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  {...(isLoading ? {} : buttonHoverProps)}
                >
                  {cancelLabel}
                </motion.button>
                <motion.button
                  onClick={handleConfirm}
                  disabled={isLoading || disabled}
                  className={`px-4 py-2 text-base font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
                  {...(isLoading || disabled ? {} : buttonHoverProps)}
                >
                  {isLoading ? 'Processing...' : confirmLabel}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

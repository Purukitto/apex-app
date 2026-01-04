import { toast } from 'sonner';

/**
 * Apex-styled toast notifications
 * Ensures all toasts follow the high-contrast apex-green or red-500 color scheme
 */

export const apexToast = {
  success: (message: string) => {
    return toast.success(message, {
      className: 'apex-toast-success',
      style: {
        background: '#0A0A0A',
        border: '1px solid #00FF41',
        color: '#E2E2E2',
      },
    });
  },
  error: (message: string) => {
    return toast.error(message, {
      className: 'apex-toast-error',
      style: {
        background: '#0A0A0A',
        border: '1px solid #FF3B30',
        color: '#E2E2E2',
      },
    });
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      className: 'apex-toast-promise',
      style: {
        background: '#0A0A0A',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#E2E2E2',
      },
    });
  },
};


import { toast } from 'sonner';

/**
 * Apex-styled toast notifications
 * Ensures all toasts follow the high-contrast apex-green or red-500 color scheme
 */

/**
 * Truncate error message to prevent toast overflow
 */
const truncateMessage = (message: string, maxLength: number = 100): string => {
  if (message.length <= maxLength) {
    return message;
  }
  // Try to truncate at a word boundary
  const truncated = message.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }
  return truncated + '...';
};

export const apexToast = {
  success: (message: string) => {
    return toast.success(message, {
      className: 'apex-toast-success',
      style: {
        background: '#0A0A0A',
        border: '1px solid var(--color-apex-green, #00FF41)',
        color: '#E2E2E2',
      },
      duration: 3000,
    });
  },
  error: (message: string) => {
    // Truncate long error messages to prevent UI overflow
    const truncatedMessage = truncateMessage(message, 120);
    return toast.error(truncatedMessage, {
      className: 'apex-toast-error',
      style: {
        background: '#0A0A0A',
        border: '1px solid #FF3B30',
        color: '#E2E2E2',
      },
      duration: 4000,
    });
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
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


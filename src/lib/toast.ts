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
        background: 'var(--color-apex-black, #0A0A0A)',
        border: '1px solid var(--color-apex-green, #3DBF6F)',
        color: 'var(--color-apex-white, #f5f5dc)',
      },
      duration: 3000,
    });
  },
  error: (
    message: string,
    options?: { action?: { label: string; onClick: () => void } }
  ) => {
    // Truncate long error messages to prevent UI overflow
    const truncatedMessage = truncateMessage(message, 120);
    return toast.error(truncatedMessage, {
      className: 'apex-toast-error',
      style: {
        background: 'var(--color-apex-black, #0A0A0A)',
        border: '1px solid var(--color-apex-red, #E35B5B)',
        color: 'var(--color-apex-white, #f5f5dc)',
      },
      action: options?.action,
      duration: 4000,
    });
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
    options?: {
      errorAction?: { label: string; onClick: () => void };
    }
  ) => {
    const toastId = toast.loading(messages.loading, {
      className: 'apex-toast-promise',
      style: {
        background: 'var(--color-apex-black, #0A0A0A)',
        border: '1px solid rgba(226, 226, 226, 0.2)',
        color: 'var(--color-apex-white, #f5f5dc)',
      },
      duration: 3000,
    });

    return promise
      .then((data) => {
        const successMessage =
          typeof messages.success === 'function'
            ? messages.success(data)
            : messages.success;
        toast.success(successMessage, {
          id: toastId,
          className: 'apex-toast-promise',
          style: {
            background: 'var(--color-apex-black, #0A0A0A)',
            border: '1px solid rgba(226, 226, 226, 0.2)',
            color: 'var(--color-apex-white, #f5f5dc)',
          },
          duration: 3000,
        });
        return data;
      })
      .catch((error) => {
        const errorMessage =
          typeof messages.error === 'function'
            ? messages.error(error)
            : messages.error;

        if (options?.errorAction) {
          toast.dismiss(toastId);
          apexToast.error(errorMessage, { action: options.errorAction });
        } else {
          const truncatedMessage = truncateMessage(errorMessage, 120);
          toast.error(truncatedMessage, {
            id: toastId,
            className: 'apex-toast-promise',
            style: {
              background: 'var(--color-apex-black, #0A0A0A)',
              border: '1px solid var(--color-apex-red, #E35B5B)',
              color: 'var(--color-apex-white, #f5f5dc)',
            },
            duration: 4000,
          });
        }

        throw error;
      });
  },
};


/**
 * Devtools utility for in-app DevTools panel
 * Checks if we're in development mode
 */

/**
 * Check if we're in development mode
 * Works for both web (Vite) and Capacitor builds
 */
export const isDev = (): boolean => {
  // Vite provides import.meta.env.DEV in dev mode
  return import.meta.env.DEV;
};

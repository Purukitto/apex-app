/**
 * Devtools utility for in-app DevTools panel
 * Checks if we're in development mode
 */

/**
 * Check if we're in development mode
 * Works for both web (Vite) and Capacitor builds
 * 
 * IMPORTANT: In production builds, Vite sets import.meta.env.DEV to false,
 * ensuring all devtools are completely disabled in release builds.
 * 
 * @returns true if in development mode, false in production
 */
export const isDev = (): boolean => {
  // Vite provides import.meta.env.DEV in dev mode
  // In production builds, this is replaced with false at build time
  return import.meta.env.DEV;
};

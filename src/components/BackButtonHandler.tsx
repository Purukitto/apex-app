import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Handles native back button behavior in Capacitor apps.
 * 
 * On Android: Intercepts hardware back button to navigate within the app
 * On iOS: Handles swipe-back gesture (if needed)
 * 
 * Behavior:
 * - If there's navigation history, navigates back using React Router
 * - If at root route with no history, exits the app (Android only)
 */
export default function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only handle back button on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Define root routes where we might want to exit the app
    const rootRoutes = ['/dashboard', '/garage', '/ride', '/profile', '/login'];
    const isAtRootRoute = rootRoutes.includes(location.pathname);

    let listenerHandle: Awaited<ReturnType<typeof App.addListener>> | null = null;

    // Set up the listener asynchronously
    App.addListener('backButton', ({ canGoBack }) => {
      // Check if we can navigate back in browser history
      // window.history.length > 1 means there's at least one previous entry
      const hasHistory = window.history.length > 1;

      // Prioritize React Router navigation if we have history
      if (canGoBack || hasHistory) {
        // Navigate back using React Router
        navigate(-1);
      } else if (isAtRootRoute) {
        // At root route with no history - exit the app
        // Note: iOS doesn't have a hardware back button, so this is mainly for Android
        App.exitApp();
      } else {
        // Not at root route but no history - navigate to dashboard as fallback
        navigate('/dashboard', { replace: true });
      }
    }).then((handle) => {
      listenerHandle = handle;
    });

    // Cleanup listener on unmount
    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [navigate, location.pathname]);

  // This component doesn't render anything
  return null;
}

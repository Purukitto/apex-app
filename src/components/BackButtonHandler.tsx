import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useRideStore } from '../stores/useRideStore';

/**
 * Handles native back button behavior in Capacitor apps.
 * 
 * On Android: Intercepts hardware back button to navigate within the app
 * On iOS: Handles swipe-back gesture (if needed)
 * 
 * Behavior:
 * - If the current path is NOT /dashboard, navigate to /dashboard (replace: true)
 * - If the current path IS /dashboard, exit the app
 * 
 * This ensures the Back button always brings the user "Home" first, then exits,
 * rather than cycling through random tabs.
 */
export default function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const isRecording = useRideStore((state) => state.isRecording);

  useEffect(() => {
    // Only handle back button on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let listenerHandle: Awaited<ReturnType<typeof App.addListener>> | null = null;
    let isMounted = true;

    // Set up the listener asynchronously
    App.addListener('backButton', () => {
      // Prevent navigation during ride recording (full-screen mode)
      if (isRecording && location.pathname === '/ride') {
        // Do nothing - ride mode is all-consuming
        return;
      }

      // If the current path is NOT /dashboard, navigate to /dashboard (replace: true)
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard', { replace: true });
      } else {
        // If the current path IS /dashboard, exit the app
        App.exitApp();
      }
    }).then((handle) => {
      if (isMounted) {
        listenerHandle = handle;
      } else {
        // Component unmounted before listener was set up, remove it immediately
        handle.remove();
      }
    });

    // Cleanup listener on unmount
    return () => {
      isMounted = false;
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [navigate, location.pathname, isRecording]);

  // This component doesn't render anything
  return null;
}

import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppUpdate } from '../hooks/useAppUpdate';

/**
 * Component that silently checks for app updates on app start
 * Only runs on native platforms (iOS/Android)
 */
export default function AppUpdateChecker() {
  const { checkForUpdate } = useAppUpdate();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Only check once on mount
    if (hasCheckedRef.current) {
      return;
    }

    hasCheckedRef.current = true;

    // Defer the check slightly to ensure app is fully initialized
    const timerId = setTimeout(() => {
      checkForUpdate(false).catch((error) => {
        // Silently fail - don't show errors for background checks
        console.log('Background update check failed:', error);
      });
    }, 500); // Small delay to ensure app is ready

    return () => clearTimeout(timerId);
  }, [checkForUpdate]);

  // This component doesn't render anything
  return null;
}

import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { logger } from '../lib/logger';

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
      // Pass true for showModalOnUpdate to automatically show modal when update is found
      checkForUpdate(false, true).catch((error) => {
        // Silently fail - don't show errors for background checks
        logger.debug('Background update check failed:', error);
      });
    }, 500); // Small delay to ensure app is ready

    return () => clearTimeout(timerId);
  }, [checkForUpdate]);

  // This component doesn't render anything
  return null;
}

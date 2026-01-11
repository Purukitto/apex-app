import { useEffect } from 'react';
import { useAppUpdate } from '../hooks/useAppUpdate';

/**
 * Component that silently checks for app updates on app start
 * Only runs on native platforms (iOS/Android)
 */
export default function AppUpdateChecker() {
  const { checkForUpdate } = useAppUpdate();

  useEffect(() => {
    // Silently check for updates on app start
    // The hook will handle the timing (once per day) and platform checks
    checkForUpdate(false).catch((error) => {
      // Silently fail - don't show errors for background checks
      console.log('Background update check failed:', error);
    });
  }, [checkForUpdate]);

  // This component doesn't render anything
  return null;
}

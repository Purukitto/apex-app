import packageJson from '../../package.json';

const VERSION_STORAGE_KEY = 'apex-app-version';
const VERSION_BUILD_KEY = 'apex-app-version-build';

/**
 * Initialize version in localStorage on app launch
 * This ensures the version is cached and available for both web and native apps
 * Native apps (Capacitor) have full access to localStorage via the webview
 */
export function initializeVersion(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentVersion = packageJson.version;
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    const buildTimestamp = Date.now().toString();

    // Only update if version changed or not stored
    if (storedVersion !== currentVersion) {
      localStorage.setItem(VERSION_STORAGE_KEY, currentVersion);
      localStorage.setItem(VERSION_BUILD_KEY, buildTimestamp);
      console.log(`[Version] Initialized: ${currentVersion}`);
    }
  } catch (error) {
    console.error('[Version] Failed to initialize version:', error);
  }
}

/**
 * Get the current app version
 * Returns cached version from localStorage if available, otherwise reads from package.json
 * This is efficient and works for both web and native platforms
 */
export function getAppVersion(): string {
  if (typeof window === 'undefined') {
    return packageJson.version;
  }

  try {
    // Try to get from localStorage first (faster, cached)
    const cachedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    if (cachedVersion) {
      return cachedVersion;
    }

    // Fallback to package.json if not in localStorage
    const version = packageJson.version;
    // Cache it for next time
    localStorage.setItem(VERSION_STORAGE_KEY, version);
    return version;
  } catch (error) {
    console.error('[Version] Failed to get version, using package.json:', error);
    // Fallback to package.json on error
    return packageJson.version;
  }
}

/**
 * Get the build timestamp when the version was initialized
 * Useful for debugging or showing when the app was built
 */
export function getBuildTimestamp(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const timestamp = localStorage.getItem(VERSION_BUILD_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('[Version] Failed to get build timestamp:', error);
    return null;
  }
}

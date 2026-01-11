import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Browser } from '@capacitor/browser';
import { getAppVersion } from '../lib/version';

const GITHUB_REPO = 'Purukitto/apex-app';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LAST_CHECK_KEY = 'app_update_last_check';
const LAST_VERSION_KEY = 'app_update_last_version';

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

export interface UpdateInfo {
  isAvailable: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseNotes: string;
  releaseUrl: string;
  downloadUrl?: string;
}

/**
 * Compares two semantic version strings
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  // Remove 'v' prefix if present
  const cleanV1 = v1.replace(/^v/, '');
  const cleanV2 = v2.replace(/^v/, '');
  
  const parts1 = cleanV1.split('.').map(Number);
  const parts2 = cleanV2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

/**
 * Fetches the latest release from GitHub
 */
async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch GitHub release:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data as GitHubRelease;
  } catch (error) {
    console.error('Error fetching GitHub release:', error);
    return null;
  }
}

/**
 * Gets stored last check timestamp
 */
async function getLastCheckTime(): Promise<number | null> {
  if (!Capacitor.isNativePlatform()) {
    const stored = localStorage.getItem(LAST_CHECK_KEY);
    return stored ? parseInt(stored, 10) : null;
  }

  try {
    const { value } = await Preferences.get({ key: LAST_CHECK_KEY });
    return value ? parseInt(value, 10) : null;
  } catch (error) {
    console.error('Error reading last check time:', error);
    return null;
  }
}

/**
 * Stores last check timestamp
 */
async function setLastCheckTime(timestamp: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(LAST_CHECK_KEY, timestamp.toString());
    return;
  }

  try {
    await Preferences.set({ key: LAST_CHECK_KEY, value: timestamp.toString() });
  } catch (error) {
    console.error('Error storing last check time:', error);
  }
}

/**
 * Gets stored last version that was shown to user
 */
async function getLastShownVersion(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return localStorage.getItem(LAST_VERSION_KEY);
  }

  try {
    const { value } = await Preferences.get({ key: LAST_VERSION_KEY });
    return value || null;
  } catch (error) {
    console.error('Error reading last shown version:', error);
    return null;
  }
}

/**
 * Stores last version that was shown to user
 */
async function setLastShownVersion(version: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(LAST_VERSION_KEY, version);
    return;
  }

  try {
    await Preferences.set({ key: LAST_VERSION_KEY, value: version });
  } catch (error) {
    console.error('Error storing last shown version:', error);
  }
}

/**
 * Hook for checking app updates from GitHub releases
 * Only runs on native platforms (iOS/Android)
 */
export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedOnMount = useRef(false);

  const checkForUpdate = useCallback(async (force = false): Promise<UpdateInfo | null> => {
    // Only check on native platforms
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    setIsChecking(true);
    setError(null);

    try {
      // Check if we should skip (not forced and checked recently)
      if (!force) {
        const lastCheck = await getLastCheckTime();
        const now = Date.now();
        
        if (lastCheck && (now - lastCheck) < CHECK_INTERVAL_MS) {
          console.log('Update check skipped - checked recently');
          setIsChecking(false);
          return null;
        }
      }

      // Fetch latest release
      const release = await fetchLatestRelease();
      
      if (!release) {
        setError('Failed to fetch release information');
        setIsChecking(false);
        return null;
      }

      // Compare versions
      const latestVersion = release.tag_name;
      const currentVersion = getAppVersion();
      const versionComparison = compareVersions(latestVersion, currentVersion);
      const hasUpdate = versionComparison > 0;

      console.log(`Update check: Current=${currentVersion}, Latest=${latestVersion}, Comparison=${versionComparison}, HasUpdate=${hasUpdate}`);

      // Check if we've already shown this version
      const lastShown = await getLastShownVersion();
      if (lastShown === latestVersion && !force) {
        console.log('Update already shown for this version');
        setIsChecking(false);
        return null;
      }

      // Store check time
      await setLastCheckTime(Date.now());

      if (hasUpdate) {
        // Find download URL for current platform
        const platform = Capacitor.getPlatform();
        let downloadUrl: string | undefined;
        
        // Look for platform-specific assets
        const platformAsset = release.assets.find(asset => {
          const name = asset.name.toLowerCase();
          if (platform === 'android') {
            return name.includes('.apk') || name.includes('android');
          }
          if (platform === 'ios') {
            return name.includes('.ipa') || name.includes('ios');
          }
          return false;
        });

        if (platformAsset) {
          downloadUrl = platformAsset.browser_download_url;
        }

        const info: UpdateInfo = {
          isAvailable: true,
          latestVersion,
          currentVersion: getAppVersion(),
          releaseNotes: release.body || 'No release notes available.',
          releaseUrl: release.html_url,
          downloadUrl,
        };

        setUpdateInfo(info);
        setIsChecking(false);
        return info;
      } else {
        // No update available
        const currentVersion = getAppVersion();
        console.log(`No update available. Current version (${currentVersion}) is up to date with latest (${latestVersion})`);
        setIsChecking(false);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error checking for updates:', err);
      setIsChecking(false);
      return null;
    }
  }, []);

  const openReleasePage = useCallback(async () => {
    if (!updateInfo?.releaseUrl) return;

    try {
      await Browser.open({ url: updateInfo.releaseUrl });
    } catch (error) {
      console.error('Error opening browser:', error);
    }
  }, [updateInfo]);

  const dismissUpdate = useCallback(async () => {
    if (updateInfo?.latestVersion) {
      await setLastShownVersion(updateInfo.latestVersion);
    }
    setUpdateInfo(null);
  }, [updateInfo]);

  // Auto-check on mount (only on native platforms)
  useEffect(() => {
    if (Capacitor.isNativePlatform() && !hasCheckedOnMount.current) {
      hasCheckedOnMount.current = true;
      // Defer the check to avoid calling setState synchronously in effect
      const timerId = setTimeout(() => {
        checkForUpdate(false).catch((error) => {
          // Silently fail for background checks
          console.log('Background update check failed:', error);
        });
      }, 0);
      
      return () => clearTimeout(timerId);
    }
  }, [checkForUpdate]);

  return {
    updateInfo,
    isChecking,
    error,
    checkForUpdate,
    openReleasePage,
    dismissUpdate,
  };
}

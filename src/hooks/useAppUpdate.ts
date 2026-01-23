import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Browser } from '@capacitor/browser';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileTransfer } from '@capacitor/file-transfer';
import { FileOpener } from '@capacitor-community/file-opener';
import type { PluginListenerHandle } from '@capacitor/core';
import { getAppVersion } from '../lib/version';
import { useAppUpdateStore } from '../stores/useAppUpdateStore';
import { logger } from '../lib/logger';
import { apexToast } from '../lib/toast';

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

const APK_MIME_TYPE = 'application/vnd.android.package-archive';

const getApkFileName = (downloadUrl: string, latestVersion: string): string => {
  try {
    const url = new URL(downloadUrl);
    const lastSegment = url.pathname.split('/').pop();
    if (lastSegment && lastSegment.endsWith('.apk')) {
      return lastSegment;
    }
  } catch {
    // Ignore URL parsing errors, fallback below
  }
  const cleanVersion = latestVersion.replace(/^v/, '');
  return `apex-${cleanVersion}.apk`;
};

const getDownloadUrlForPlatform = (
  release: GitHubRelease,
  platform: string
): string | undefined => {
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

  return platformAsset?.browser_download_url;
};

const createUpdateInfo = (release: GitHubRelease): UpdateInfo => {
  const platform = Capacitor.getPlatform();
  return {
    isAvailable: true,
    latestVersion: release.tag_name,
    currentVersion: getAppVersion(),
    releaseNotes: release.body || 'No release notes available.',
    releaseUrl: release.html_url,
    downloadUrl: getDownloadUrlForPlatform(release, platform),
  };
};

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
      logger.error('Failed to fetch GitHub release:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data as GitHubRelease;
  } catch (error) {
    logger.error('Error fetching GitHub release:', error);
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
    logger.error('Error reading last check time:', error);
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
    logger.error('Error storing last check time:', error);
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
    logger.error('Error reading last shown version:', error);
    return null;
  }
}

/**
 * Stores last version that was shown to user
 */
export async function setLastShownVersion(version: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(LAST_VERSION_KEY, version);
    return;
  }

  try {
    await Preferences.set({ key: LAST_VERSION_KEY, value: version });
  } catch (error) {
    logger.error('Error storing last shown version:', error);
  }
}

/**
 * Hook for checking app updates from GitHub releases
 * Only runs on native platforms (iOS/Android)
 */
export function useAppUpdate() {
  const {
    updateInfo,
    isChecking,
    error,
    hasCheckedNoUpdate,
    setUpdateInfo,
    setIsChecking,
    setError,
    setShowModal,
    setHasCheckedNoUpdate,
  } = useAppUpdateStore();

  const checkForUpdate = useCallback(async (force = false, showModalOnUpdate = false): Promise<UpdateInfo | null> => {
    // Only check on native platforms
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    setIsChecking(true);
    setError(null);
    setHasCheckedNoUpdate(false);

    try {
      // For auto-checks (showModalOnUpdate=true), always check for new versions
      // but still respect the "already shown" check
      // For manual checks (force=true), bypass all checks
      // For other cases, respect the 24h interval
      const shouldSkipTimeCheck = force || showModalOnUpdate;
      
      if (!shouldSkipTimeCheck) {
        const lastCheck = await getLastCheckTime();
        const now = Date.now();
        
        if (lastCheck && (now - lastCheck) < CHECK_INTERVAL_MS) {
          logger.debug('Update check skipped - checked recently');
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

      logger.debug(`Update check: Current=${currentVersion}, Latest=${latestVersion}, Comparison=${versionComparison}, HasUpdate=${hasUpdate}`);

      // Check if we've already shown this version (only skip if not forced and already shown)
      const lastShown = await getLastShownVersion();
      if (lastShown === latestVersion && !force) {
        logger.debug('Update already shown for this version');
        setIsChecking(false);
        return null;
      }

      // Store check time
      await setLastCheckTime(Date.now());

      if (hasUpdate) {
        const info = createUpdateInfo(release);

        setUpdateInfo(info);
        setIsChecking(false);
        setHasCheckedNoUpdate(false);
        
        // Show modal if requested (for auto-checks)
        if (showModalOnUpdate) {
          setShowModal(true);
        }
        
        return info;
      } else {
        // No update available
        const currentVersion = getAppVersion();
        logger.debug(`No update available. Current version (${currentVersion}) is up to date with latest (${latestVersion})`);
        setIsChecking(false);
        setHasCheckedNoUpdate(true);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Error checking for updates:', err);
      setIsChecking(false);
      return null;
    }
  }, [setError, setIsChecking, setShowModal, setUpdateInfo, setHasCheckedNoUpdate]);

  const openReleasePage = useCallback(async () => {
    const currentUpdateInfo = useAppUpdateStore.getState().updateInfo;
    if (!currentUpdateInfo?.releaseUrl) return;

    try {
      await Browser.open({ url: currentUpdateInfo.releaseUrl });
    } catch (error) {
      logger.error('Error opening browser:', error);
    }
  }, []);

  const getLatestReleaseInfo = useCallback(async (): Promise<UpdateInfo | null> => {
    const release = await fetchLatestRelease();
    if (!release) return null;
    return createUpdateInfo(release);
  }, []);

  const deleteDownloadedApk = async () => {
    const { lastDownloadedPath: downloadedPath, setLastDownloadedPath: setPath } = useAppUpdateStore.getState();
    if (!downloadedPath) return;

    try {
      await Filesystem.deleteFile({ path: downloadedPath });
      setPath(null);
      apexToast.success('APK removed');
    } catch (error) {
      logger.error('Failed to delete APK:', error);
      apexToast.error('Could not remove APK');
    }
  };

  const runDownloadUpdate = async (): Promise<void> => {
    const {
      updateInfo: currentUpdateInfo,
      setDownloadProgress,
      setDownloadState,
      resetDownload,
      lastDownloadedPath,
      setLastDownloadedPath,
    } = useAppUpdateStore.getState();

    if (!currentUpdateInfo?.downloadUrl) {
      await openReleasePage();
      return;
    }

    if (Capacitor.getPlatform() !== 'android') {
      await openReleasePage();
      return;
    }

    let progressHandle: PluginListenerHandle | null = null;

    try {
      if (lastDownloadedPath) {
        try {
          await Filesystem.deleteFile({ path: lastDownloadedPath });
        } catch (cleanupError) {
          logger.warn('Failed to remove previous APK:', cleanupError);
        }
        setLastDownloadedPath(null);
      }

      setDownloadState('downloading');
      setDownloadProgress(0);

      const fileName = getApkFileName(currentUpdateInfo.downloadUrl, currentUpdateInfo.latestVersion);
      const filePath = `updates/${fileName}`;

      const targetDirectory = Capacitor.getPlatform() === 'android'
        ? Directory.ExternalCache
        : Directory.Cache;

      const { uri } = await Filesystem.getUri({
        path: filePath,
        directory: targetDirectory,
      });

      progressHandle = await FileTransfer.addListener('progress', (progress) => {
        if (!progress.contentLength) {
          return;
        }
        const percent = Math.min(
          100,
          Math.max(0, Math.round((progress.bytes / progress.contentLength) * 100))
        );
        setDownloadProgress(percent);
      });

      const downloadResult = await FileTransfer.downloadFile({
        url: currentUpdateInfo.downloadUrl,
        path: uri,
        progress: true,
      });

      await progressHandle.remove();
      progressHandle = null;
      setDownloadProgress(100);

      setDownloadState('installing');
      const installerPath = downloadResult.path || uri;
      logger.debug('APK downloaded to:', installerPath);
      setLastDownloadedPath(installerPath);
      await FileOpener.open({
        filePath: installerPath,
        contentType: APK_MIME_TYPE,
        openWithDefault: true,
      });

      resetDownload();
      apexToast.success('Installer opened');
    } catch (error) {
      if (progressHandle) {
        await progressHandle.remove();
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Update download failed:', errorMessage, error);
      resetDownload();
      apexToast.error('Update failed. Please try again.', {
        action: { label: 'Retry', onClick: () => { void runDownloadUpdate(); } },
      });
    }
  };

  const downloadUpdate = async () => {
    await runDownloadUpdate();
  };

  const dismissUpdate = useCallback(async () => {
    const currentUpdateInfo = useAppUpdateStore.getState().updateInfo;
    if (currentUpdateInfo?.latestVersion) {
      await setLastShownVersion(currentUpdateInfo.latestVersion);
    }
    useAppUpdateStore.getState().setUpdateInfo(null);
    useAppUpdateStore.getState().setShowModal(false);
  }, []);

  // Note: Auto-check on mount is handled by AppUpdateChecker component
  // This hook only provides the checkForUpdate function

  return {
    updateInfo,
    isChecking,
    error,
    hasCheckedNoUpdate,
    checkForUpdate,
    getLatestReleaseInfo,
    downloadUpdate,
    deleteDownloadedApk,
    openReleasePage,
    dismissUpdate,
  };
}

import { create } from 'zustand';
import type { UpdateInfo } from '../hooks/useAppUpdate';
import { setLastShownVersion } from '../hooks/useAppUpdate';

interface AppUpdateStore {
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  error: string | null;
  showModal: boolean;
  hasCheckedNoUpdate: boolean;
  downloadState: 'idle' | 'downloading' | 'installing';
  downloadProgress: number;
  lastDownloadedPath: string | null;
  setUpdateInfo: (info: UpdateInfo | null) => void;
  setIsChecking: (checking: boolean) => void;
  setError: (error: string | null) => void;
  setShowModal: (show: boolean) => void;
  setHasCheckedNoUpdate: (checked: boolean) => void;
  setDownloadState: (state: 'idle' | 'downloading' | 'installing') => void;
  setDownloadProgress: (progress: number) => void;
  setLastDownloadedPath: (path: string | null) => void;
  resetDownload: () => void;
  dismissUpdate: () => void;
}

export const useAppUpdateStore = create<AppUpdateStore>((set, get) => ({
  updateInfo: null,
  isChecking: false,
  error: null,
  showModal: false,
  hasCheckedNoUpdate: false,
  downloadState: 'idle',
  downloadProgress: 0,
  lastDownloadedPath: null,

  setUpdateInfo: (info) => set({ updateInfo: info }),
  setIsChecking: (checking) => set({ isChecking: checking }),
  setError: (error) => set({ error }),
  setShowModal: (show) => set({ showModal: show }),
  setHasCheckedNoUpdate: (checked) => set({ hasCheckedNoUpdate: checked }),
  setDownloadState: (state) => set({ downloadState: state }),
  setDownloadProgress: (progress) => set({ downloadProgress: progress }),
  setLastDownloadedPath: (path) => set({ lastDownloadedPath: path }),
  resetDownload: () => set({ downloadState: 'idle', downloadProgress: 0 }),
  
  dismissUpdate: async () => {
    const { updateInfo } = get();
    if (updateInfo?.latestVersion) {
      await setLastShownVersion(updateInfo.latestVersion);
    }
    set({ showModal: false });
  },
}));

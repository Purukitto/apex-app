import { create } from 'zustand';
import type { UpdateInfo } from '../hooks/useAppUpdate';
import { setLastShownVersion } from '../hooks/useAppUpdate';

interface AppUpdateStore {
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  error: string | null;
  showModal: boolean;
  hasCheckedNoUpdate: boolean;
  setUpdateInfo: (info: UpdateInfo | null) => void;
  setIsChecking: (checking: boolean) => void;
  setError: (error: string | null) => void;
  setShowModal: (show: boolean) => void;
  setHasCheckedNoUpdate: (checked: boolean) => void;
  dismissUpdate: () => void;
}

export const useAppUpdateStore = create<AppUpdateStore>((set, get) => ({
  updateInfo: null,
  isChecking: false,
  error: null,
  showModal: false,
  hasCheckedNoUpdate: false,

  setUpdateInfo: (info) => set({ updateInfo: info }),
  setIsChecking: (checking) => set({ isChecking: checking }),
  setError: (error) => set({ error }),
  setShowModal: (show) => set({ showModal: show }),
  setHasCheckedNoUpdate: (checked) => set({ hasCheckedNoUpdate: checked }),
  
  dismissUpdate: async () => {
    const { updateInfo } = get();
    if (updateInfo?.latestVersion) {
      await setLastShownVersion(updateInfo.latestVersion);
    }
    set({ showModal: false });
  },
}));

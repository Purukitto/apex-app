import { create } from 'zustand';
import { logger } from '../lib/logger';

export interface DiscordRpcPreferences {
  enabled: boolean;
  shareRideStatus: boolean;
  shareBikeName: boolean;
  shareCity: boolean;
  rpcToken: string;
}

interface DiscordRpcStore extends DiscordRpcPreferences {
  setEnabled: (enabled: boolean) => void;
  setShareRideStatus: (shareRideStatus: boolean) => void;
  setShareBikeName: (shareBikeName: boolean) => void;
  setShareCity: (shareCity: boolean) => void;
  setRpcToken: (rpcToken: string) => void;
}

const STORAGE_KEY = 'apex-discord-rpc-settings';

const defaultPreferences: DiscordRpcPreferences = {
  enabled: false,
  shareRideStatus: true,
  shareBikeName: true,
  shareCity: false,
  rpcToken: '',
};

const loadPreferences = (): Partial<DiscordRpcPreferences> => {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as DiscordRpcPreferences;
    }
  } catch (error) {
    logger.error('Failed to load Discord RPC preferences:', error);
  }
  return {};
};

const savePreferences = (state: DiscordRpcPreferences) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    logger.error('Failed to save Discord RPC preferences:', error);
  }
};

const initialPreferences = { ...defaultPreferences, ...loadPreferences() };

const buildPreferences = (state: DiscordRpcStore): DiscordRpcPreferences => ({
  enabled: state.enabled,
  shareRideStatus: state.shareRideStatus,
  shareBikeName: state.shareBikeName,
  shareCity: state.shareCity,
  rpcToken: state.rpcToken,
});

export const useDiscordRpcStore = create<DiscordRpcStore>((set, get) => ({
  ...initialPreferences,
  setEnabled: (enabled) => {
    set({ enabled });
    savePreferences(buildPreferences(get()));
  },
  setShareRideStatus: (shareRideStatus) => {
    set({ shareRideStatus });
    savePreferences(buildPreferences(get()));
  },
  setShareBikeName: (shareBikeName) => {
    set({ shareBikeName });
    savePreferences(buildPreferences(get()));
  },
  setShareCity: (shareCity) => {
    set({ shareCity });
    savePreferences(buildPreferences(get()));
  },
  setRpcToken: (rpcToken) => {
    set({ rpcToken });
    savePreferences(buildPreferences(get()));
  },
}));

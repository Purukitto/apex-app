import { create } from 'zustand';
import { logger } from '../lib/logger';

export type BackgroundTheme = 'apex-black' | 'pure-black';
export type PrimaryTheme = 'apex-green' | 'cyan' | 'orange' | 'amber';

interface ThemeStore {
  background: BackgroundTheme;
  primary: PrimaryTheme;
  setBackground: (background: BackgroundTheme) => void;
  setPrimary: (primary: PrimaryTheme) => void;
}

// Theme color definitions
export const PRIMARY_COLORS: Record<PrimaryTheme, string> = {
  'apex-green': '#3DBF6F',
  'cyan': '#2DA8C7',
  'orange': '#E08A4C',
  'amber': '#D9B85B',
};

export const BACKGROUND_COLORS: Record<BackgroundTheme, string> = {
  'apex-black': '#0A0A0A',
  'pure-black': '#000000',
};

const STORAGE_KEY = 'apex-theme-storage';

// Load from localStorage
const loadTheme = (): Partial<ThemeStore> => {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const theme = JSON.parse(stored);
      // Migrate "current" to "apex-black" for existing users
      if (theme.background === 'current') {
        theme.background = 'apex-black';
      }
      // Migrate "purple" to "apex-green" for existing users
      if (theme.primary === 'purple') {
        theme.primary = 'apex-green';
      }
      return theme;
    }
  } catch (error) {
    logger.error('Failed to load theme from localStorage:', error);
  }
  return {};
};

// Save to localStorage
const saveTheme = (state: Partial<ThemeStore>) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    logger.error('Failed to save theme to localStorage:', error);
  }
};

const initialTheme = loadTheme();

export const useThemeStore = create<ThemeStore>((set, get) => ({
  background: initialTheme.background || 'apex-black',
  primary: initialTheme.primary || 'apex-green',
  setBackground: (background) => {
    set({ background });
    saveTheme({ background, primary: get().primary });
  },
  setPrimary: (primary) => {
    set({ primary });
    saveTheme({ background: get().background, primary });
  },
}));

import { useThemeStore, PRIMARY_COLORS, BACKGROUND_COLORS } from '../stores/useThemeStore';

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [61, 191, 111]; // Default to apex-green
};

/**
 * Convert RGB to hex
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

/**
 * Generate a darker highlight color from the primary color
 * Decreases brightness by mixing with black
 */
const generateHighlightColor = (primaryColor: string): string => {
  const [r, g, b] = hexToRgb(primaryColor);
  
  // Mix with black (0, 0, 0) at 40% to create a darker highlight
  // This creates a darker, more muted version for hover states
  const highlightR = Math.round(r * 0.6);
  const highlightG = Math.round(g * 0.6);
  const highlightB = Math.round(b * 0.6);
  
  return rgbToHex(highlightR, highlightG, highlightB);
};

/**
 * Apply theme colors to CSS variables on the document root
 * This should be called whenever theme changes
 */
export const applyTheme = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const state = useThemeStore.getState();
  const root = document.documentElement;

  // Apply background color
  const bgColor = BACKGROUND_COLORS[state.background];
  root.style.setProperty('--color-apex-black', bgColor);

  // Apply primary color (replaces apex-green in theme)
  const primaryColor = PRIMARY_COLORS[state.primary];
  root.style.setProperty('--color-apex-green', primaryColor);

  // Generate and apply highlight color (lighter shade of primary)
  const highlightColor = generateHighlightColor(primaryColor);
  root.style.setProperty('--color-apex-green-highlight', highlightColor);

  // Also update body background if needed
  document.body.style.backgroundColor = bgColor;
};

/**
 * Initialize theme on app startup
 */
export const initializeTheme = () => {
  // Apply theme immediately on startup
  applyTheme();
  
  // Subscribe to theme changes - apply theme whenever store updates
  useThemeStore.subscribe(() => {
    applyTheme();
  });
};

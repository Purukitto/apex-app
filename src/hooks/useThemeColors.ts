import { useEffect, useState } from 'react';

/**
 * Hook to get current theme colors as computed values
 * Useful for framer-motion and inline styles that need actual color values
 */
export const useThemeColors = () => {
  const [colors, setColors] = useState({
    primary: '#3DBF6F',
    highlight: 'rgba(36, 112, 72, 0.4)',
  });

  useEffect(() => {
    const updateColors = () => {
      if (typeof window === 'undefined') return;

      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      const primary = computedStyle.getPropertyValue('--color-apex-green').trim() || '#3DBF6F';
      const highlightHex = computedStyle.getPropertyValue('--color-apex-green-highlight').trim() || '#247048';
      
      // Convert highlight hex to rgba with 0.4 opacity
      const hex = highlightHex.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const highlight = `rgba(${r}, ${g}, ${b}, 0.4)`;

      setColors({ primary, highlight });
    };

    // Update on mount
    updateColors();

    // Subscribe to theme changes by watching for CSS variable changes
    // We'll use a MutationObserver to watch for style changes
    const observer = new MutationObserver(updateColors);
    const root = document.documentElement;
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['style'],
    });

    // Also check periodically in case theme changes via other means
    const interval = setInterval(updateColors, 100);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return colors;
};

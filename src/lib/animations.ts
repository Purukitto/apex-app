import type { Variants } from 'framer-motion';

/**
 * Standard animation variants for Apex app
 * Use these across all pages and components for consistent animations
 */

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const fastItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/**
 * Get current theme highlight color from CSS variable
 * Returns rgba string for use in framer-motion
 */
const getThemeHighlightColor = (): string => {
  if (typeof window === 'undefined') {
    // Default darker shade of apex-green (60% brightness)
    return 'rgba(36, 112, 72, 0.4)';
  }
  
  const root = document.documentElement;
  const highlightColor = getComputedStyle(root)
    .getPropertyValue('--color-apex-green-highlight')
    .trim();
  
  if (!highlightColor) {
    // Fallback to darker shade of apex-green (60% brightness)
    return 'rgba(36, 112, 72, 0.4)';
  }
  
  // Convert hex to rgba with 0.4 opacity
  const hex = highlightColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, 0.4)`;
};

/**
 * Standard button animation props
 */
export const buttonHoverProps = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
};

/**
 * Standard card hover props - uses theme highlight color
 * This is a function to get fresh color on each render
 */
export const getCardHoverProps = () => ({
  whileHover: { borderColor: getThemeHighlightColor() },
});

/**
 * Legacy cardHoverProps for backward compatibility
 * @deprecated Use getCardHoverProps() instead for theme-aware hover
 */
export const cardHoverProps = getCardHoverProps();

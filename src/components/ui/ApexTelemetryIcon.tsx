import { motion } from 'framer-motion';
import { useRideTracking } from '../../hooks/useRideTracking';
import { useThemeColors } from '../../hooks/useThemeColors';

interface ApexTelemetryIconProps {
  size?: number;
  className?: string;
  static?: boolean; // If true, use as static logo without tracking animations
}

/**
 * ApexTelemetryIcon - Technical trace design with live lean animation
 * 
 * Features:
 * - Rotates based on currentLean from useRideTracking (when static=false)
 * - Path color transitions: green (< 15°), red (> 35°) with glow
 * - Apex Dot pulses at 1Hz when recording
 * - Sharp geometric ends (stroke-linecap="square")
 * - Uses theme colors from CSS variables (apex-green, apex-red, apex-black)
 * - Optimized for visibility at small sizes with responsive stroke width and dot size
 */
export default function ApexTelemetryIcon({ 
  size = 120, 
  className = '',
  static: isStatic = false,
}: ApexTelemetryIconProps) {
  const tracking = useRideTracking();
  const { primary } = useThemeColors();
  
  // Only use tracking values if not in static mode
  const currentLean = isStatic ? 0 : tracking.currentLean;
  const isRecording = isStatic ? false : tracking.isRecording;

  // Get theme colors - use reactive hook for primary, read others from CSS variables
  const getThemeColors = () => {
    if (typeof window === 'undefined') {
      return {
        green: 'var(--color-apex-green)',
        red: 'var(--color-apex-red)',
        black: 'var(--color-apex-black)',
      };
    }
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    return {
      green: primary, // Use reactive primary color from hook
      red: computedStyle.getPropertyValue('--color-apex-red').trim() || 'var(--color-apex-red)',
      black: computedStyle.getPropertyValue('--color-apex-black').trim() || 'var(--color-apex-black)',
    };
  };
  
  const themeColors = getThemeColors();

  // Determine path color based on lean angle (only when not static)
  // < 15°: green, > 35°: red
  const pathColor = isStatic
    ? themeColors.green // Static mode: always green
    : currentLean < 15 
    ? themeColors.green // green for safe lean angles
    : currentLean > 35 
    ? themeColors.red // red for aggressive lean angles
    : themeColors.green; // Default to green for intermediate angles

  // Determine if we should show glow on the dot (when lean > 35°)
  const showGlow = !isStatic && currentLean > 35;

  // Responsive sizing for visibility at small sizes
  // Scale stroke width and dot size based on icon size
  const strokeWidth = Math.max(2.5, size / 40); // Minimum 2.5, scales with size
  const dotRadius = Math.max(3.5, size / 30); // Minimum 3.5, scales with size
  const backgroundBorderWidth = size < 40 ? 0.5 : 0; // Subtle border for very small sizes

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      animate={
        isStatic
          ? {} // No rotation in static mode
          : {
              rotate: currentLean, // Rotate based on lean angle
            }
      }
      transition={
        isStatic
          ? {}
          : {
              type: 'spring',
              stiffness: 120,
              damping: 25,
            }
      }
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Rounded background - always visible for contrast */}
        <rect
          width="120"
          height="120"
          rx="24"
          fill={themeColors.black}
          stroke={backgroundBorderWidth > 0 ? themeColors.green : 'none'}
          strokeWidth={backgroundBorderWidth}
          strokeOpacity="0.2"
        />

        {/* Racing trajectory path - reused from logo SVG, scaled to 120x120 viewBox */}
        {/* Original logo path: M100 400 C 150 400, 220 120, 412 120 (in 512x512 viewBox) */}
        {/* Scaled: 120/512 = 0.234375 */}
        <motion.path
          d="M23.4 93.8 C 35.2 93.8, 51.6 28.1, 96.6 28.1"
          stroke={pathColor}
          strokeWidth={strokeWidth}
          strokeMiterlimit="10"
          strokeLinecap="square"
          fill="none"
          animate={{
            stroke: pathColor,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut',
          }}
        />

        {/* Apex Dot - Larger and more visible with conditional glow and pulse */}
        <motion.circle
          cx="96.6"
          cy="28.1"
          r={dotRadius}
          fill={pathColor}
          animate={
            isStatic || !isRecording
              ? {
                  fill: pathColor,
                }
              : {
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.8, 1],
                  fill: pathColor,
                }
          }
          transition={
            isStatic || !isRecording
              ? {
                  fill: {
                    duration: 0.3,
                    ease: 'easeInOut',
                  },
                }
              : {
                  duration: 1, // 1Hz = 1 second cycle
                  repeat: Infinity,
                  ease: 'easeInOut',
                  fill: {
                    duration: 0.3,
                    ease: 'easeInOut',
                  },
                }
          }
          style={{
            filter: showGlow ? `drop-shadow(0 0 4px ${pathColor})` : 'none',
          }}
        />
      </svg>
    </motion.div>
  );
}

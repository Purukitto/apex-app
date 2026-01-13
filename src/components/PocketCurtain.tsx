import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fastItemVariants } from '../lib/animations';

interface PocketCurtainProps {
  isActive: boolean;
  onDismiss: () => void;
}

/**
 * PocketCurtain Component
 * Full-screen overlay that activates when proximity sensor detects phone is covered (in pocket)
 * Features:
 * - Moving text to prevent OLED burn-in
 * - Double tap or swipe up to dismiss
 * - Automatic activation via proximity sensor
 */
export function PocketCurtain({ isActive, onDismiss }: PocketCurtainProps) {
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [swipeStartY, setSwipeStartY] = useState<number | null>(null);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const tapCountRef = useRef(0);

  // Animate text position to prevent OLED burn-in
  useEffect(() => {
    if (!isActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const startTime = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000; // seconds
      const radius = 30; // pixels
      const speed = 0.5; // pixels per second

      // Circular motion pattern
      const x = Math.sin(elapsed * speed) * radius;
      const y = Math.cos(elapsed * speed) * radius;

      setTextPosition({ x, y });
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isActive]);

  // Handle double tap
  const handleTap = () => {
    tapCountRef.current += 1;
    
    // Clear existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    // If double tap (count is 2), dismiss
    if (tapCountRef.current === 2) {
      onDismiss();
      tapCountRef.current = 0;
      return;
    }

    // Reset count after 500ms if no second tap
    tapTimeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 500);
  };

  // Handle swipe up
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStartY === null) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = swipeStartY - currentY; // Positive = swiping up

    // If swiping up more than 100px, dismiss
    if (deltaY > 100) {
      onDismiss();
      setSwipeStartY(null);
    }
  };

  const handleTouchEnd = () => {
    setSwipeStartY(null);
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-apex-black z-50 flex items-center justify-center"
        variants={fastItemVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        <motion.div
          className="text-apex-white/20 font-mono text-sm tracking-wider select-none"
          style={{
            transform: `translate(${textPosition.x}px, ${textPosition.y}px)`,
          }}
          animate={{
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            opacity: {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        >
          Pocket Mode Active
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


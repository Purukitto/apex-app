import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bug } from 'lucide-react';
import { isDev } from '../lib/devtools';

interface DevToolsButtonProps {
  onToggle: () => void;
}

export default function DevToolsButton({ onToggle }: DevToolsButtonProps) {
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  // Triple tap gesture handler
  useEffect(() => {
    if (!isDev()) return;

    const handleTap = () => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;

      // Clear existing timeout
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }

      // Reset if too much time passed (more than 500ms)
      const newCount = timeSinceLastTap > 500 ? 1 : tapCountRef.current + 1;
      tapCountRef.current = newCount;
      lastTapTimeRef.current = now;

      // If triple tap, open devtools
      if (newCount >= 3) {
        onToggle();
        tapCountRef.current = 0;
        return;
      }

      // Reset count after 500ms if no more taps
      tapTimeoutRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 500);
    };

    // Listen for taps on document (but not on interactive elements)
    const handleDocumentTap = (e: TouchEvent | MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Ignore taps on buttons, inputs, links, etc.
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]')
      ) {
        return;
      }

      handleTap();
    };

    document.addEventListener('touchstart', handleDocumentTap);
    document.addEventListener('click', handleDocumentTap);

    return () => {
      document.removeEventListener('touchstart', handleDocumentTap);
      document.removeEventListener('click', handleDocumentTap);
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, [onToggle]); // Remove tapCount from dependencies to avoid re-creating listeners

  if (!isDev()) return null;

  return (
    <motion.button
      onClick={onToggle}
      className="fixed bottom-24 right-4 z-[9997] p-3 bg-gradient-to-br from-apex-green/20 to-apex-green/10 border border-apex-green/40 rounded-full shadow-lg backdrop-blur-sm"
      whileHover={{ scale: 1.1, borderColor: 'rgba(0, 255, 65, 0.6)' }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1 }}
      aria-label="Open DevTools"
    >
      <Bug size={20} className="text-apex-green" />
      <span className="sr-only">DevTools (Triple tap anywhere to open)</span>
    </motion.button>
  );
}

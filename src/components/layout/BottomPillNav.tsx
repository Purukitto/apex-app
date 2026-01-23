import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Motorbike, Radio, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonHoverProps } from '../../lib/animations';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useKeyboard } from '../../hooks/useKeyboard';
import { Capacitor } from '@capacitor/core';

export default function BottomPillNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { primary } = useThemeColors();
  const { isKeyboardVisible } = useKeyboard();
  const isNative = Capacitor.isNativePlatform();
  
  // On web, always show navigation (keyboard doesn't cover it)
  // On native, hide when keyboard is visible
  const shouldHide = isNative && isKeyboardVisible;

  const navItems = [
    { path: '/dashboard', icon: Activity, label: 'Dashboard' },
    { path: '/garage', icon: Motorbike, label: 'Garage' },
    { path: '/rides', icon: List, label: 'All Rides' },
    { path: '/ride', icon: Radio, label: 'Ride' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.div
          className="fixed left-1/2 -translate-x-1/2 z-50 bg-apex-white/10 backdrop-blur-md rounded-full flex items-center pointer-events-auto"
          style={{
            bottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))',
            maxWidth: 'calc(100vw - clamp(0.25rem, 0.5vw, 0.75rem) * 2)',
            padding: `clamp(0.75rem, 2.5vw, 1.25rem) clamp(1.25rem, 3vw, 2rem)`,
            gap: `clamp(1rem, 2.5vw, 2rem)`,
            marginLeft: `clamp(0.25rem, 0.5vw, 0.75rem)`,
            marginRight: `clamp(0.25rem, 0.5vw, 0.75rem)`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        const isRideButton = item.path === '/ride';

        if (isRideButton) {
          return (
            <motion.button
              key={item.path}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(item.path, { replace: true });
              }}
              className="rounded-full font-semibold text-apex-black flex items-center shadow-lg"
              style={{
                backgroundColor: primary,
                padding: `clamp(0.625rem, 2vw, 1rem) clamp(1.25rem, 3vw, 2.25rem)`,
                gap: `clamp(0.5rem, 1.2vw, 1rem)`,
                fontSize: `clamp(1rem, 2.5vw, 1.125rem)`,
              }}
              {...buttonHoverProps}
            >
              <span 
                className="shrink-0"
                style={{ 
                  width: 'clamp(22px, 5.5vw, 28px)', 
                  height: 'clamp(22px, 5.5vw, 28px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Radio size={28} style={{ width: '100%', height: '100%' }} />
              </span>
              <span>RIDE</span>
            </motion.button>
          );
        }

        return (
          <motion.button
            key={item.path}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(item.path, { replace: true });
            }}
            className={`rounded-full transition-colors ${
              active
                ? 'text-apex-white bg-apex-white/10'
                : 'text-apex-white/60 hover:text-apex-white hover:bg-apex-white/5'
            }`}
            style={{
              padding: `clamp(0.625rem, 2vw, 1rem)`,
            }}
            {...buttonHoverProps}
          >
            <span 
              className="shrink-0"
              style={{ 
                width: 'clamp(22px, 5.5vw, 28px)', 
                height: 'clamp(22px, 5.5vw, 28px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={28} style={{ width: '100%', height: '100%' }} />
            </span>
          </motion.button>
        );
      })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

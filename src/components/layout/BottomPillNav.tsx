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
          className="fixed left-1/2 -translate-x-1/2 z-50 bg-apex-white/10 backdrop-blur-md rounded-full px-8 py-3 flex items-center gap-8 pointer-events-auto"
          style={{
            bottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))',
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
              className="px-8 py-3 rounded-full font-semibold text-apex-black flex items-center gap-2 shadow-lg"
              style={{ backgroundColor: primary }}
              {...buttonHoverProps}
            >
              <Radio size={20} />
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
            className={`p-2 rounded-full transition-colors ${
              active
                ? 'text-apex-white bg-apex-white/10'
                : 'text-apex-white/60 hover:text-apex-white hover:bg-apex-white/5'
            }`}
            {...buttonHoverProps}
          >
            <Icon size={20} />
          </motion.button>
        );
      })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

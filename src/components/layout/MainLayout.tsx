import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Motorbike, Activity, User, Bell, Radio } from 'lucide-react';
import { Toaster } from 'sonner';
import { useNotificationStore } from '../../stores/useNotificationStore';
import NotificationPane from './NotificationPane';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonHoverProps } from '../../lib/animations';
import ApexTelemetryIcon from '../ui/ApexTelemetryIcon';

interface MainLayoutProps {
  children: React.ReactNode;
}

interface SidebarProps {
  unreadCount: number;
  onNotificationClick: () => void;
  navItems: Array<{ path: string; icon: React.ComponentType<{ size?: number }>; label: string }>;
  isActive: (path: string) => boolean;
}

interface BottomNavProps {
  navItems: Array<{ path: string; icon: React.ComponentType<{ size?: number }>; label: string }>;
  isActive: (path: string) => boolean;
}

interface MobileTopBarProps {
  unreadCount: number;
  onNotificationClick: () => void;
}

// Desktop Sidebar
const Sidebar = ({ unreadCount, onNotificationClick, navItems, isActive }: SidebarProps) => (
  <aside className="w-64 bg-apex-black border-r border-apex-white/10 h-screen fixed left-0 top-0 flex flex-col">
    <div className="p-6 border-b border-apex-white/10 flex items-center justify-between">
      <ApexTelemetryIcon size={32} static />
      <motion.button
        onClick={onNotificationClick}
        className="relative p-2 text-apex-white/60 hover:text-apex-green transition-colors"
        aria-label="Notifications"
        {...buttonHoverProps}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-apex-green text-apex-black text-[10px] font-mono font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>
    </div>
    <nav className="flex-1 p-4 space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              active
                ? 'bg-apex-green/20 text-apex-green'
                : 'text-apex-white/60 hover:text-apex-white hover:bg-apex-white/5'
            }`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  </aside>
);

// Mobile Bottom Navigation
const BottomNav = ({ navItems, isActive }: BottomNavProps) => (
  <nav 
    className="fixed bottom-0 left-0 right-0 bg-apex-black border-t border-apex-white/10 flex justify-around items-center h-16 z-50"
  >
    {navItems.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.path);
      return (
        <Link
          key={item.path}
          to={item.path}
          className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
            active
              ? 'text-apex-green'
              : 'text-apex-white/60 hover:text-apex-white'
          }`}
        >
          <Icon size={24} />
          <span className="text-xs">{item.label}</span>
          {active && (
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-apex-green rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </Link>
      );
    })}
  </nav>
);

// Mobile Top Bar (for notifications only)
const MobileTopBar = ({ unreadCount, onNotificationClick }: MobileTopBarProps) => (
  <div 
    className="fixed top-0 left-0 right-0 bg-apex-black border-b border-apex-white/10 z-40 md:hidden"
  >
    <div className="px-4 py-3 flex items-center justify-between">
      <ApexTelemetryIcon size={28} static />
      <motion.button
        onClick={onNotificationClick}
        className="relative p-2 text-apex-white/60 hover:text-apex-green transition-colors"
        aria-label="Notifications"
        {...buttonHoverProps}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-apex-green text-apex-black text-[10px] font-mono font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  </div>
);

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [notificationPaneOpen, setNotificationPaneOpen] = useState(false);
  const { getUnreadCount } = useNotificationStore();
  
  const unreadCount = getUnreadCount();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { path: '/dashboard', icon: Activity, label: 'Dashboard' },
    { path: '/garage', icon: Motorbike, label: 'Garage' },
    { path: '/ride', icon: Radio, label: 'Ride' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-apex-black">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          unreadCount={unreadCount}
          onNotificationClick={() => setNotificationPaneOpen(true)}
          navItems={navItems}
          isActive={isActive}
        />
      )}

      {/* Mobile Top Bar */}
      {isMobile && (
        <MobileTopBar
          unreadCount={unreadCount}
          onNotificationClick={() => setNotificationPaneOpen(true)}
        />
      )}

      {/* Main Content */}
      <main
        className={`${
          isMobile ? 'pb-16' : 'ml-64'
        } min-h-screen transition-all`}
        style={isMobile ? { paddingTop: '3.5rem' } : {}}
      >
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNav navItems={navItems} isActive={isActive} />}

      {/* Toast Notifications */}
      <Toaster
        theme="dark"
        position="top-center"
        expand={false}
        toastOptions={{
          className: 'apex-toast',
          style: {
            background: '#0A0A0A',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#E2E2E2',
            fontFamily: 'inherit',
            marginTop: isMobile ? 'calc(3.5rem + max(env(safe-area-inset-top), 24px))' : '0',
            zIndex: 9999,
          },
        }}
      />

      {/* Notification Pane */}
      <NotificationPane
        isOpen={notificationPaneOpen}
        onClose={() => setNotificationPaneOpen(false)}
      />
    </div>
  );
}


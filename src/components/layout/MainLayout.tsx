import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { useAppUpdateStore } from '../../stores/useAppUpdateStore';
import NotificationPane from './NotificationPane';
import BottomPillNav from './BottomPillNav';
import PageHeader from './PageHeader';
import { NotificationContext } from './NotificationContext';
import UpdateModal from '../UpdateModal';
import DevToolsPanel from '../DevToolsPanel';
import DevToolsButton from '../DevToolsButton';
import { useAppUpdate } from '../../hooks/useAppUpdate';
import { AnimatePresence, motion } from 'framer-motion';
import { containerVariants } from '../../lib/animations';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [notificationPaneOpen, setNotificationPaneOpen] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const { getUnreadCount } = useNotificationStore();
  const { updateInfo, showModal, setShowModal, dismissUpdate } = useAppUpdateStore();
  const { openReleasePage } = useAppUpdate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  
  const unreadCount = getUnreadCount();

  const handleUpdateDownload = () => {
    if (updateInfo?.downloadUrl) {
      openReleasePage();
    } else {
      openReleasePage();
    }
  };

  // Reset scroll position on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Get page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/garage') return 'Garage';
    if (path === '/profile') return 'Profile';
    if (path === '/ride') return 'Ride';
    if (path === '/rides') return 'All Rides';
    return 'Apex';
  };

  return (
    <NotificationContext.Provider
      value={{
        openNotifications: () => setNotificationPaneOpen(true),
        unreadCount,
      }}
    >
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        {/* Sticky Page Header */}
        <div className="sticky top-0 z-40 bg-zinc-950 border-b border-white/5">
          <motion.div
            className="p-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <PageHeader title={getPageTitle()} />
          </motion.div>
        </div>

        {/* Main Content */}
        <main ref={mainRef} className="flex-1 min-h-0 pb-32 transition-all overflow-y-auto">
          <AnimatePresence mode="wait" key={location.pathname}>
            {children}
          </AnimatePresence>
        </main>

        {/* Floating Bottom Pill Navigation - All Platforms */}
        <BottomPillNav />

        {/* Toast Notifications */}
        <Toaster
          theme="dark"
          position="top-center"
          expand={false}
          visibleToasts={5}
          gap={8}
          richColors={false}
          toastOptions={{
            className: 'apex-toast',
            style: {
              background: '#0A0A0A',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#E2E2E2',
              fontFamily: 'inherit',
            },
          }}
        />

        {/* Notification Pane */}
        <NotificationPane
          isOpen={notificationPaneOpen}
          onClose={() => setNotificationPaneOpen(false)}
        />

        {/* Update Modal - Global */}
        {updateInfo && (
          <UpdateModal
            isOpen={showModal}
            onClose={async () => {
              setShowModal(false);
              await dismissUpdate();
            }}
            onDownload={handleUpdateDownload}
            updateInfo={updateInfo}
          />
        )}

        {/* DevTools - Development Only */}
        <DevToolsPanel
          isOpen={devToolsOpen}
          onClose={() => setDevToolsOpen(false)}
        />
        <DevToolsButton onToggle={() => setDevToolsOpen(prev => !prev)} />
      </div>
    </NotificationContext.Provider>
  );
}

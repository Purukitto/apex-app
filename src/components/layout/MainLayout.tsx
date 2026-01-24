import { useState, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { useAppUpdateStore } from '../../stores/useAppUpdateStore';
import NotificationPane from './NotificationPane';
import BottomPillNav from './BottomPillNav';
import PageHeader from './PageHeader';
import { NotificationContext } from './NotificationContext';
import UpdateModal from '../UpdateModal';
import DevToolsPanel from '../DevToolsPanel';
import DevToolsButton from '../DevToolsButton';
import { useAppUpdate } from '../../hooks/useAppUpdate';
import { Capacitor } from '@capacitor/core';
import { AnimatePresence, motion } from 'framer-motion';
import { containerVariants } from '../../lib/animations';
import { useRideStore } from '../../stores/useRideStore';
import { isDev } from '../../lib/devtools';
import { registerPushNotifications } from '../../services/notifications';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [notificationPaneOpen, setNotificationPaneOpen] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const { updateInfo, showModal, setShowModal, dismissUpdate, downloadState, downloadProgress, lastDownloadedPath } = useAppUpdateStore();
  const { openReleasePage, downloadUpdate, deleteDownloadedApk } = useAppUpdate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const isRecording = useRideStore((state) => state.isRecording);
  
  // Hide navigation when recording (full-screen ride mode)
  const isRideMode = isRecording && location.pathname === '/ride';
  const canDirectDownload = Boolean(updateInfo?.downloadUrl) && Capacitor.getPlatform() === 'android';

  const handleUpdateDownload = () => {
    if (canDirectDownload) {
      void downloadUpdate();
      return;
    }
    void openReleasePage();
  };

  // Reset scroll position on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  useEffect(() => {
    registerPushNotifications().catch(() => {
      // Errors already logged in the service
    });
  }, []);

  // Get page title from route
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/garage') return 'Garage';
    if (path === '/profile') return 'Profile';
    if (path === '/ride') return 'Ride';
    if (path === '/rides') return 'All Rides';
    return 'Apex';
  }, [location.pathname]);

  // Update document title dynamically based on route
  useEffect(() => {
    // Format: "Page Name | Apex" for specific pages, or just "Apex" for default
    document.title = pageTitle === 'Apex' ? 'Apex' : `${pageTitle} | Apex`;
  }, [pageTitle]);

  return (
    <NotificationContext.Provider
      value={{
        openNotifications: () => setNotificationPaneOpen(true),
        unreadCount,
      }}
    >
      <div className={`h-screen bg-apex-black flex flex-col overflow-hidden ${isRideMode ? 'fixed inset-0' : ''}`}>
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-noise"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 0%, rgba(var(--color-apex-green-rgb), 0.15), transparent 70%), var(--apex-noise-image)',
            backgroundRepeat: 'no-repeat, repeat',
            backgroundSize: '100% 100%, 120px 120px',
          }}
        />
        {/* Sticky Page Header - Hidden in ride mode */}
        {!isRideMode && (
          <div 
            className="sticky top-0 z-40 bg-apex-black border-b border-apex-white/5"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
            }}
          >
            <motion.div
              className="p-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <PageHeader title={pageTitle} />
            </motion.div>
          </div>
        )}

        {/* Main Content */}
        <main 
          ref={mainRef} 
          className={`flex-1 min-h-0 transition-all overflow-y-auto bg-apex-black ${isRideMode ? 'pb-0' : 'pb-32'}`}
          style={{ overscrollBehaviorY: 'contain' }}
        >
          <AnimatePresence mode="wait" key={location.pathname}>
            {children}
          </AnimatePresence>
        </main>

        {/* Floating Bottom Pill Navigation - Hidden in ride mode */}
        {!isRideMode && <BottomPillNav />}

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
            downloadState={downloadState}
            downloadProgress={downloadProgress}
            canDirectDownload={canDirectDownload}
            onDeleteApk={() => { void deleteDownloadedApk(); }}
            hasDownloadedApk={Boolean(lastDownloadedPath)}
          />
        )}

        {/* DevTools - Development Only */}
        {isDev() && (
          <>
            <DevToolsPanel
              isOpen={devToolsOpen}
              onClose={() => setDevToolsOpen(false)}
            />
            <DevToolsButton onToggle={() => setDevToolsOpen(prev => !prev)} />
          </>
        )}
      </div>
    </NotificationContext.Provider>
  );
}

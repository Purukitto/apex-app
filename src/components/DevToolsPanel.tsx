import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Database, RefreshCw, Copy, Check, Download, Search, Filter, ChevronDown } from 'lucide-react';
import { useRideStore } from '../stores/useRideStore';
import { useThemeStore } from '../stores/useThemeStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useAppUpdateStore } from '../stores/useAppUpdateStore';
import { useAppUpdate } from '../hooks/useAppUpdate';
import type { UpdateInfo } from '../hooks/useAppUpdate';
import { getAppVersion } from '../lib/version';
import { isDev } from '../lib/devtools';
import { buttonHoverProps } from '../lib/animations';
import { logger } from '../lib/logger';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { apexToast } from '../lib/toast';
import { supabase } from '../lib/supabaseClient';

interface DevToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'stores' | 'console';

interface ConsoleLog {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  message: string;
  timestamp: Date;
  args?: unknown[];
}

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent';

export default function DevToolsPanel({ isOpen, onClose }: DevToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('stores');
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [logLevel, setLogLevel] = useState<LogLevel>(() => logger.getLevel() as LogLevel);
  const [searchFilter, setSearchFilter] = useState('');
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const consoleScrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [notificationType, setNotificationType] = useState<'info' | 'warning' | 'error'>('info');
  const [notificationTitle, setNotificationTitle] = useState('DevTools Test');
  const [notificationMessage, setNotificationMessage] = useState('This is a test notification.');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  
  // Use refs to queue logs and flush them outside render
  const logQueueRef = useRef<ConsoleLog[]>([]);
  const flushScheduledRef = useRef(false);

  // Get all store states
  const rideStore = useRideStore();
  const themeStore = useThemeStore();
  const notificationStore = useNotificationStore();
  const appUpdateStore = useAppUpdateStore();
  const { checkForUpdate, getLatestReleaseInfo } = useAppUpdate();

  const mockUpdateInfo = useMemo<UpdateInfo>(() => ({
    isAvailable: true,
    latestVersion: 'v9.9.9',
    currentVersion: getAppVersion(),
    releaseNotes: [
      '## v9.9.9',
      '',
      '### Features',
      '* Instant launch with cached route data',
      '* New ride highlights carousel',
      '* Smart download scheduler for updates',
      '### Bug Fixes',
      '* Fix occasional GPS spike at low speed',
      '* Prevent duplicate toast on retry',
      '* Smooth out card hover flicker',
      '### Performance',
      '* Reduce main thread work during ride start',
      '* Smaller bundle for analytics',
      '### Security',
      '* Hardened session refresh handling',
      '',
      '## v9.9.8',
      '',
      '### Features',
      '* Route caching for offline maps',
      '### Bug Fixes',
      '* Fix update modal not showing previous versions',
    ].join('\n'),
    releaseUrl: 'https://github.com/Purukitto/apex-app/releases/latest',
    downloadUrl: Capacitor.getPlatform() === 'android'
      ? 'https://github.com/Purukitto/apex-app/releases/latest/download/apex-v9.9.9.apk'
      : undefined,
  }), []);

  const showMockUpdateModal = useCallback(() => {
    appUpdateStore.setUpdateInfo(mockUpdateInfo);
    appUpdateStore.setShowModal(true);
  }, [appUpdateStore, mockUpdateInfo]);

  const showLiveUpdateModal = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      apexToast.error('Update checks are native-only for now.', {
        action: { label: 'Show Mock', onClick: showMockUpdateModal },
      });
      return;
    }

    const update = await checkForUpdate(true, true);
    if (!update) {
      apexToast.error('No update available right now.', {
        action: { label: 'Show Mock', onClick: showMockUpdateModal },
      });
    }
  }, [checkForUpdate, showMockUpdateModal]);

  const forceDownloadUpdate = useCallback(async () => {
    if (Capacitor.getPlatform() !== 'android') {
      apexToast.error('Direct install is Android-only.', {
        action: { label: 'Show Mock', onClick: showMockUpdateModal },
      });
      return;
    }

    const latestInfo = await getLatestReleaseInfo();
    if (!latestInfo?.downloadUrl) {
      apexToast.error('No APK found for the latest release.');
      return;
    }

    appUpdateStore.setUpdateInfo(latestInfo);
    appUpdateStore.setShowModal(true);
  }, [appUpdateStore, getLatestReleaseInfo, showMockUpdateModal]);

  // Flush queued logs to state
  const flushLogs = useCallback(() => {
    if (logQueueRef.current.length === 0) {
      flushScheduledRef.current = false;
      return;
    }

    const logsToAdd = [...logQueueRef.current];
    logQueueRef.current = [];
    flushScheduledRef.current = false;

    setConsoleLogs(prev => [
      ...prev.slice(-9999), // Keep last 10000 logs
      ...logsToAdd,
    ]);
  }, []);

  // Schedule log flush outside render phase
  const scheduleFlush = useCallback(() => {
    if (flushScheduledRef.current) return;
    flushScheduledRef.current = true;
    
    // Use queueMicrotask to defer until after current render phase
    queueMicrotask(() => {
      flushLogs();
    });
  }, [flushLogs]);

  // Intercept console methods - always active in dev mode, not just when panel is open
  // NOTE: These console.* assignments are intentional - they intercept console calls
  // to capture logs for display in the DevTools panel. This is necessary for the
  // panel to work and is the only place where console.* should be used directly.
  useEffect(() => {
    if (!isDev()) return;

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;
    const originalTrace = console.trace;

    const addLog = (type: ConsoleLog['type'], ...args: unknown[]) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      // Queue the log instead of calling setState directly
      logQueueRef.current.push({
        id: `${Date.now()}-${Math.random()}`,
        type,
        message,
        timestamp: new Date(),
        args,
      });

      // Schedule a flush if not already scheduled
      scheduleFlush();
    };

    console.log = (...args: unknown[]) => {
      originalLog(...args);
      addLog('log', ...args);
    };

    console.error = (...args: unknown[]) => {
      originalError(...args);
      addLog('error', ...args);
    };

    console.warn = (...args: unknown[]) => {
      originalWarn(...args);
      addLog('warn', ...args);
    };

    console.info = (...args: unknown[]) => {
      originalInfo(...args);
      addLog('info', ...args);
    };

    console.debug = (...args: unknown[]) => {
      originalDebug(...args);
      addLog('debug', ...args);
    };

    console.trace = (...args: unknown[]) => {
      originalTrace(...args);
      addLog('trace', ...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      console.debug = originalDebug;
      console.trace = originalTrace;
    };
  }, [scheduleFlush]); // Include scheduleFlush in dependencies

  // Clear console logs
  const clearConsole = () => {
    setConsoleLogs([]);
  };

  // Handle log level change
  const handleLogLevelChange = (level: LogLevel) => {
    setLogLevel(level);
    logger.setLevel(level);
  };

  // Log level options
  const logLevels: { value: LogLevel; label: string; color: string }[] = [
    { value: 'trace', label: 'Trace', color: 'text-apex-white/40' },
    { value: 'debug', label: 'Debug', color: 'text-apex-white/60' },
    { value: 'info', label: 'Info', color: 'text-apex-green' },
    { value: 'warn', label: 'Warn', color: 'text-amber-400' },
    { value: 'error', label: 'Error', color: 'text-apex-red' },
    { value: 'silent', label: 'Silent', color: 'text-apex-white/40' },
  ];

  // Filter logs based on level and search term
  const filteredLogs = useMemo(() => {
    return consoleLogs.filter((log) => {
      // Filter by log level
      const levelOrder: Record<LogLevel, number> = {
        trace: 0,
        debug: 1,
        info: 2,
        warn: 3,
        error: 4,
        silent: 5,
      };
      
      const currentLevelOrder = levelOrder[logLevel];
      const logLevelOrder = levelOrder[log.type as LogLevel] ?? 999;
      
      // If log level is higher than current level, hide it
      if (logLevelOrder < currentLevelOrder) {
        return false;
      }

      // Filter by search term (exclude if search term is in message)
      if (searchFilter.trim()) {
        const searchLower = searchFilter.toLowerCase();
        const messageLower = log.message.toLowerCase();
        // If search term starts with "-", it's an exclusion filter
        if (searchLower.startsWith('-')) {
          const excludeTerm = searchLower.slice(1).trim();
          if (excludeTerm && messageLower.includes(excludeTerm)) {
            return false;
          }
        } else {
          // Normal search - include if message contains search term
          if (!messageLower.includes(searchLower)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [consoleLogs, logLevel, searchFilter]);

  // Track whether user is at bottom of console (for conditional auto-scroll)
  const handleConsoleScroll = useCallback(() => {
    const el = consoleScrollRef.current;
    if (!el) return;
    const threshold = 50;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    if (atBottom !== isAtBottomRef.current) {
      isAtBottomRef.current = atBottom;
      setIsAtBottom(atBottom);
    }
  }, []);

  // Sync isAtBottom when switching to console tab (scroll handler may not have run yet)
  useEffect(() => {
    if (activeTab !== 'console') return;
    const el = consoleScrollRef.current;
    if (el) {
      const threshold = 50;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      isAtBottomRef.current = atBottom;
      setIsAtBottom(atBottom);
    }
  }, [activeTab]);

  // Auto-scroll console to bottom only when user is already at bottom
  useEffect(() => {
    if (activeTab === 'console' && consoleEndRef.current && filteredLogs.length > 0 && isAtBottomRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs.length, activeTab, filteredLogs.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
    };

    if (isTypeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isTypeDropdownOpen]);

  // Copy state to clipboard
  const copyState = async (storeName: string, state: unknown) => {
    try {
      const json = JSON.stringify(state, null, 2);
      await navigator.clipboard.writeText(json);
      setCopiedId(storeName);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      logger.error('Failed to copy:', error);
    }
  };

  // Format store state for display
  const formatStoreState = (state: unknown): string => {
    try {
      return JSON.stringify(state, null, 2);
    } catch {
      return String(state);
    }
  };

  const sendServerNotification = useCallback(async () => {
    const trimmedMessage = notificationMessage.trim();
    if (!trimmedMessage) {
      apexToast.error('Message is required');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      apexToast.error('You must be signed in to send notifications');
      return;
    }

    const insertPromise = supabase.from('notifications').insert({
      user_id: user.id,
      type: notificationType,
      title: notificationTitle.trim() || null,
      message: trimmedMessage,
      source: 'devtools',
      payload: {
        source: 'devtools',
        sentAt: new Date().toISOString(),
      },
    });

    await apexToast.promise(
      new Promise<boolean>((resolve, reject) => {
        Promise.resolve(insertPromise)
          .then(({ error }) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(true);
          })
          .catch(reject);
      }),
      {
        loading: 'Sending notification...',
        success: 'Notification Sent',
        error: 'Failed to send notification',
      },
      {
        errorAction: {
          label: 'Retry',
          onClick: () => {
            sendServerNotification().catch((error) => {
              logger.error('Retry send notification failed:', error);
            });
          },
        },
      }
    );
  }, [notificationMessage, notificationTitle, notificationType]);

  if (!isDev()) return null;

  const stores = [
    { name: 'RideStore', state: rideStore },
    { name: 'ThemeStore', state: themeStore },
    { name: 'NotificationStore', state: notificationStore },
    { name: 'AppUpdateStore', state: appUpdateStore },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm z-9998"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-apex-black border-l border-apex-white/20 z-9999 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 border-b border-apex-white/20"
              style={{
                paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))`,
              }}
            >
              <h2 className="text-lg font-semibold text-apex-white font-mono">
                DevTools
              </h2>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-apex-white/10 text-apex-white"
                {...buttonHoverProps}
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-apex-white/10">
              <button
                onClick={() => setActiveTab('stores')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'stores'
                    ? 'text-apex-green border-b-2 border-apex-green'
                    : 'text-apex-white/60 hover:text-apex-white'
                }`}
              >
                <Database size={16} className="inline mr-2" />
                Stores
              </button>
              <button
                onClick={() => setActiveTab('console')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'console'
                    ? 'text-apex-green border-b-2 border-apex-green'
                    : 'text-apex-white/60 hover:text-apex-white'
                }`}
              >
                <Terminal size={16} className="inline mr-2" />
                Console ({consoleLogs.length})
              </button>
            </div>

            {/* Content */}
            <div className={`flex-1 ${activeTab === 'stores' ? 'overflow-y-auto' : 'overflow-hidden flex flex-col'}`}>
              {activeTab === 'stores' && (
                <div className="p-4 space-y-4">
                  {stores.map((store) => (
                    <div
                      key={store.name}
                      className="bg-linear-to-br from-white/5 to-transparent border border-apex-white/20 rounded-md p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-apex-green font-mono">
                          {store.name}
                        </h3>
                        <motion.button
                          onClick={() => copyState(store.name, store.state)}
                          className="p-1.5 rounded hover:bg-apex-white/10 text-apex-white/60 hover:text-apex-white"
                          {...buttonHoverProps}
                        >
                          {copiedId === store.name ? (
                            <Check size={14} className="text-apex-green" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </motion.button>
                      </div>
                      <pre className="text-xs font-mono text-apex-white/80 overflow-x-auto">
                        {formatStoreState(store.state)}
                      </pre>
                    </div>
                  ))}

                  <div className="bg-linear-to-br from-white/5 to-transparent border border-apex-white/20 rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-apex-green font-mono">
                        App Update Tester
                      </h3>
                    </div>
                    <p className="text-xs text-apex-white/60">
                      Trigger the update modal with live data or a mock payload.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <motion.button
                        onClick={() => { void showLiveUpdateModal(); }}
                        className="flex-1 px-3 py-2 text-xs font-semibold text-apex-black bg-apex-green rounded-lg border border-apex-green/60 hover:border-apex-green transition-colors"
                        {...buttonHoverProps}
                      >
                        Check & Show Update
                      </motion.button>
                      <motion.button
                        onClick={showMockUpdateModal}
                        className="flex-1 px-3 py-2 text-xs font-semibold text-apex-white/80 bg-apex-white/5 rounded-lg border border-apex-white/10 hover:border-apex-white/20 transition-colors"
                        {...buttonHoverProps}
                      >
                        Show Mock Modal
                      </motion.button>
                      <motion.button
                        onClick={forceDownloadUpdate}
                        className="flex-1 px-3 py-2 text-xs font-semibold text-apex-white/90 bg-apex-black rounded-lg border border-apex-green/40 hover:border-apex-green/70 transition-colors"
                        {...buttonHoverProps}
                      >
                        Force Update Modal
                      </motion.button>
                    </div>
                  </div>

                  <div className="bg-linear-to-br from-apex-white/5 to-transparent border border-apex-white/20 rounded-md p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-apex-green font-mono">
                        Notification Sender
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-apex-white/60">
                          Type
                        </label>
                        <div className="relative" ref={typeDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                            className="w-full px-3 py-2 text-xs font-mono bg-apex-white/5 border border-apex-green/40 rounded-lg text-apex-white focus:outline-none focus:border-apex-green focus:bg-apex-white/10 transition-colors flex items-center justify-between"
                            {...buttonHoverProps}
                          >
                            <span>{notificationType}</span>
                            <ChevronDown 
                              size={14} 
                              className={`text-apex-green transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`}
                            />
                          </button>
                          <AnimatePresence>
                            {isTypeDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute z-50 w-full mt-1 bg-apex-black border border-apex-green/40 rounded-lg shadow-lg overflow-hidden"
                              >
                                {(['info', 'warning', 'error'] as const).map((type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                      setNotificationType(type);
                                      setIsTypeDropdownOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 text-xs font-mono text-left transition-colors ${
                                      notificationType === type
                                        ? 'bg-apex-green/20 text-apex-green'
                                        : 'text-apex-white hover:bg-apex-white/10'
                                    }`}
                                    {...buttonHoverProps}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[10px] font-mono text-apex-white/60">
                          Title
                        </label>
                        <input
                          type="text"
                          value={notificationTitle}
                          onChange={(e) => setNotificationTitle(e.target.value)}
                          placeholder="Optional title"
                          className="w-full px-3 py-2 text-xs font-mono bg-apex-white/5 border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green/40 focus:bg-apex-white/10 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-apex-white/60">
                        Message
                      </label>
                      <textarea
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        rows={3}
                        placeholder="Notification message"
                        className="w-full px-3 py-2 text-xs font-mono bg-apex-white/5 border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green/40 focus:bg-apex-white/10 transition-colors resize-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <motion.button
                        onClick={() => {
                          sendServerNotification().catch((error) => {
                            logger.error('Send notification failed:', error);
                          });
                        }}
                        className="px-4 py-2 text-xs font-semibold text-apex-black bg-apex-green rounded-lg border border-apex-green/60 hover:border-apex-green transition-colors"
                        {...buttonHoverProps}
                      >
                        Send Notification
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'console' && (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Fixed Controls Section */}
                  <div className="shrink-0 p-4 space-y-4 border-b border-apex-white/10">
                    {/* Logger Session Info */}
                    <div className="p-3 rounded-md bg-linear-to-br from-white/5 to-transparent border border-apex-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-apex-green font-mono">Logger Session</p>
                        <motion.button
                          onClick={async () => {
                            try {
                              if (Capacitor.isNativePlatform()) {
                                // Native: Share log file using Capacitor Share
                                const logContent = await logger.getLogFileContent();
                                if (logContent) {
                                  // Save to a temporary file and share it
                                  const { Filesystem, Directory } = await import('@capacitor/filesystem');
                                  const shareFileName = `apex-logs-export-${Date.now()}.txt`;
                                  
                                  await Filesystem.writeFile({
                                    path: shareFileName,
                                    data: logContent,
                                    directory: Directory.Cache,
                                  });

                                  const fileUri = await Filesystem.getUri({
                                    path: shareFileName,
                                    directory: Directory.Cache,
                                  });

                                  await Share.share({
                                    title: 'Apex Logs',
                                    text: `Apex app logs - Session: ${logger.getSessionId()}`,
                                    url: fileUri.uri,
                                    dialogTitle: 'Share Logs',
                                  });

                                  // Clean up temporary file
                                  Filesystem.deleteFile({
                                    path: shareFileName,
                                    directory: Directory.Cache,
                                  }).catch(() => {
                                    // Ignore cleanup errors
                                  });
                                } else {
                                  logger.warn('No log file content available');
                                }
                              } else {
                                // Web: Download logs as text file
                                const logText = logger.exportLogsAsText(consoleLogs);
                                const blob = new Blob([logText], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `apex-logs-${logger.getSessionId()}-${Date.now()}.txt`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                              }
                            } catch (error) {
                              logger.error('Failed to export logs:', error);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-apex-white/10 text-apex-white/60 hover:text-apex-white"
                          {...buttonHoverProps}
                          title={Capacitor.isNativePlatform() ? "Share log file" : "Download logs"}
                        >
                          <Download size={14} />
                        </motion.button>
                      </div>
                      <div className="space-y-1 text-xs font-mono text-apex-white/60">
                        <p>Session ID: <span className="text-apex-white/80">{logger.getSessionId()}</span></p>
                        {Capacitor.isNativePlatform() && (
                          <p className="text-apex-green">File logging: Enabled</p>
                        )}
                      </div>
                    </div>

                    {/* Log Level Selector */}
                    <div className="p-3 rounded-md bg-linear-to-br from-white/5 to-transparent border border-apex-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Filter size={14} className="text-apex-green" />
                        <p className="text-xs font-semibold text-apex-green font-mono">Log Level</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {logLevels.map((level) => (
                          <motion.button
                            key={level.value}
                            onClick={() => handleLogLevelChange(level.value)}
                            className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-colors ${
                              logLevel === level.value
                                ? `${level.color} border-apex-green bg-apex-green/10`
                                : 'text-apex-white/60 border-apex-white/10 hover:border-apex-white/20 hover:text-apex-white/80 bg-apex-white/5'
                            }`}
                            {...buttonHoverProps}
                          >
                            {level.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Search/Filter Input */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-white/40" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search logs... (use -term to exclude)"
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-apex-white/5 border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green/40 focus:bg-apex-white/10 transition-colors"
                      />
                      {searchFilter && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => setSearchFilter('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-apex-white/40 hover:text-apex-white"
                          {...buttonHoverProps}
                        >
                          <X size={14} />
                        </motion.button>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-apex-white/60">
                        {filteredLogs.length} / {consoleLogs.length} log entries
                        {searchFilter && (
                          <span className="text-apex-green ml-1">
                            (filtered)
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={async () => {
                            try {
                              // Check if there are logs to copy
                              if (filteredLogs.length === 0) {
                                apexToast.error('No logs to copy');
                                return;
                              }

                              const allLogsText = filteredLogs.map((log) => {
                                const timestamp = log.timestamp.toLocaleString();
                                const level = log.type.toUpperCase().padEnd(5);
                                return `[${timestamp}] ${level} ${log.message}`;
                              }).join('\n');
                              
                              // Try modern Clipboard API first
                              if (navigator.clipboard && navigator.clipboard.writeText) {
                                try {
                                  await navigator.clipboard.writeText(allLogsText);
                                  setCopiedId('all-logs');
                                  apexToast.success(`Copied ${filteredLogs.length} log${filteredLogs.length === 1 ? '' : 's'} to clipboard`);
                                  setTimeout(() => setCopiedId(null), 2000);
                                  return;
                                } catch (clipboardError) {
                                  // Clipboard API might fail due to permissions or security context
                                  // Fall through to fallback method
                                  logger.debug('Clipboard API failed, trying fallback:', clipboardError);
                                }
                              }
                              
                              // Fallback: Use execCommand for older browsers, webviews, or when clipboard API fails
                              const textArea = document.createElement('textarea');
                              textArea.value = allLogsText;
                              // Position off-screen but visible to the browser
                              textArea.style.position = 'fixed';
                              textArea.style.left = '0';
                              textArea.style.top = '0';
                              textArea.style.width = '2em';
                              textArea.style.height = '2em';
                              textArea.style.padding = '0';
                              textArea.style.border = 'none';
                              textArea.style.outline = 'none';
                              textArea.style.boxShadow = 'none';
                              textArea.style.background = 'transparent';
                              textArea.style.opacity = '0';
                              textArea.setAttribute('readonly', '');
                              textArea.setAttribute('aria-hidden', 'true');
                              
                              document.body.appendChild(textArea);
                              
                              // For mobile webviews, we need to ensure the element is selectable
                              if (Capacitor.isNativePlatform()) {
                                textArea.contentEditable = 'true';
                                textArea.readOnly = false;
                              }
                              
                              // Select the text
                              const range = document.createRange();
                              range.selectNodeContents(textArea);
                              const selection = window.getSelection();
                              if (selection) {
                                selection.removeAllRanges();
                                selection.addRange(range);
                              }
                              textArea.setSelectionRange(0, 99999); // For mobile devices
                              textArea.focus();
                              
                              // Execute copy command
                              const successful = document.execCommand('copy');
                              
                              // Clean up
                              document.body.removeChild(textArea);
                              if (selection) {
                                selection.removeAllRanges();
                              }
                              
                              if (successful) {
                                setCopiedId('all-logs');
                                apexToast.success(`Copied ${filteredLogs.length} log${filteredLogs.length === 1 ? '' : 's'} to clipboard`);
                                setTimeout(() => setCopiedId(null), 2000);
                              } else {
                                throw new Error('execCommand copy failed');
                              }
                            } catch (error) {
                              logger.error('Failed to copy logs:', error);
                              apexToast.error('Failed to copy logs to clipboard');
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-apex-white/60 hover:text-apex-white bg-apex-white/5 hover:bg-apex-white/10 rounded-lg border border-apex-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          {...buttonHoverProps}
                          title="Copy all filtered logs to clipboard"
                          disabled={filteredLogs.length === 0}
                        >
                          {copiedId === 'all-logs' ? (
                            <>
                              <Check size={14} className="text-apex-green" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Copy All
                            </>
                          )}
                        </motion.button>
                        <motion.button
                          onClick={clearConsole}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-apex-white/60 hover:text-apex-white bg-apex-white/5 hover:bg-apex-white/10 rounded-lg border border-apex-white/10"
                          {...buttonHoverProps}
                        >
                          <RefreshCw size={14} />
                          Clear
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Logs Container */}
                  <div
                    ref={consoleScrollRef}
                    onScroll={handleConsoleScroll}
                    className="flex-1 overflow-y-auto overflow-x-hidden p-4 relative"
                  >
                    <div className="space-y-1 font-mono text-xs">
                      {filteredLogs.length === 0 ? (
                        <p className="text-apex-white/40 text-center py-8">
                          {consoleLogs.length === 0 
                            ? 'No console logs yet'
                            : 'No logs match the current filters'
                          }
                        </p>
                      ) : (
                        filteredLogs.map((log) => {
                          const colorClass = {
                            log: 'text-apex-white/80',
                            error: 'text-apex-red',
                            warn: 'text-amber-400',
                            info: 'text-apex-green',
                            debug: 'text-apex-white/60',
                            trace: 'text-apex-white/40',
                          }[log.type];

                          return (
                            <div
                              key={log.id}
                              className="p-2 rounded bg-apex-white/5 border border-apex-white/10 overflow-hidden"
                            >
                              <div className="flex items-start gap-2 min-w-0">
                                <span className={`text-[10px] ${colorClass} shrink-0`}>
                                  {log.type.toUpperCase()}
                                </span>
                                <span className="text-apex-white/40 shrink-0">
                                  {log.timestamp.toLocaleTimeString()}
                                </span>
                                <span className={`flex-1 ${colorClass} wrap-break-word min-w-0`}>
                                  {log.message}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={consoleEndRef} />
                    </div>
                    <AnimatePresence>
                      {!isAtBottom && filteredLogs.length > 0 && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                          className="absolute bottom-4 right-4 z-10 p-2 rounded-lg bg-apex-black border border-apex-green/40 text-apex-green hover:bg-apex-green/10"
                          {...buttonHoverProps}
                          title="Scroll to bottom"
                        >
                          <ChevronDown size={18} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

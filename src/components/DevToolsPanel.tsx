import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Database, RefreshCw, Copy, Check } from 'lucide-react';
import { useRideStore } from '../stores/useRideStore';
import { useThemeStore } from '../stores/useThemeStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useAppUpdateStore } from '../stores/useAppUpdateStore';
import { isDev } from '../lib/devtools';
import { buttonHoverProps } from '../lib/animations';

interface DevToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'stores' | 'console';

interface ConsoleLog {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: Date;
  args?: unknown[];
}

export default function DevToolsPanel({ isOpen, onClose }: DevToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('stores');
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Get all store states
  const rideStore = useRideStore();
  const themeStore = useThemeStore();
  const notificationStore = useNotificationStore();
  const appUpdateStore = useAppUpdateStore();

  // Intercept console methods - always active in dev mode, not just when panel is open
  useEffect(() => {
    if (!isDev()) return;

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

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

      setConsoleLogs(prev => [
        ...prev.slice(-99), // Keep last 100 logs
        {
          id: `${Date.now()}-${Math.random()}`,
          type,
          message,
          timestamp: new Date(),
          args,
        },
      ]);
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

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, []); // Run once on mount, not dependent on isOpen

  // Auto-scroll console to bottom
  useEffect(() => {
    if (activeTab === 'console' && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs, activeTab]);

  // Clear console logs
  const clearConsole = () => {
    setConsoleLogs([]);
  };

  // Copy state to clipboard
  const copyState = async (storeName: string, state: unknown) => {
    try {
      const json = JSON.stringify(state, null, 2);
      await navigator.clipboard.writeText(json);
      setCopiedId(storeName);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
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
            className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-apex-black border-l border-apex-white/20 z-[9999] flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-apex-white/20">
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
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'stores' && (
                <div className="p-4 space-y-4">
                  {stores.map((store) => (
                    <div
                      key={store.name}
                      className="bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg p-4"
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
                </div>
              )}

              {activeTab === 'console' && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-apex-white/60">
                      {consoleLogs.length} log entries
                    </p>
                    <motion.button
                      onClick={clearConsole}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-apex-white/60 hover:text-apex-white bg-apex-white/5 hover:bg-apex-white/10 rounded-lg border border-apex-white/10"
                      {...buttonHoverProps}
                    >
                      <RefreshCw size={14} />
                      Clear
                    </motion.button>
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    {consoleLogs.length === 0 ? (
                      <p className="text-apex-white/40 text-center py-8">
                        No console logs yet
                      </p>
                    ) : (
                      consoleLogs.map((log) => {
                        const colorClass = {
                          log: 'text-apex-white/80',
                          error: 'text-apex-red',
                          warn: 'text-amber-400',
                          info: 'text-apex-green',
                        }[log.type];

                        return (
                          <div
                            key={log.id}
                            className="p-2 rounded bg-apex-white/5 border border-apex-white/10"
                          >
                            <div className="flex items-start gap-2">
                              <span className={`text-[10px] ${colorClass} flex-shrink-0`}>
                                {log.type.toUpperCase()}
                              </span>
                              <span className="text-apex-white/40 flex-shrink-0">
                                {log.timestamp.toLocaleTimeString()}
                              </span>
                              <span className={`flex-1 ${colorClass} break-words`}>
                                {log.message}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={consoleEndRef} />
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

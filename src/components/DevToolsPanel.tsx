import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Database, RefreshCw, Copy, Check, Download, Search, Filter } from 'lucide-react';
import { useRideStore } from '../stores/useRideStore';
import { useThemeStore } from '../stores/useThemeStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useAppUpdateStore } from '../stores/useAppUpdateStore';
import { isDev } from '../lib/devtools';
import { buttonHoverProps } from '../lib/animations';
import { logger } from '../lib/logger';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { apexToast } from '../lib/toast';

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

  // Get all store states
  const rideStore = useRideStore();
  const themeStore = useThemeStore();
  const notificationStore = useNotificationStore();
  const appUpdateStore = useAppUpdateStore();

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

      // Use setTimeout to defer setState call and avoid "setState during render" error
      // This ensures setState is called outside of the render phase
      setTimeout(() => {
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
      }, 0);
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
  }, []); // Run once on mount, not dependent on isOpen

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

  // Auto-scroll console to bottom when new logs arrive
  useEffect(() => {
    if (activeTab === 'console' && consoleEndRef.current && filteredLogs.length > 0) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs.length, activeTab, filteredLogs.length]);

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
                  {/* Logger Session Info */}
                  <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20">
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
                  <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20">
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
                  <div className="mb-4 relative">
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

                  <div className="flex items-center justify-between mb-4">
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

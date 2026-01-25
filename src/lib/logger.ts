/**
 * Apex Logger
 * 
 * A wrapper around loglevel that ensures logs are always written to console
 * and optionally persisted to a session file (for native platforms).
 * 
 * Features:
 * - Always logs to browser/devtools console
 * - File logging for native platforms (Capacitor)
 * - Session-based log files
 * - Log level filtering
 * - Structured logging support
 */

import log from 'loglevel';
import { Capacitor } from '@capacitor/core';
import { isDev } from './devtools';

// Log levels: trace, debug, info, warn, error, silent
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class ApexLogger {
  private sessionId: string;
  private rollingBuffer: LogEntry[] = [];
  private maxRollingEntries = 150;
  private rollingDirty = false;
  private sessionStart: Date;
  private fileLoggingEnabled = false;
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private isNative = Capacitor.isNativePlatform();

  constructor() {
    // Generate session ID for this app session
    this.sessionId = `apex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStart = new Date();
    
    // Set default log level based on environment
    const defaultLevel = isDev() ? 'debug' : 'warn';
    log.setLevel(defaultLevel);

    // Enable file logging for native platforms
    if (this.isNative) {
      this.enableFileLogging();
    }

    // Flush buffer periodically (every 30 seconds)
    if (this.fileLoggingEnabled) {
      this.flushInterval = setInterval(() => {
        this.flushLogs().catch((err) => {
          // Silently fail - don't break app if logging fails
          console.error('Failed to flush logs:', err);
        });
      }, 30000);
    }

    // Flush logs on page unload (web) or app pause (native)
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushLogs().catch(() => {});
      });
    }
  }

  /**
   * Enable file logging for native platforms
   */
  private async enableFileLogging(): Promise<void> {
    try {
      // Dynamically import Capacitor Filesystem to avoid issues in web builds
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      // Verify we can write to the cache directory
      const testPath = `apex-logs/${this.sessionId}.log`;
      const testData = this.formatRollingLogText();
      const base64TestData = btoa(unescape(encodeURIComponent(testData)));
      await Filesystem.writeFile({
        path: testPath,
        data: base64TestData,
        directory: Directory.Cache,
        recursive: true,
      });

      this.fileLoggingEnabled = true;
      this.info('File logging enabled', { sessionId: this.sessionId });
    } catch (error) {
      // File logging failed, continue with console-only logging
      console.warn('File logging not available:', error);
      this.fileLoggingEnabled = false;
    }
  }

  private addToRollingBuffer(entry: LogEntry): void {
    this.rollingBuffer.push(entry);
    if (this.rollingBuffer.length > this.maxRollingEntries) {
      this.rollingBuffer = this.rollingBuffer.slice(-this.maxRollingEntries);
    }
    this.rollingDirty = true;
  }

  private formatRollingLogText(): string {
    const header = `# Apex Log Session: ${this.sessionId}\n# Started: ${this.sessionStart.toISOString()}\n# Exported: ${new Date().toISOString()}\n# Total Logs: ${this.rollingBuffer.length}\n\n`;
    const logLines = this.rollingBuffer.map((entry) =>
      `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${
        entry.data ? ` ${JSON.stringify(entry.data)}` : ''
      }`
    );
    return header + logLines.join('\n') + (logLines.length > 0 ? '\n' : '');
  }

  private async writeRollingToFile(): Promise<void> {
    if (!this.fileLoggingEnabled || !this.isNative || !this.rollingDirty) {
      return;
    }

    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const logPath = `apex-logs/${this.sessionId}.log`;
    const logText = this.formatRollingLogText();
    const base64Data = btoa(unescape(encodeURIComponent(logText)));

    await Filesystem.writeFile({
      path: logPath,
      data: base64Data,
      directory: Directory.Cache,
      recursive: true,
    });

    this.rollingDirty = false;
  }

  /**
   * Flush buffered logs to file
   */
  private async flushLogs(): Promise<void> {
    if (!this.fileLoggingEnabled) {
      return;
    }

    try {
      await this.writeRollingToFile();
    } catch (error) {
      // Disable file logging if it keeps failing
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code?: string }).code;
        // If it's a base64 error, disable file logging to prevent spam
        if (errorCode === 'OS-PLUG-FILE-0013') {
          this.fileLoggingEnabled = false;
          console.warn('File logging disabled due to encoding errors');
        }
      }
      console.error('Failed to flush logs:', error);
    }
  }

  /**
   * Create a log entry
   */
  private createEntry(level: LogLevel, message: string, ...args: unknown[]): LogEntry {
    const data = args.length > 0 ? (args.length === 1 ? args[0] : args) : undefined;
    
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
  }

  /**
   * Check if a log level should be displayed based on current log level
   */
  private shouldLog(level: LogLevel): boolean {
    const levelOrder: Record<LogLevel | 'silent', number> = {
      trace: 0,
      debug: 1,
      info: 2,
      warn: 3,
      error: 4,
      silent: 5,
    };
    
    const currentLevel = this.getLevel();
    const currentLevelOrder = levelOrder[currentLevel] ?? 3; // Default to warn
    const logLevelOrder = levelOrder[level] ?? 3;
    
    return logLevelOrder >= currentLevelOrder;
  }

  /**
   * Log at trace level
   */
  trace(message: string, ...args: unknown[]): void {
    const entry = this.createEntry('trace', message, ...args);
    // Call console.trace directly so DevToolsPanel intercepts can catch it
    // This ensures logs appear in DevToolsPanel on web
    // Only call if log level allows it
    if (this.shouldLog('trace') && typeof console !== 'undefined' && console.trace) {
      console.trace(message, ...args);
    }
    
    if (this.shouldLog('trace')) {
      this.addToRollingBuffer(entry);
    }
  }

  /**
   * Log at debug level
   */
  debug(message: string, ...args: unknown[]): void {
    const entry = this.createEntry('debug', message, ...args);
    // Call console.debug directly so DevToolsPanel intercepts can catch it
    // This ensures logs appear in DevToolsPanel on web
    // Only call if log level allows it
    if (this.shouldLog('debug') && typeof console !== 'undefined' && console.debug) {
      console.debug(message, ...args);
    }
    
    if (this.shouldLog('debug')) {
      this.addToRollingBuffer(entry);
    }
  }

  /**
   * Log at info level
   */
  info(message: string, ...args: unknown[]): void {
    const entry = this.createEntry('info', message, ...args);
    // Call console.info directly so DevToolsPanel intercepts can catch it
    // This ensures logs appear in DevToolsPanel on web
    // Only call if log level allows it
    if (this.shouldLog('info') && typeof console !== 'undefined' && console.info) {
      console.info(message, ...args);
    }
    
    if (this.shouldLog('info')) {
      this.addToRollingBuffer(entry);
    }
  }

  /**
   * Log at warn level
   */
  warn(message: string, ...args: unknown[]): void {
    const entry = this.createEntry('warn', message, ...args);
    // Call console.warn directly so DevToolsPanel intercepts can catch it
    // This ensures logs appear in DevToolsPanel on web
    // Only call if log level allows it
    if (this.shouldLog('warn') && typeof console !== 'undefined' && console.warn) {
      console.warn(message, ...args);
    }
    
    if (this.shouldLog('warn')) {
      this.addToRollingBuffer(entry);
    }
  }

  /**
   * Log at error level
   */
  error(message: string, ...args: unknown[]): void {
    const entry = this.createEntry('error', message, ...args);
    // Call console.error directly so DevToolsPanel intercepts can catch it
    // This ensures logs appear in DevToolsPanel on web
    // Only call if log level allows it
    if (this.shouldLog('error') && typeof console !== 'undefined' && console.error) {
      console.error(message, ...args);
    }
    
    if (this.shouldLog('error')) {
      this.addToRollingBuffer(entry);
    }

    // Always flush errors immediately
    if (this.fileLoggingEnabled && this.shouldLog('error')) {
      this.writeRollingToFile().catch(() => {});
    }
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel | 'silent'): void {
    log.setLevel(level);
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    const numericLevel = log.getLevel();
    // loglevel returns: 0=trace, 1=debug, 2=info, 3=warn, 4=error, 5=silent
    const levelMap: Record<number, LogLevel> = {
      0: 'trace',
      1: 'debug',
      2: 'info',
      3: 'warn',
      4: 'error',
    };
    return levelMap[numericLevel] ?? 'warn'; // Default to 'warn' if unknown
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get log file path (native platforms only)
   */
  async getLogFilePath(): Promise<string | null> {
    if (!this.isNative || !this.fileLoggingEnabled) {
      return null;
    }

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const logPath = `apex-logs/${this.sessionId}.log`;
      const uri = await Filesystem.getUri({
        path: logPath,
        directory: Directory.Cache,
      });
      return uri.uri;
    } catch (error) {
      // Use console.error to avoid circular reference
      console.error('Failed to get log file path:', error);
      return null;
    }
  }

  /**
   * Read log file content (native platforms only)
   */
  async getLogFileContent(): Promise<string | null> {
    if (!this.isNative || !this.fileLoggingEnabled) {
      return null;
    }

    try {
      // Flush any buffered logs first
      await this.flushLogs();
      await this.writeRollingToFile();

      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const logPath = `apex-logs/${this.sessionId}.log`;
      const result = await Filesystem.readFile({
        path: logPath,
        directory: Directory.Cache,
      });
      return result.data as string;
    } catch (error) {
      // Use console.error to avoid circular reference
      console.error('Failed to read log file:', error);
      return null;
    }
  }

  getRecentLogsText(): string {
    return this.formatRollingLogText();
  }

  /**
   * Export all console logs as text (for web or when file reading fails)
   */
  exportLogsAsText(logs: Array<{ type: string; message: string; timestamp: Date }>): string {
    const header = `# Apex Log Export\n# Session ID: ${this.sessionId}\n# Exported: ${new Date().toISOString()}\n# Total Logs: ${logs.length}\n\n`;
    const logLines = logs.map((log) => {
      const timestamp = log.timestamp.toISOString();
      return `[${timestamp}] ${log.type.toUpperCase()}: ${log.message}`;
    });
    return header + logLines.join('\n');
  }

  /**
   * Cleanup: flush remaining logs and clear interval
   */
  async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flushLogs();
  }
}

// Create singleton instance
export const logger = new ApexLogger();

// Export convenience methods
export const { trace, debug, info, warn, error, setLevel, getLevel, exportLogsAsText } = logger;

// Export default logger instance
export default logger;

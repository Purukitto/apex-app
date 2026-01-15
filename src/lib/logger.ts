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
  private logBuffer: LogEntry[] = [];
  private fileLoggingEnabled = false;
  private maxBufferSize = 1000; // Max entries before flushing
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private isNative = Capacitor.isNativePlatform();

  constructor() {
    // Generate session ID for this app session
    this.sessionId = `apex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
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
      await Filesystem.writeFile({
        path: testPath,
        data: `# Apex Log Session: ${this.sessionId}\n# Started: ${new Date().toISOString()}\n\n`,
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

  /**
   * Write log entry to file (native platforms only)
   */
  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.fileLoggingEnabled || !this.isNative) {
      return;
    }

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const logPath = `apex-logs/${this.sessionId}.log`;
      
      // Format log entry
      const logLine = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${
        entry.data ? ` ${JSON.stringify(entry.data)}` : ''
      }\n`;

      // Append to file
      await Filesystem.appendFile({
        path: logPath,
        data: logLine,
        directory: Directory.Cache,
      });
    } catch (error) {
      // Silently fail - don't break app if file logging fails
      console.error('Failed to write log to file:', error);
    }
  }

  /**
   * Flush buffered logs to file
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.fileLoggingEnabled) {
      return;
    }

    const entries = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const logPath = `apex-logs/${this.sessionId}.log`;
      
      const logLines = entries.map(
        (entry) =>
          `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${
            entry.data ? ` ${JSON.stringify(entry.data)}` : ''
          }\n`
      ).join('');

      await Filesystem.appendFile({
        path: logPath,
        data: logLines,
        directory: Directory.Cache,
      });
    } catch (error) {
      // Re-add entries to buffer if flush failed
      this.logBuffer.unshift(...entries);
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
   * Log at trace level
   */
  trace(message: string, ...args: unknown[]): void {
    const entry = this.createEntry('trace', message, ...args);
    log.trace(message, ...args);
    
    if (this.fileLoggingEnabled) {
      this.logBuffer.push(entry);
      if (this.logBuffer.length >= this.maxBufferSize) {
        this.flushLogs().catch(() => {});
      }
    }
  }

  /**
   * Log at debug level
   */
  debug(message: string, ...args: unknown[]): void {
    const entry = this.createEntry('debug', message, ...args);
    log.debug(message, ...args);
    
    if (this.fileLoggingEnabled) {
      this.logBuffer.push(entry);
      if (this.logBuffer.length >= this.maxBufferSize) {
        this.flushLogs().catch(() => {});
      }
    }
  }

  /**
   * Log at info level
   */
  info(message: string, ...args: unknown[]): void {
    const entry = this.createEntry('info', message, ...args);
    log.info(message, ...args);
    
    if (this.fileLoggingEnabled) {
      this.logBuffer.push(entry);
      if (this.logBuffer.length >= this.maxBufferSize) {
        this.flushLogs().catch(() => {});
      }
    }
  }

  /**
   * Log at warn level
   */
  warn(message: string, ...args: unknown[]): void {
    const entry = this.createEntry('warn', message, ...args);
    log.warn(message, ...args);
    
    if (this.fileLoggingEnabled) {
      this.logBuffer.push(entry);
      if (this.logBuffer.length >= this.maxBufferSize) {
        this.flushLogs().catch(() => {});
      }
    }
  }

  /**
   * Log at error level
   */
  error(message: string, ...args: unknown[]): void {
    const entry = this.createEntry('error', message, ...args);
    log.error(message, ...args);
    
    // Always flush errors immediately
    if (this.fileLoggingEnabled) {
      this.writeToFile(entry).catch(() => {});
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
    return log.getLevel() as LogLevel;
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
    } catch {
      return null;
    }
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
export const { trace, debug, info, warn, error, setLevel, getLevel } = logger;

// Export default logger instance
export default logger;

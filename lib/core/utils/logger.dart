import 'dart:collection';

import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart';

/// App-wide logger. Use AppLogger.d/i/w/e/t — never use print() or debugPrint().
///
/// Also buffers recent log lines for bug reports via [getRecentLogsText].
class AppLogger {
  AppLogger._();

  static const int _maxBufferLines = 150;
  static final _buffer = Queue<String>();

  static final Logger _logger = Logger(
    level: kDebugMode ? Level.trace : Level.warning,
    printer: PrettyPrinter(
      methodCount: 0,
      dateTimeFormat: DateTimeFormat.onlyTimeAndSinceStart,
      colors: true,
      printEmojis: true,
    ),
    output: _BufferedOutput(_buffer, _maxBufferLines),
  );

  /// Trace — very verbose, lowest severity
  static void t(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    _logger.t(message, error: error, stackTrace: stackTrace);
  }

  /// Debug
  static void d(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    _logger.d(message, error: error, stackTrace: stackTrace);
  }

  /// Info
  static void i(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    _logger.i(message, error: error, stackTrace: stackTrace);
  }

  /// Warning
  static void w(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    _logger.w(message, error: error, stackTrace: stackTrace);
  }

  /// Error
  static void e(dynamic message, [dynamic error, StackTrace? stackTrace]) {
    _logger.e(message, error: error, stackTrace: stackTrace);
  }

  /// Returns the last [_maxBufferLines] log lines as plain text.
  static String getRecentLogsText() {
    if (_buffer.isEmpty) return 'No logs available.';
    return _buffer.join('\n');
  }
}

/// Custom [LogOutput] that writes to console AND buffers lines.
class _BufferedOutput extends LogOutput {
  _BufferedOutput(this._buffer, this._maxLines);

  final Queue<String> _buffer;
  final int _maxLines;

  @override
  void output(OutputEvent event) {
    for (final line in event.lines) {
      // Console output (debug only)
      if (kDebugMode) debugPrint(line);

      // Buffer for bug reports (strip ANSI color codes)
      final clean = line.replaceAll(RegExp(r'\x1B\[[0-9;]*m'), '');
      _buffer.addLast(clean);
      while (_buffer.length > _maxLines) {
        _buffer.removeFirst();
      }
    }
  }
}

import 'dart:async';

import 'package:sensors_plus/sensors_plus.dart';

import '../utils/logger.dart';

/// Accelerometer stream wrapper using sensors_plus.
class MotionService {
  StreamSubscription<AccelerometerEvent>? _subscription;

  /// Start listening to accelerometer events.
  /// Returns a stream of [AccelerometerEvent] at ~100ms intervals.
  Stream<AccelerometerEvent> startListening() {
    AppLogger.i('Starting accelerometer');
    return accelerometerEventStream(
      samplingPeriod: const Duration(milliseconds: 100),
    );
  }

  /// Stop listening to accelerometer events.
  void stopListening() {
    _subscription?.cancel();
    _subscription = null;
    AppLogger.i('Accelerometer stopped');
  }

  void dispose() {
    stopListening();
  }
}

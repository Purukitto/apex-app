import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../../../core/providers/shared_prefs_provider.dart';
import '../../../core/services/foreground_service.dart';
import '../../../core/services/location_service.dart';
import '../../../core/services/motion_service.dart';
import '../../../core/utils/logger.dart';
import '../services/pocket_detector.dart';
import 'ride_session_provider.dart';

/// Auto-pause after 5 minutes of no movement.
const _autoPauseDuration = Duration(minutes: 5);

/// Orchestrates GPS + motion streams based on ride session status.
/// Watches rideSessionProvider and starts/stops streams accordingly.
class RideTrackingNotifier extends Notifier<void> {
  final LocationService _locationService = LocationService();
  final MotionService _motionService = MotionService();
  final ForegroundService _foregroundService = ForegroundService();
  final PocketDetector _pocketDetector = PocketDetector();

  StreamSubscription<Position>? _gpsSub;
  StreamSubscription<AccelerometerEvent>? _motionSub;
  StreamSubscription<bool>? _pocketSub;
  Timer? _autoPauseTimer;

  // Latest raw accelerometer values for calibration
  double _lastAccelX = 0;
  double _lastAccelY = 0;
  double _lastAccelZ = 0;

  double get lastAccelX => _lastAccelX;
  double get lastAccelY => _lastAccelY;
  double get lastAccelZ => _lastAccelZ;

  @override
  void build() {
    ref.listen(rideSessionProvider.select((s) => s.status), (previous, next) {
      _onStatusChanged(previous, next);
    });

    ref.onDispose(() {
      _stopAll();
    });
  }

  void _onStatusChanged(RideStatus? previous, RideStatus next) {
    switch (next) {
      case RideStatus.recording:
        if (previous == RideStatus.countdown) {
          _startAll();
        } else if (previous == RideStatus.paused) {
          _resumeStreams();
        }
      case RideStatus.paused:
        _pauseStreams();
      case RideStatus.idle:
      case RideStatus.saving:
        if (previous == RideStatus.recording || previous == RideStatus.paused) {
          _stopAll();
        }
      case RideStatus.countdown:
        break;
    }
  }

  Future<void> _startAll() async {
    AppLogger.i('Starting all tracking services');

    // Keep screen on
    await WakelockPlus.enable();

    // Foreground service
    await _foregroundService.startService();

    // GPS
    _gpsSub = _locationService.startTracking().listen((position) {
      final session = ref.read(rideSessionProvider);
      if (session.status == RideStatus.recording) {
        ref.read(rideSessionProvider.notifier).addCoordinate(position);
        _handleAutoPause(position.speed);
      }
    }, onError: (e) => AppLogger.e('GPS error', e));

    // Accelerometer
    final prefs = ref.read(sharedPrefsProvider);
    final offset = ref
        .read(rideSessionProvider.notifier)
        .getCalibrationOffset(prefs);

    _motionSub = _motionService.startListening().listen((event) {
      _lastAccelX = event.x;
      _lastAccelY = event.y;
      _lastAccelZ = event.z;

      final session = ref.read(rideSessionProvider);
      if (session.status == RideStatus.recording) {
        ref
            .read(rideSessionProvider.notifier)
            .updateLean(event.x, event.y, event.z, offset);
      }
    }, onError: (e) => AppLogger.e('Accelerometer error', e));

    // Pocket mode
    _pocketSub = _pocketDetector.startListening().listen((isNear) {
      final session = ref.read(rideSessionProvider);
      if (session.isRecordingOrPaused) {
        ref.read(rideSessionProvider.notifier).setPocketMode(isNear);
      }
    }, onError: (e) => AppLogger.e('Proximity error', e));
  }

  void _pauseStreams() {
    // Pause motion (keep GPS running for auto-resume detection)
    _motionSub?.pause();
    _pocketSub?.pause();
    _autoPauseTimer?.cancel();
    AppLogger.i('Tracking paused');
  }

  void _resumeStreams() {
    _motionSub?.resume();
    _pocketSub?.resume();
    AppLogger.i('Tracking resumed');
  }

  Future<void> _stopAll() async {
    _gpsSub?.cancel();
    _gpsSub = null;
    _motionSub?.cancel();
    _motionSub = null;
    _pocketSub?.cancel();
    _pocketSub = null;
    _autoPauseTimer?.cancel();
    _autoPauseTimer = null;

    _locationService.stopTracking();
    _motionService.stopListening();
    _pocketDetector.stopListening();

    await _foregroundService.stopService();
    await WakelockPlus.disable();

    AppLogger.i('All tracking services stopped');
  }

  void _handleAutoPause(double speedMs) {
    if (speedMs > 0) {
      _autoPauseTimer?.cancel();
      _autoPauseTimer = null;

      // Auto-resume if paused
      final session = ref.read(rideSessionProvider);
      if (session.status == RideStatus.paused) {
        ref.read(rideSessionProvider.notifier).resume();
      }
      return;
    }

    // Speed is 0 — start countdown if not already running
    _autoPauseTimer ??= Timer(_autoPauseDuration, () {
      final session = ref.read(rideSessionProvider);
      if (session.status == RideStatus.recording) {
        ref.read(rideSessionProvider.notifier).pause();
        AppLogger.i('Auto-paused: stationary for 5 minutes');
      }
    });
  }
}

final rideTrackingProvider = NotifierProvider<RideTrackingNotifier, void>(
  RideTrackingNotifier.new,
);

import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/database/app_database.dart';
import '../../../core/utils/geo_utils.dart';
import '../../../core/utils/logger.dart';

// ──────────────────────────────────────────────────────────────────
// State
// ──────────────────────────────────────────────────────────────────

enum RideStatus { idle, countdown, recording, paused, saving }

class RideCoord {
  const RideCoord({
    required this.lat,
    required this.lon,
    required this.speedMs,
    required this.timestamp,
  });

  final double lat;
  final double lon;
  final double? speedMs;
  final DateTime timestamp;
}

class RideSessionState {
  const RideSessionState({
    this.status = RideStatus.idle,
    this.selectedBike,
    this.coords = const [],
    this.currentSpeedKmh = 0,
    this.currentLean = 0,
    this.maxLeanLeft = 0,
    this.maxLeanRight = 0,
    this.distanceKm = 0,
    this.currentElevation = 0,
    this.startTime,
    this.isPocketMode = false,
    this.leanDirection = 'straight',
  });

  final RideStatus status;
  final Bike? selectedBike;
  final List<RideCoord> coords;
  final double currentSpeedKmh;
  final double currentLean;
  final double maxLeanLeft;
  final double maxLeanRight;
  final double distanceKm;
  final double currentElevation;
  final DateTime? startTime;
  final bool isPocketMode;
  final String leanDirection; // 'left', 'right', 'straight'

  RideSessionState copyWith({
    RideStatus? status,
    Bike? selectedBike,
    bool clearBike = false,
    List<RideCoord>? coords,
    double? currentSpeedKmh,
    double? currentLean,
    double? maxLeanLeft,
    double? maxLeanRight,
    double? distanceKm,
    double? currentElevation,
    DateTime? startTime,
    bool? isPocketMode,
    String? leanDirection,
  }) {
    return RideSessionState(
      status: status ?? this.status,
      selectedBike: clearBike ? null : (selectedBike ?? this.selectedBike),
      coords: coords ?? this.coords,
      currentSpeedKmh: currentSpeedKmh ?? this.currentSpeedKmh,
      currentLean: currentLean ?? this.currentLean,
      maxLeanLeft: maxLeanLeft ?? this.maxLeanLeft,
      maxLeanRight: maxLeanRight ?? this.maxLeanRight,
      distanceKm: distanceKm ?? this.distanceKm,
      currentElevation: currentElevation ?? this.currentElevation,
      startTime: startTime ?? this.startTime,
      isPocketMode: isPocketMode ?? this.isPocketMode,
      leanDirection: leanDirection ?? this.leanDirection,
    );
  }

  bool get isRecordingOrPaused =>
      status == RideStatus.recording || status == RideStatus.paused;

  bool get isActive =>
      status == RideStatus.countdown ||
      status == RideStatus.recording ||
      status == RideStatus.paused ||
      status == RideStatus.saving;
}

// ──────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────

const double _emaAlpha = 0.15;
const double _maxLeanAngle = 70.0;
const double _motionLockSpeedKmh = 10.0;
const String calibrationKey = 'apex-calibration-offset';

// ──────────────────────────────────────────────────────────────────
// Notifier
// ──────────────────────────────────────────────────────────────────

class RideSessionNotifier extends Notifier<RideSessionState> {
  double _previousLean = 0;

  @override
  RideSessionState build() => const RideSessionState();

  // ── Bike selection ──

  void selectBike(Bike bike) {
    state = state.copyWith(selectedBike: bike);
    AppLogger.i('Bike selected: ${bike.nickName ?? bike.make}');
  }

  void clearBike() {
    state = state.copyWith(clearBike: true);
  }

  // ── Recording lifecycle ──

  void startCountdown() {
    state = state.copyWith(status: RideStatus.countdown);
  }

  void onRecordingStarted() {
    state = state.copyWith(
      status: RideStatus.recording,
      startTime: DateTime.now(),
      coords: [],
      distanceKm: 0,
      currentSpeedKmh: 0,
      currentLean: 0,
      maxLeanLeft: 0,
      maxLeanRight: 0,
      currentElevation: 0,
    );
    _previousLean = 0;
    AppLogger.i('Recording started');
  }

  void pause() {
    state = state.copyWith(status: RideStatus.paused);
    AppLogger.i('Ride paused');
  }

  void resume() {
    state = state.copyWith(status: RideStatus.recording);
    AppLogger.i('Ride resumed');
  }

  void setSaving() {
    state = state.copyWith(status: RideStatus.saving);
  }

  void reset() {
    _previousLean = 0;
    state = const RideSessionState();
    AppLogger.i('Ride session reset');
  }

  // ── GPS data ──

  void addCoordinate(Position position) {
    final coord = RideCoord(
      lat: position.latitude,
      lon: position.longitude,
      speedMs: position.speed >= 0 ? position.speed : null,
      timestamp: position.timestamp,
    );

    final newCoords = [...state.coords, coord];

    // Calculate incremental distance
    double newDistance = state.distanceKm;
    if (state.coords.isNotEmpty) {
      final prev = state.coords.last;
      final segmentKm = haversineDistance(
        prev.lat,
        prev.lon,
        coord.lat,
        coord.lon,
      );
      // Round to 2 decimal places
      newDistance =
          (((newDistance + segmentKm) * 100).round() / 100).toDouble();
    }

    // Speed: m/s → km/h
    final speedKmh = (coord.speedMs ?? 0) * 3.6;

    state = state.copyWith(
      coords: newCoords,
      distanceKm: newDistance,
      currentSpeedKmh: speedKmh,
      currentElevation: position.altitude,
    );
  }

  // ── Lean angle ──

  void updateLean(double accelX, double accelY, double accelZ,
      double calibrationOffset) {
    // Don't process lean if paused
    if (state.status != RideStatus.recording) return;

    // Calculate roll from accelerometer
    final rollRad = atan2(accelX, sqrt(accelY * accelY + accelZ * accelZ));
    final rollDeg = rollRad * (180 / pi);
    final calibrated = rollDeg - calibrationOffset;

    // EMA smoothing
    final smoothed = _emaAlpha * calibrated + (1 - _emaAlpha) * _previousLean;
    _previousLean = smoothed;

    // Motion lock: force lean to 0 below speed threshold
    final motionLocked = state.currentSpeedKmh < _motionLockSpeedKmh;
    final processedAngle =
        motionLocked ? 0.0 : min(smoothed.abs(), _maxLeanAngle);

    // Round to 1 decimal place
    final rounded = (processedAngle * 10).round() / 10;

    // Determine direction
    String direction = 'straight';
    if (!motionLocked && rounded > 0) {
      direction = calibrated < 0 ? 'left' : 'right';
    }

    // Update max lean (only when not motion-locked)
    double newMaxLeft = state.maxLeanLeft;
    double newMaxRight = state.maxLeanRight;
    if (!motionLocked && rounded > 0) {
      if (calibrated < 0 && rounded > newMaxLeft) {
        newMaxLeft = rounded;
      } else if (calibrated >= 0 && rounded > newMaxRight) {
        newMaxRight = rounded;
      }
    }

    state = state.copyWith(
      currentLean: rounded,
      maxLeanLeft: newMaxLeft,
      maxLeanRight: newMaxRight,
      leanDirection: direction,
    );
  }

  // ── Calibration ──

  Future<void> calibrate(
      double currentX, double currentY, double currentZ,
      SharedPreferences prefs) async {
    final rollRad =
        atan2(currentX, sqrt(currentY * currentY + currentZ * currentZ));
    final rollDeg = rollRad * (180 / pi);
    await prefs.setDouble(calibrationKey, rollDeg);
    AppLogger.i('Calibration offset set: $rollDeg');
  }

  double getCalibrationOffset(SharedPreferences prefs) {
    return prefs.getDouble(calibrationKey) ?? 0.0;
  }

  // ── Pocket mode ──

  void setPocketMode(bool value) {
    state = state.copyWith(isPocketMode: value);
  }
}

// ──────────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────────

final rideSessionProvider =
    NotifierProvider<RideSessionNotifier, RideSessionState>(
  RideSessionNotifier.new,
);

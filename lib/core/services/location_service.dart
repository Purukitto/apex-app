import 'dart:async';

import 'package:geolocator/geolocator.dart';

import '../utils/logger.dart';

/// GPS stream wrapper using geolocator.
class LocationService {
  StreamSubscription<Position>? _subscription;

  /// Check and request location permission. Returns true if granted.
  Future<bool> checkAndRequestPermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      AppLogger.w('Location services disabled');
      return false;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        AppLogger.w('Location permission denied');
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      AppLogger.w('Location permission permanently denied');
      return false;
    }

    return true;
  }

  /// Start GPS tracking. Returns a broadcast stream of positions.
  Stream<Position> startTracking() {
    AppLogger.i('Starting GPS tracking');

    const settings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 5,
    );

    return Geolocator.getPositionStream(locationSettings: settings);
  }

  /// Stop GPS tracking and cancel the subscription.
  void stopTracking() {
    _subscription?.cancel();
    _subscription = null;
    AppLogger.i('GPS tracking stopped');
  }

  void dispose() {
    stopTracking();
  }
}

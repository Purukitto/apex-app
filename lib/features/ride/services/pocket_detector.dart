import 'dart:async';
import 'dart:io';

import 'package:proximity_sensor/proximity_sensor.dart';

import '../../../core/utils/logger.dart';

/// Uses proximity sensor to detect pocket mode (Android only).
/// proximityValue == 0 means NEAR (covered) → pocket mode active.
///
/// Debounces sensor noise (300ms) and requires minimum covered duration
/// (500ms) before activating to prevent false triggers.
class PocketDetector {
  StreamSubscription<bool>? _subscription;

  /// Start listening to proximity sensor.
  /// Emits true when phone is covered, false when uncovered.
  /// Returns empty stream on iOS.
  Stream<bool> startListening() {
    if (!Platform.isAndroid) {
      AppLogger.d('Pocket mode: skipped on non-Android');
      return const Stream.empty();
    }

    AppLogger.i('Starting pocket mode detection');

    // Debounce raw sensor events (300ms) to filter noise,
    // then require 500ms of sustained "covered" before emitting true.
    bool lastEmitted = false;
    Timer? coveredTimer;

    final controller = StreamController<bool>.broadcast(
      onCancel: () {
        coveredTimer?.cancel();
      },
    );

    _subscription = ProximitySensor.events
        .map((value) => value > 0)
        .distinct()
        .transform(
          StreamTransformer<bool, bool>.fromHandlers(
            handleData: (isCovered, sink) {
              coveredTimer?.cancel();

              if (isCovered) {
                // Wait 500ms of sustained coverage before activating
                AppLogger.d('Pocket sensor: covered, waiting 500ms…');
                coveredTimer = Timer(const Duration(milliseconds: 500), () {
                  AppLogger.d('Pocket mode: ACTIVATED (sustained cover)');
                  sink.add(true);
                });
              } else {
                // Uncovered: debounce 300ms to avoid flicker
                AppLogger.d('Pocket sensor: uncovered, debouncing 300ms…');
                coveredTimer = Timer(const Duration(milliseconds: 300), () {
                  AppLogger.d('Pocket mode: DEACTIVATED');
                  sink.add(false);
                });
              }
            },
          ),
        )
        .distinct()
        .listen(
          (value) {
            if (value != lastEmitted) {
              lastEmitted = value;
              controller.add(value);
            }
          },
          onError: (e) => controller.addError(e),
          onDone: () => controller.close(),
        );

    return controller.stream;
  }

  /// Stop listening.
  void stopListening() {
    _subscription?.cancel();
    _subscription = null;
    AppLogger.i('Pocket mode detection stopped');
  }

  void dispose() {
    stopListening();
  }
}

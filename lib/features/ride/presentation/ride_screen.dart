import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibration/vibration.dart';

import '../../../core/database/app_database.dart';
import '../../../core/providers/shared_prefs_provider.dart';
import '../../../core/services/location_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/logger.dart';
import '../../../core/utils/toast.dart';
import '../../../core/widgets/apex_button.dart';
import '../../../core/widgets/confirm_dialog.dart';
import '../../../core/widgets/glass_card.dart';
import '../../garage/providers/bikes_provider.dart';
import '../providers/ride_actions_provider.dart';
import '../providers/ride_session_provider.dart';
import '../providers/ride_tracking_provider.dart';
import 'widgets/bike_selection_modal.dart';
import 'widgets/pocket_curtain.dart';
import 'widgets/ride_controls.dart';
import 'widgets/ride_hud.dart';
import 'widgets/ride_startup_animation.dart';

class RideScreen extends ConsumerStatefulWidget {
  const RideScreen({super.key});

  @override
  ConsumerState<RideScreen> createState() => _RideScreenState();
}

class _RideScreenState extends ConsumerState<RideScreen> {
  bool _showSafetyWarning = false;

  @override
  void initState() {
    super.initState();
    // Activate tracking provider (it listens to session status changes)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(rideTrackingProvider);
      _autoSelectSingleBike();
    });
  }

  /// Auto-select bike on page load when only one bike exists.
  void _autoSelectSingleBike() {
    final session = ref.read(rideSessionProvider);
    if (session.selectedBike != null) return;
    if (session.status != RideStatus.idle) return;

    final bikes = ref.read(bikesStreamProvider).value ?? [];
    if (bikes.length == 1) {
      ref.read(rideSessionProvider.notifier).selectBike(bikes.first);
      if (mounted) {
        ApexToast.success(
          context,
          'Auto-selected ${bikes.first.nickName ?? bikes.first.make}',
        );
      }
    }
  }

  Future<void> _startRide() async {
    final session = ref.read(rideSessionProvider);
    final bikes = ref.read(bikesStreamProvider).value ?? [];

    if (bikes.isEmpty) return;

    // Auto-select if only 1 bike
    if (session.selectedBike == null && bikes.length == 1) {
      ref.read(rideSessionProvider.notifier).selectBike(bikes.first);
      if (mounted) {
        ApexToast.success(
          context,
          'Auto-selected ${bikes.first.nickName ?? bikes.first.make}',
        );
      }
    }

    // Show bike selection modal if no bike selected
    final currentSession = ref.read(rideSessionProvider);
    if (currentSession.selectedBike == null) {
      final bike = await BikeSelectionModal.show(context, bikes);
      if (bike == null || !mounted) return;
      ref.read(rideSessionProvider.notifier).selectBike(bike);
    }

    // Check location permission
    final locationService = LocationService();
    final hasPermission = await locationService.checkAndRequestPermission();
    if (!hasPermission) {
      if (mounted) {
        ApexToast.error(
          context,
          'Location permission required to record rides',
        );
      }
      return;
    }

    // Start countdown animation
    ref.read(rideSessionProvider.notifier).startCountdown();
  }

  void _onStartupComplete() {
    ref.read(rideSessionProvider.notifier).onRecordingStarted();
    setState(() => _showSafetyWarning = true);
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) setState(() => _showSafetyWarning = false);
    });
  }

  Future<void> _onStop() async {
    try {
      await ApexToast.promise(
        context,
        ref.read(rideActionsProvider).saveRide(),
        loading: 'Saving ride...',
        success: 'Ride Saved',
      );
    } catch (e) {
      AppLogger.e('Failed to save ride', e);
    }
  }

  Future<void> _onDiscard() async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Discard Ride?',
      message:
          'This will discard your current ride data. This cannot be undone.',
      confirmLabel: 'Discard',
      isDestructive: true,
    );
    if (confirmed) {
      ref.read(rideActionsProvider).discardRide();
      if (mounted) ApexToast.success(context, 'Ride discarded');
    }
  }

  Future<void> _onCalibrate() async {
    final tracking = ref.read(rideTrackingProvider.notifier);
    final prefs = ref.read(sharedPrefsProvider);
    await ref
        .read(rideSessionProvider.notifier)
        .calibrate(
          tracking.lastAccelX,
          tracking.lastAccelY,
          tracking.lastAccelZ,
          prefs,
        );

    // Haptic feedback
    if ((await Vibration.hasVibrator()) == true) {
      Vibration.vibrate(duration: 50);
    }

    if (mounted) {
      ApexToast.success(context, 'Sensors Zeroed. Ready to lean.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(rideSessionProvider);
    final bikesAsync = ref.watch(bikesStreamProvider);

    return switch (session.status) {
      RideStatus.idle => _IdleView(
        bikesAsync: bikesAsync,
        session: session,
        onSelectBike: () async {
          final bikes = bikesAsync.value ?? [];
          if (bikes.isEmpty) return;
          final bike = await BikeSelectionModal.show(context, bikes);
          if (bike != null) {
            ref.read(rideSessionProvider.notifier).selectBike(bike);
          }
        },
        onStart: _startRide,
      ),
      RideStatus.countdown => RideStartupAnimation(
        onComplete: _onStartupComplete,
      ),
      RideStatus.recording || RideStatus.paused => _RecordingView(
        session: session,
        showSafetyWarning: _showSafetyWarning,
        onStop: _onStop,
        onDiscard: _onDiscard,
        onCalibrate: _onCalibrate,
        onDismissPocket: () {
          ref.read(rideSessionProvider.notifier).setPocketMode(false);
        },
      ),
      RideStatus.saving => Center(
        child: CircularProgressIndicator(color: context.accent),
      ),
    };
  }
}

// ──────────────────────────────────────────────────────────────────
// Idle View
// ──────────────────────────────────────────────────────────────────

class _IdleView extends StatelessWidget {
  const _IdleView({
    required this.bikesAsync,
    required this.session,
    required this.onSelectBike,
    required this.onStart,
  });

  final AsyncValue<List<Bike>> bikesAsync;
  final RideSessionState session;
  final VoidCallback onSelectBike;
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            Text('Ready to Ride', style: AppTypography.playfairDisplay),
            const SizedBox(height: 32),

            // Bike selector card
            bikesAsync.when(
              loading: () => Center(
                child: CircularProgressIndicator(color: context.accent),
              ),
              error: (e, _) => Text(
                'Error loading bikes',
                style: AppTypography.inter.copyWith(color: AppColors.error),
              ),
              data: (bikes) {
                if (bikes.isEmpty) return _NoBikesView();

                final selected = session.selectedBike;
                return GlassCard(
                  isAccent: selected != null,
                  child: GestureDetector(
                    onTap: onSelectBike,
                    behavior: HitTestBehavior.opaque,
                    child: Row(
                      children: [
                        Icon(
                          Icons.two_wheeler,
                          color: selected != null
                              ? context.accent
                              : AppColors.textMuted,
                          size: 28,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                selected != null
                                    ? (selected.nickName ??
                                          '${selected.make} ${selected.model}')
                                    : 'Select Bike',
                                style: AppTypography.inter,
                              ),
                              if (selected != null)
                                Text(
                                  '${selected.currentOdo.round()} km',
                                  style: AppTypography.interSecondary,
                                ),
                            ],
                          ),
                        ),
                        Icon(
                          Icons.chevron_right,
                          color: AppColors.textMuted,
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            const Spacer(),

            // Start button
            ApexButton(
              label: 'Start Ride',
              onPressed:
                  (session.selectedBike != null ||
                      (bikesAsync.value ?? []).isNotEmpty)
                  ? onStart
                  : null,
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _NoBikesView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        children: [
          const SizedBox(height: 48),
          Icon(Icons.two_wheeler, color: AppColors.textMuted, size: 64),
          const SizedBox(height: 16),
          Text(
            'No bikes in your garage',
            style: AppTypography.inter.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 8),
          Text(
            'Add a bike to start recording rides',
            style: AppTypography.interSecondary,
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────
// Recording View
// ──────────────────────────────────────────────────────────────────

class _RecordingView extends StatelessWidget {
  const _RecordingView({
    required this.session,
    required this.showSafetyWarning,
    required this.onStop,
    required this.onDiscard,
    required this.onCalibrate,
    required this.onDismissPocket,
  });

  final RideSessionState session;
  final bool showSafetyWarning;
  final VoidCallback onStop;
  final VoidCallback onDiscard;
  final VoidCallback onCalibrate;
  final VoidCallback onDismissPocket;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Main HUD + Controls
        Column(
          children: [
            Expanded(child: RideHud(state: session)),

            // Bottom controls
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
                child: Column(
                  children: [
                    // Calibrate + Discard row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CalibrateButton(onPressed: onCalibrate),
                        const SizedBox(width: 24),
                        DiscardButton(onPressed: onDiscard),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Wide stop button
                    LongPressStopButton(onStop: onStop),
                  ],
                ),
              ),
            ),
          ],
        ),

        // Safety warning overlay
        if (showSafetyWarning)
          Positioned(
            top: MediaQuery.of(context).padding.top + 48,
            left: 24,
            right: 24,
            child: _SafetyWarning(),
          ),

        // Pocket mode curtain
        if (session.isPocketMode)
          Positioned.fill(child: PocketCurtain(onDismiss: onDismissPocket)),
      ],
    );
  }
}

class _SafetyWarning extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: AppColors.warning, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Keep your eyes on the road',
              style: AppTypography.interSmall.copyWith(
                color: AppColors.warning,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

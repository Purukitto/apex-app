import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/database/app_database.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/format_utils.dart';
import '../../../../core/utils/geojson_parser.dart';
import '../../../../core/utils/share_utils.dart';
import '../../../../core/utils/toast.dart';
import '../../../../core/widgets/confirm_dialog.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/ride_map.dart';
import '../../providers/rides_provider.dart';
import 'edit_ride_sheet.dart';

class RideDetailSheet extends ConsumerWidget {
  const RideDetailSheet({
    super.key,
    required this.ride,
    this.bikeName,
  });

  final Ride ride;
  final String? bikeName;

  static Future<void> show(BuildContext context, Ride ride, {String? bikeName}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (_) => RideDetailSheet(ride: ride, bikeName: bikeName),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final routeData = parseRoutePath(ride.routePath);
    final displayName = ride.rideName ?? bikeName ?? 'Ride';

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.backgroundDark,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.textMuted,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Header
              Row(
                children: [
                  Expanded(
                    child: Text(
                      displayName,
                      style: AppTypography.playfairDisplay.copyWith(fontSize: 24),
                    ),
                  ),
                  Text(
                    formatRelativeDate(ride.startTime),
                    style: AppTypography.interSecondary,
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Stats row
              Row(
                children: [
                  Expanded(child: _StatMiniCard(
                    label: 'Distance',
                    value: '${ride.distanceKm.toStringAsFixed(1)} km',
                  )),
                  const SizedBox(width: 10),
                  Expanded(child: _StatMiniCard(
                    label: 'Duration',
                    value: formatDuration(ride.startTime, ride.endTime),
                  )),
                ],
              ),
              if (ride.maxLeanLeft != null || ride.maxLeanRight != null) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: _StatMiniCard(
                      label: 'Lean L',
                      value: '${ride.maxLeanLeft?.toStringAsFixed(1) ?? "-"}°',
                    )),
                    const SizedBox(width: 10),
                    Expanded(child: _StatMiniCard(
                      label: 'Lean R',
                      value: '${ride.maxLeanRight?.toStringAsFixed(1) ?? "-"}°',
                    )),
                  ],
                ),
              ],
              const SizedBox(height: 16),

              // Start/end times
              GlassCard(
                padding: const EdgeInsets.all(16),
                borderRadius: 16,
                child: Column(
                  children: [
                    _InfoRow('Started', formatDateTime(ride.startTime)),
                    if (ride.endTime != null) ...[
                      const SizedBox(height: 8),
                      _InfoRow('Ended', formatDateTime(ride.endTime!)),
                    ],
                  ],
                ),
              ),

              // Ride image
              if (ride.imageUrl != null && ride.imageUrl!.isNotEmpty) ...[
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(
                    ride.imageUrl!,
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => const SizedBox.shrink(),
                  ),
                ),
              ],

              // Notes
              if (ride.notes != null && ride.notes!.isNotEmpty) ...[
                const SizedBox(height: 16),
                GlassCard(
                  padding: const EdgeInsets.all(16),
                  borderRadius: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Notes', style: AppTypography.interLabel),
                      const SizedBox(height: 8),
                      Text(ride.notes!, style: AppTypography.inter.copyWith(fontSize: 14)),
                    ],
                  ),
                ),
              ],

              // Route map
              if (routeData != null && routeData.hasRoute) ...[
                const SizedBox(height: 16),
                RideMap(
                  routeData: routeData,
                  height: 300,
                  interactive: true,
                ),
              ],

              const SizedBox(height: 24),

              // Action buttons
              _ActionButtons(
                ride: ride,
                routeData: routeData,
                displayName: displayName,
              ),
            ],
          ),
        );
      },
    );
  }
}

class _StatMiniCard extends StatelessWidget {
  const _StatMiniCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      borderRadius: 16,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTypography.interLabel.copyWith(fontSize: 10)),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 18,
              fontWeight: FontWeight.w400,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTypography.interSecondary.copyWith(fontSize: 13)),
        Text(value, style: AppTypography.interSmall),
      ],
    );
  }
}

class _ActionButtons extends ConsumerWidget {
  const _ActionButtons({
    required this.ride,
    required this.routeData,
    required this.displayName,
  });

  final Ride ride;
  final RouteData? routeData;
  final String displayName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        // Share / Export row
        if (routeData != null && routeData!.hasRoute)
          Row(
            children: [
              Expanded(
                child: _ActionButton(
                  icon: Icons.map_outlined,
                  label: 'GPX Export',
                  onTap: () => shareGpx(
                    rideName: displayName,
                    startTime: ride.startTime,
                    endTime: ride.endTime,
                    routeData: routeData!,
                  ),
                ),
              ),
            ],
          ),
        const SizedBox(height: 10),

        // Edit / Delete row
        Row(
          children: [
            Expanded(
              child: _ActionButton(
                icon: Icons.edit_outlined,
                label: 'Edit',
                onTap: () {
                  Navigator.of(context).pop();
                  EditRideSheet.show(context, ride);
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _ActionButton(
                icon: Icons.delete_outline,
                label: 'Delete',
                isDestructive: true,
                onTap: () async {
                  final confirmed = await ConfirmDialog.show(
                    context,
                    title: 'Delete Ride',
                    message:
                        'This ride will be permanently deleted. This cannot be undone.',
                    confirmLabel: 'Delete',
                    isDestructive: true,
                  );
                  if (!confirmed) return;
                  if (!context.mounted) return;

                  final actions = ref.read(rideActionsProvider);
                  await ApexToast.promise(
                    context,
                    actions.deleteRide(ride.id),
                    loading: 'Deleting ride…',
                    success: 'Ride deleted',
                  );
                  if (context.mounted) Navigator.of(context).pop();
                },
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? AppColors.error : AppColors.textSecondary;

    return GestureDetector(
      onTap: onTap,
      child: GlassCard(
        padding: const EdgeInsets.symmetric(vertical: 14),
        borderRadius: 14,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 8),
            Text(
              label,
              style: AppTypography.interSmall.copyWith(color: color),
            ),
          ],
        ),
      ),
    );
  }
}

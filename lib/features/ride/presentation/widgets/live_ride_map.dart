import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/theme/app_colors.dart';
import '../../providers/ride_session_provider.dart';

/// A compact live map that shows the route being traced during an active ride.
class LiveRideMap extends StatefulWidget {
  const LiveRideMap({
    super.key,
    required this.coords,
    this.height = 160,
  });

  final List<RideCoord> coords;
  final double height;

  @override
  State<LiveRideMap> createState() => _LiveRideMapState();
}

class _LiveRideMapState extends State<LiveRideMap> {
  final MapController _mapController = MapController();

  @override
  void didUpdateWidget(LiveRideMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.coords.length > oldWidget.coords.length &&
        widget.coords.isNotEmpty) {
      final last = widget.coords.last;
      _mapController.move(LatLng(last.lat, last.lon), _mapController.camera.zoom);
    }
  }

  @override
  Widget build(BuildContext context) {
    final points =
        widget.coords.map((c) => LatLng(c.lat, c.lon)).toList();

    final center = points.isNotEmpty
        ? points.last
        : const LatLng(20.5937, 78.9629); // Default to India center

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: ColoredBox(
        color: const Color(0xFF1A1A2E),
        child: SizedBox(
          height: widget.height,
          child: Stack(
            children: [
              FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: center,
                initialZoom: 15,
                interactionOptions: const InteractionOptions(
                  flags: InteractiveFlag.none,
                ),
              ),
              children: [
                TileLayer(
                  urlTemplate:
                      'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                  userAgentPackageName: 'com.apex.app',
                  retinaMode: true,
                ),
                // Route polyline
                if (points.length > 1)
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: points,
                        strokeWidth: 3.5,
                        color: context.accent.withValues(alpha: 0.9),
                        strokeJoin: StrokeJoin.round,
                        strokeCap: StrokeCap.round,
                      ),
                    ],
                  ),
                // Current position marker
                if (points.isNotEmpty)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: points.last,
                        width: 20,
                        height: 20,
                        child: Container(
                          decoration: BoxDecoration(
                            color: context.accent,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: context.accent.withValues(alpha: 0.5),
                                blurRadius: 8,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
            // Compass icon top-right
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.9),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.navigation,
                  color: Colors.white,
                  size: 16,
                ),
              ),
            ),
          ],
         ),
        ),
      ),
    );
  }
}

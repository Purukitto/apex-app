import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../theme/app_colors.dart';
import '../utils/geojson_parser.dart';

/// Renders a ride route on a dark-themed map using CartoCDN tiles.
class RideMap extends StatelessWidget {
  const RideMap({
    super.key,
    required this.routeData,
    this.height = 300,
    this.interactive = false,
    this.borderRadius = 16.0,
  });

  final RouteData routeData;
  final double height;
  final bool interactive;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final points = routeData.coordinates
        .map((c) => LatLng(c.lat, c.lng))
        .toList();

    final bounds = LatLngBounds(
      LatLng(routeData.bounds.minLat, routeData.bounds.minLng),
      LatLng(routeData.bounds.maxLat, routeData.bounds.maxLng),
    );

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: ColoredBox(
        color: const Color(0xFF1A1A2E),
        child: SizedBox(
          height: height,
          child: FlutterMap(
            options: MapOptions(
              initialCameraFit: CameraFit.bounds(
                bounds: bounds,
                padding: const EdgeInsets.all(50),
                maxZoom: 18,
              ),
              interactionOptions: InteractionOptions(
                flags: interactive ? InteractiveFlag.all : InteractiveFlag.none,
              ),
            ),
            children: [
              TileLayer(
                urlTemplate:
                    'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                userAgentPackageName: 'com.apex.app',
                retinaMode: true,
              ),
              // Shadow polyline
              if (points.length > 1)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: points,
                      strokeWidth: 6,
                      color: context.accent.withValues(alpha: 0.25),
                      strokeJoin: StrokeJoin.round,
                      strokeCap: StrokeCap.round,
                    ),
                  ],
                ),
              // Main polyline
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
              // Start + End markers
              if (points.length > 1)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: points.first,
                      width: 14,
                      height: 14,
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.error,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                    Marker(
                      point: points.last,
                      width: 14,
                      height: 14,
                      child: Container(
                        decoration: BoxDecoration(
                          color: context.accent,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}

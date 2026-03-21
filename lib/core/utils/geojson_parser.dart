import 'dart:convert';

/// Parsed route data from GeoJSON.
class RouteData {
  const RouteData({required this.coordinates, required this.bounds});

  final List<({double lat, double lng})> coordinates;
  final ({double minLat, double maxLat, double minLng, double maxLng}) bounds;

  bool get isEmpty => coordinates.isEmpty;
  bool get hasRoute => coordinates.length > 1;
}

/// Parse a GeoJSON LineString or MultiLineString into [RouteData].
/// Returns null if the input is null, empty, or unparseable.
RouteData? parseRoutePath(String? geojson) {
  if (geojson == null || geojson.isEmpty) return null;

  try {
    final json = jsonDecode(geojson) as Map<String, dynamic>;
    final type = json['type'] as String?;
    final rawCoords = json['coordinates'];

    if (rawCoords == null) return null;

    List<({double lat, double lng})> coords;

    if (type == 'LineString') {
      coords = _parseLineString(rawCoords as List);
    } else if (type == 'MultiLineString') {
      coords = [];
      for (final line in rawCoords as List) {
        coords.addAll(_parseLineString(line as List));
      }
    } else {
      return null;
    }

    if (coords.isEmpty) return null;

    double minLat = coords.first.lat;
    double maxLat = coords.first.lat;
    double minLng = coords.first.lng;
    double maxLng = coords.first.lng;

    for (final c in coords) {
      if (c.lat < minLat) minLat = c.lat;
      if (c.lat > maxLat) maxLat = c.lat;
      if (c.lng < minLng) minLng = c.lng;
      if (c.lng > maxLng) maxLng = c.lng;
    }

    return RouteData(
      coordinates: coords,
      bounds: (minLat: minLat, maxLat: maxLat, minLng: minLng, maxLng: maxLng),
    );
  } catch (_) {
    return null;
  }
}

List<({double lat, double lng})> _parseLineString(List coords) {
  return coords.map((point) {
    final p = point as List;
    // GeoJSON is [longitude, latitude]
    return (lat: (p[1] as num).toDouble(), lng: (p[0] as num).toDouble());
  }).toList();
}

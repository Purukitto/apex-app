import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:apex/core/utils/geojson_parser.dart';

void main() {
  group('parseRoutePath', () {
    test('returns null for null input', () {
      expect(parseRoutePath(null), isNull);
    });

    test('returns null for empty string', () {
      expect(parseRoutePath(''), isNull);
    });

    test('returns null for invalid JSON', () {
      expect(parseRoutePath('not json'), isNull);
    });

    test('returns null for unsupported geometry type', () {
      expect(
        parseRoutePath(
          jsonEncode({
            'type': 'Point',
            'coordinates': [77.0, 28.0],
          }),
        ),
        isNull,
      );
    });

    test('parses LineString correctly', () {
      final geojson = jsonEncode({
        'type': 'LineString',
        'coordinates': [
          [77.0, 28.0],
          [77.1, 28.1],
          [77.2, 28.2],
        ],
      });

      final result = parseRoutePath(geojson)!;
      expect(result.coordinates.length, 3);
      // GeoJSON is [lng, lat] but parsed as (lat, lng)
      expect(result.coordinates[0].lat, 28.0);
      expect(result.coordinates[0].lng, 77.0);
      expect(result.hasRoute, isTrue);
    });

    test('calculates bounds correctly', () {
      final geojson = jsonEncode({
        'type': 'LineString',
        'coordinates': [
          [77.0, 28.0],
          [77.5, 28.5],
          [76.5, 27.5],
        ],
      });

      final result = parseRoutePath(geojson)!;
      expect(result.bounds.minLat, 27.5);
      expect(result.bounds.maxLat, 28.5);
      expect(result.bounds.minLng, 76.5);
      expect(result.bounds.maxLng, 77.5);
    });

    test('parses MultiLineString correctly', () {
      final geojson = jsonEncode({
        'type': 'MultiLineString',
        'coordinates': [
          [
            [77.0, 28.0],
            [77.1, 28.1],
          ],
          [
            [77.2, 28.2],
            [77.3, 28.3],
          ],
        ],
      });

      final result = parseRoutePath(geojson)!;
      expect(result.coordinates.length, 4);
      expect(result.coordinates[2].lat, 28.2);
      expect(result.coordinates[2].lng, 77.2);
    });

    test('single coordinate has no route', () {
      final geojson = jsonEncode({
        'type': 'LineString',
        'coordinates': [
          [77.0, 28.0],
        ],
      });

      final result = parseRoutePath(geojson)!;
      expect(result.hasRoute, isFalse);
      expect(result.isEmpty, isFalse);
    });
  });
}

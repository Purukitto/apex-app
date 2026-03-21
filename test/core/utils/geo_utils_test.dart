import 'package:flutter_test/flutter_test.dart';
import 'package:apex/core/utils/geo_utils.dart';

void main() {
  group('haversineDistance', () {
    test('returns 0 for identical points', () {
      expect(haversineDistance(0, 0, 0, 0), 0.0);
      expect(haversineDistance(28.6139, 77.2090, 28.6139, 77.2090), 0.0);
    });

    test('calculates distance between Delhi and Mumbai (~1150 km)', () {
      // Delhi: 28.6139°N, 77.2090°E
      // Mumbai: 19.0760°N, 72.8777°E
      final distance = haversineDistance(28.6139, 77.2090, 19.0760, 72.8777);
      expect(distance, closeTo(1153, 20)); // ~1153 km ± 20 km
    });

    test('calculates distance between two nearby points', () {
      // Two points ~1 km apart
      final distance = haversineDistance(28.6139, 77.2090, 28.6229, 77.2090);
      expect(distance, closeTo(1.0, 0.1));
    });

    test('handles antipodal points (~20000 km)', () {
      final distance = haversineDistance(0, 0, 0, 180);
      expect(distance, closeTo(20015, 50));
    });

    test('is commutative', () {
      final d1 = haversineDistance(28.6139, 77.2090, 19.0760, 72.8777);
      final d2 = haversineDistance(19.0760, 72.8777, 28.6139, 77.2090);
      expect(d1, d2);
    });
  });
}

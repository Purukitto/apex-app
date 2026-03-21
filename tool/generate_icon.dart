// ignore_for_file: avoid_print

/// Generates a 1024x1024 PNG launcher icon for the Apex app.
///
/// Uses the `image` package (pure Dart, no dart:ui dependency).
/// Run: dart pub add image --dev && dart run tool/generate_icon.dart
///
/// Draws the Apex curve logo (green on dark background).
library;

import 'dart:io';
import 'dart:math';
import 'package:image/image.dart' as img;

void main() {
  const size = 1024;
  final bgColor = img.ColorRgba8(10, 10, 12, 255); // #0A0A0C
  final strokeColor = img.ColorRgba8(61, 191, 111, 255); // #3DBF6F

  final image = img.Image(width: size, height: size);
  img.fill(image, color: bgColor);

  // SVG path: M100 400 C 150 400, 220 120, 412 120  (in 512x512 viewBox)
  // Scale to 1024 with padding
  const padding = 180.0;
  const viewBox = 512.0;
  final scale = (size - padding * 2) / viewBox;

  // Cubic bezier: P0=(100,400), P1=(150,400), P2=(220,120), P3=(412,120)
  const p0x = 100.0, p0y = 400.0;
  const p1x = 150.0, p1y = 400.0;
  const p2x = 220.0, p2y = 120.0;
  const p3x = 412.0, p3y = 120.0;

  // Sample the cubic bezier and draw thick anti-aliased line segments
  const steps = 500;
  const strokeWidth = 25.0;
  final scaledStroke = strokeWidth * scale;

  List<(double, double)> points = [];
  for (int i = 0; i <= steps; i++) {
    final t = i / steps;
    final mt = 1.0 - t;
    final x =
        mt * mt * mt * p0x +
        3 * mt * mt * t * p1x +
        3 * mt * t * t * p2x +
        t * t * t * p3x;
    final y =
        mt * mt * mt * p0y +
        3 * mt * mt * t * p1y +
        3 * mt * t * t * p2y +
        t * t * t * p3y;
    points.add((padding + x * scale, padding + y * scale));
  }

  // Draw thick curve by filling circles along the path
  final radius = scaledStroke / 2;
  for (final (cx, cy) in points) {
    _drawFilledCircle(image, cx, cy, radius, strokeColor);
  }

  // Round corners (optional: draw as circular mask)
  _applyRoundedCorners(image, size, size ~/ 4.5);

  final outDir = Directory('assets/icon');
  if (!outDir.existsSync()) outDir.createSync(recursive: true);

  final outFile = File('assets/icon/ic_launcher.png');
  outFile.writeAsBytesSync(img.encodePng(image));
  print('Generated: ${outFile.path}');

  // Also create a foreground-only version for adaptive icons (transparent bg)
  final foreground = img.Image(width: size, height: size);
  // transparent by default
  for (final (cx, cy) in points) {
    _drawFilledCircle(foreground, cx, cy, radius, strokeColor);
  }
  final fgFile = File('assets/icon/ic_launcher_foreground.png');
  fgFile.writeAsBytesSync(img.encodePng(foreground));
  print('Generated: ${fgFile.path}');
}

void _drawFilledCircle(
  img.Image image,
  double cx,
  double cy,
  double radius,
  img.ColorRgba8 color,
) {
  final r2 = radius * radius;
  final minX = max(0, (cx - radius - 1).floor());
  final maxX = min(image.width - 1, (cx + radius + 1).ceil());
  final minY = max(0, (cy - radius - 1).floor());
  final maxY = min(image.height - 1, (cy + radius + 1).ceil());

  for (int y = minY; y <= maxY; y++) {
    for (int x = minX; x <= maxX; x++) {
      final dx = x - cx;
      final dy = y - cy;
      final dist2 = dx * dx + dy * dy;
      if (dist2 <= r2) {
        // Simple anti-aliasing at edges
        final dist = sqrt(dist2);
        if (dist > radius - 1.0) {
          final alpha = (radius - dist).clamp(0.0, 1.0);
          final existing = image.getPixel(x, y);
          final blended = img.ColorRgba8(
            _blend(existing.r.toInt(), color.r.toInt(), alpha),
            _blend(existing.g.toInt(), color.g.toInt(), alpha),
            _blend(existing.b.toInt(), color.b.toInt(), alpha),
            255,
          );
          image.setPixel(x, y, blended);
        } else {
          image.setPixel(x, y, color);
        }
      }
    }
  }
}

int _blend(int bg, int fg, double alpha) =>
    (bg + (fg - bg) * alpha).round().clamp(0, 255);

void _applyRoundedCorners(img.Image image, int size, int radius) {
  final r2 = radius * radius;
  // Process each corner
  for (int y = 0; y < radius; y++) {
    for (int x = 0; x < radius; x++) {
      final dx = radius - x;
      final dy = radius - y;
      if (dx * dx + dy * dy > r2) {
        // Top-left
        image.setPixel(x, y, img.ColorRgba8(0, 0, 0, 0));
        // Top-right
        image.setPixel(size - 1 - x, y, img.ColorRgba8(0, 0, 0, 0));
        // Bottom-left
        image.setPixel(x, size - 1 - y, img.ColorRgba8(0, 0, 0, 0));
        // Bottom-right
        image.setPixel(size - 1 - x, size - 1 - y, img.ColorRgba8(0, 0, 0, 0));
      }
    }
  }
}

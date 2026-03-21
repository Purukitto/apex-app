import 'package:intl/intl.dart';

import 'geojson_parser.dart';

/// Generate GPX 1.1 XML from ride data.
String generateGpx({
  required String rideName,
  required DateTime startTime,
  DateTime? endTime,
  required RouteData routeData,
}) {
  final dateFormat = DateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
  final totalDuration = (endTime ?? startTime).difference(startTime);
  final coordCount = routeData.coordinates.length;

  final buffer = StringBuffer();
  buffer.writeln('<?xml version="1.0" encoding="UTF-8"?>');
  buffer.writeln(
      '<gpx version="1.1" creator="Apex Motorcycle App" '
      'xmlns="http://www.topografix.com/GPX/1/1">');
  buffer.writeln('  <metadata>');
  buffer.writeln('    <name>${_escapeXml(rideName)}</name>');
  buffer.writeln('    <time>${dateFormat.format(startTime.toUtc())}</time>');
  buffer.writeln('  </metadata>');
  buffer.writeln('  <trk>');
  buffer.writeln('    <name>${_escapeXml(rideName)}</name>');
  buffer.writeln('    <trkseg>');

  for (int i = 0; i < coordCount; i++) {
    final coord = routeData.coordinates[i];
    // Linear interpolation for timestamps across the duration
    final fraction = coordCount > 1 ? i / (coordCount - 1) : 0.0;
    final timestamp = startTime.add(
      Duration(milliseconds: (totalDuration.inMilliseconds * fraction).round()),
    );

    buffer.writeln(
        '      <trkpt lat="${coord.lat}" lon="${coord.lng}">'
        '<time>${dateFormat.format(timestamp.toUtc())}</time>'
        '</trkpt>');
  }

  buffer.writeln('    </trkseg>');
  buffer.writeln('  </trk>');
  buffer.writeln('</gpx>');

  return buffer.toString();
}

/// File name for GPX export.
String gpxFileName(DateTime startTime) {
  return 'ride_${DateFormat('yyyy-MM-dd').format(startTime)}.gpx';
}

String _escapeXml(String input) {
  return input
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
}

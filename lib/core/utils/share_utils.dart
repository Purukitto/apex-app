import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/rendering.dart';
import 'package:flutter/widgets.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import 'geojson_parser.dart';
import 'gpx_export.dart';
import 'logger.dart';

/// Share a GPX file for a ride.
Future<void> shareGpx({
  required String rideName,
  required DateTime startTime,
  DateTime? endTime,
  required RouteData routeData,
}) async {
  final gpxContent = generateGpx(
    rideName: rideName,
    startTime: startTime,
    endTime: endTime,
    routeData: routeData,
  );

  final dir = await getTemporaryDirectory();
  final file = File('${dir.path}/${gpxFileName(startTime)}');
  await file.writeAsString(gpxContent);

  await Share.shareXFiles([XFile(file.path)], subject: rideName);
  AppLogger.i('Shared GPX: ${file.path}');
}

/// Capture a widget by its RepaintBoundary key and share as PNG.
Future<void> shareWidgetImage(GlobalKey repaintKey, {String? subject}) async {
  final boundary =
      repaintKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
  if (boundary == null) {
    AppLogger.w('shareWidgetImage: RenderRepaintBoundary not found');
    return;
  }

  final image = await boundary.toImage(pixelRatio: 3.0);
  final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
  if (byteData == null) return;

  final dir = await getTemporaryDirectory();
  final file = File(
    '${dir.path}/apex_share_${DateTime.now().millisecondsSinceEpoch}.png',
  );
  await file.writeAsBytes(byteData.buffer.asUint8List());

  await Share.shareXFiles([XFile(file.path)], subject: subject);
  AppLogger.i('Shared image: ${file.path}');
}

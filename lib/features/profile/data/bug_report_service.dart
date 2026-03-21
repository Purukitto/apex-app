import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/utils/logger.dart';

class BugReportResult {
  const BugReportResult({required this.issueUrl, required this.issueNumber});

  final String issueUrl;
  final int issueNumber;
}

class BugReportService {
  BugReportService._();

  /// Submits a bug report to the create-bug-report Edge Function.
  static Future<BugReportResult> submit({
    required String title,
    required String description,
    String? stepsToReproduce,
  }) async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      throw Exception('Please sign in to submit a bug report');
    }

    final logsText = AppLogger.getRecentLogsText();
    final body = await _buildBody(
      description: description,
      stepsToReproduce: stepsToReproduce,
      logsText: logsText,
    );

    final prefixedTitle = title.trim().startsWith('[BUG]')
        ? title.trim()
        : '[BUG] ${title.trim()}';

    final response = await Supabase.instance.client.functions.invoke(
      'create-bug-report',
      body: {'title': prefixedTitle, 'body': body},
    );

    if (response.status != 200) {
      final error = response.data is Map
          ? (response.data as Map)['error'] ?? 'Unknown error'
          : 'Failed to submit bug report';
      throw Exception(error.toString());
    }

    final data = response.data as Map<String, dynamic>;
    return BugReportResult(
      issueUrl: data['issueUrl'] as String,
      issueNumber: data['issueNumber'] as int,
    );
  }

  static Future<String> _buildBody({
    required String description,
    String? stepsToReproduce,
    required String logsText,
  }) async {
    final env = await _getEnvironmentInfo();
    final steps = (stepsToReproduce != null && stepsToReproduce.trim().isNotEmpty)
        ? stepsToReproduce.trim()
        : '_(No steps provided)_';

    return '''## Bug Description

$description

## Steps to Reproduce

$steps

## Environment

- **Platform**: ${env['platform']}
- **OS**: ${env['os']}
- **Device**: ${env['device']}
- **Screen**: ${env['screen']}
- **App Version**: ${env['appVersion']}

## Logs (Last 150 lines)

```
$logsText
```
''';
  }

  static Future<Map<String, String>> _getEnvironmentInfo() async {
    String appVersion = 'Unknown';
    try {
      final info = await PackageInfo.fromPlatform();
      appVersion = '${info.version}+${info.buildNumber}';
    } catch (_) {}

    final platform = kIsWeb ? 'Web' : Platform.operatingSystem;
    final os = Platform.operatingSystemVersion;
    final screen = WidgetsBinding.instance.platformDispatcher.views.isNotEmpty
        ? () {
            final view = WidgetsBinding.instance.platformDispatcher.views.first;
            final size = view.physicalSize;
            final ratio = view.devicePixelRatio;
            return '${(size.width / ratio).round()}x${(size.height / ratio).round()} @${ratio.toStringAsFixed(1)}x';
          }()
        : 'Unknown';

    return {
      'platform': platform,
      'os': os,
      'device': Platform.localHostname,
      'screen': screen,
      'appVersion': appVersion,
    };
  }
}

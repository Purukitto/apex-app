// ignore_for_file: avoid_print

/// Writes android/app/src/{flavor}/google-services.json from environment variables.
///
/// Required env vars:
///   FIREBASE_PROJECT_NUMBER
///   FIREBASE_PROJECT_ID
///   FIREBASE_STORAGE_BUCKET
///   FIREBASE_MOBILESDK_APP_ID
///   FIREBASE_API_KEY
///
/// Optional:
///   FIREBASE_PACKAGE_NAME (defaults to com.purukitto.apex)
///
/// Usage:
///   dart run tool/inject_google_services.dart          # writes prod only
///   dart run tool/inject_google_services.dart --dev     # writes dev only
///   dart run tool/inject_google_services.dart --all     # writes both
library;

import 'dart:convert';
import 'dart:io';

void main(List<String> args) {
  final writeDev = args.contains('--dev') || args.contains('--all');
  final writeProd = !args.contains('--dev') || args.contains('--all');

  final projectNumber = _env('FIREBASE_PROJECT_NUMBER');
  final projectId = _env('FIREBASE_PROJECT_ID');
  final storageBucket = _env('FIREBASE_STORAGE_BUCKET');
  final mobilesdkAppId = _env('FIREBASE_MOBILESDK_APP_ID');
  final apiKey = _env('FIREBASE_API_KEY');
  final packageName =
      Platform.environment['FIREBASE_PACKAGE_NAME'] ?? 'com.purukitto.apex';

  final json = _buildGoogleServicesJson(
    projectNumber: projectNumber,
    projectId: projectId,
    storageBucket: storageBucket,
    mobilesdkAppId: mobilesdkAppId,
    apiKey: apiKey,
    packageName: packageName,
  );

  if (writeProd) {
    _writeJson('android/app/src/prod/google-services.json', json);
  }
  if (writeDev) {
    final devPackage = '$packageName.dev';
    final devJson = _buildGoogleServicesJson(
      projectNumber: projectNumber,
      projectId: projectId,
      storageBucket: storageBucket,
      mobilesdkAppId: mobilesdkAppId,
      apiKey: apiKey,
      packageName: devPackage,
    );
    _writeJson('android/app/src/dev/google-services.json', devJson);
  }

  print('google-services.json injected successfully.');
}

String _env(String key) {
  final value = Platform.environment[key];
  if (value == null || value.isEmpty) {
    stderr.writeln('ERROR: Missing required environment variable: $key');
    exit(1);
  }
  return value;
}

Map<String, dynamic> _buildGoogleServicesJson({
  required String projectNumber,
  required String projectId,
  required String storageBucket,
  required String mobilesdkAppId,
  required String apiKey,
  required String packageName,
}) {
  return {
    'project_info': {
      'project_number': projectNumber,
      'project_id': projectId,
      'storage_bucket': storageBucket,
    },
    'client': [
      {
        'client_info': {
          'mobilesdk_app_id': mobilesdkAppId,
          'android_client_info': {'package_name': packageName},
        },
        'oauth_client': <dynamic>[],
        'api_key': [
          {'current_key': apiKey},
        ],
        'services': {
          'appinvite_service': {'other_platform_oauth_client': <dynamic>[]},
        },
      },
    ],
    'configuration_version': '1',
  };
}

void _writeJson(String path, Map<String, dynamic> json) {
  final file = File(path);
  file.parent.createSync(recursive: true);
  file.writeAsStringSync(const JsonEncoder.withIndent('  ').convert(json));
  print('  Wrote $path');
}

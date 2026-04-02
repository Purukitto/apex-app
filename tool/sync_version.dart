// ignore_for_file: avoid_print

/// Reads the version from package.json and writes it to pubspec.yaml,
/// then stages the file so standard-version includes it in the release commit.
/// Called as a standard-version postbump hook.
library;

import 'dart:convert';
import 'dart:io';

void main() {
  final packageJson =
      jsonDecode(File('package.json').readAsStringSync())
          as Map<String, dynamic>;
  final version = packageJson['version'] as String;

  final pubspecFile = File('pubspec.yaml');
  final pubspec = pubspecFile.readAsStringSync();

  // Match version: x.y.z or version: x.y.z+build
  final updated = pubspec.replaceFirstMapped(
    RegExp(r'version:\s*\S+'),
    (m) => 'version: $version+1',
  );

  pubspecFile.writeAsStringSync(updated);
  print('Synced pubspec.yaml to version $version+1');

  // Stage so standard-version includes it in the release commit
  final result = Process.runSync('git', ['add', 'pubspec.yaml']);
  if (result.exitCode != 0) {
    print('Warning: failed to stage pubspec.yaml: ${result.stderr}');
  }
}

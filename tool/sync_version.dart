// ignore_for_file: avoid_print
/// Reads the version from package.json and writes it to pubspec.yaml.
/// Called as a standard-version postbump hook.
import 'dart:convert';
import 'dart:io';

void main() {
  final packageJson =
      jsonDecode(File('package.json').readAsStringSync()) as Map<String, dynamic>;
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
}

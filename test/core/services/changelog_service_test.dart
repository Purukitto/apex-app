import 'package:flutter_test/flutter_test.dart';
import 'package:apex/core/services/changelog_service.dart';

void main() {
  const sampleChangelog = '''
# Changelog

## [1.1.0](https://github.com/example/repo/compare/v1.0.0...v1.1.0) (2026-03-20)

### Features

* **ride:** added GPS altitude tracking
* **garage:** bike image gallery support

### Bug Fixes

* **sync:** fixed duplicate entries on reconnect

### Documentation

* updated API docs

### Performance

* **map:** reduced tile cache memory usage

## [1.0.0](https://github.com/example/repo/compare/...v1.0.0) (2026-03-01)

### Features

* **app:** initial release with ride tracking
* **auth:** email-based authentication

### Styles

* **theme:** dark mode with accent colors
''';

  group('ChangelogService.parseChangelog', () {
    late List<ChangelogRelease> releases;

    setUp(() {
      releases = ChangelogService.parseChangelog(sampleChangelog);
    });

    test('parses correct number of releases', () {
      expect(releases.length, 2);
    });

    test('parses version and date', () {
      expect(releases[0].version, '1.1.0');
      expect(releases[0].date, '2026-03-20');
      expect(releases[1].version, '1.0.0');
      expect(releases[1].date, '2026-03-01');
    });

    test('filters to allowed sections only', () {
      // 1.1.0 should have Features, Bug Fixes, Performance (not Documentation)
      final sections = releases[0].sections;
      expect(sections.containsKey('Features'), isTrue);
      expect(sections.containsKey('Bug Fixes'), isTrue);
      expect(sections.containsKey('Performance'), isTrue);
      expect(sections.containsKey('Documentation'), isFalse);
    });

    test('parses section items correctly', () {
      final features = releases[0].sections['Features']!;
      expect(features.length, 2);
      expect(features[0], contains('GPS altitude'));
    });

    test('parses Styles section', () {
      expect(releases[1].sections.containsKey('Styles'), isTrue);
      expect(releases[1].sections['Styles']!.length, 1);
    });

    test('returns empty list for empty input', () {
      expect(ChangelogService.parseChangelog(''), isEmpty);
    });

    test('returns empty list for no valid releases', () {
      expect(
        ChangelogService.parseChangelog('# Just a header\nSome text'),
        isEmpty,
      );
    });

    test('isEmpty is true for release with no allowed sections', () {
      // A release with only Documentation sections would be filtered out
      final result = ChangelogService.parseChangelog('''
## [0.1.0](link) (2025-01-01)

### Documentation

* docs only release
''');
      expect(result, isEmpty);
    });
  });
}

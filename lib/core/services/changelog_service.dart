import 'package:flutter/services.dart' show rootBundle;

/// Sections we display in the in-app changelog.
const _allowedSections = {
  'Features',
  'Bug Fixes',
  'Styles',
  'Performance',
  'Security',
};

/// A parsed changelog release.
class ChangelogRelease {
  const ChangelogRelease({
    required this.version,
    required this.date,
    required this.sections,
  });

  final String version;
  final String date;
  final Map<String, List<String>> sections;

  bool get isEmpty => sections.isEmpty;
}

/// Parses CHANGELOG.md (conventional-changelog format) into releases.
class ChangelogService {
  ChangelogService._();

  static Future<List<ChangelogRelease>> loadReleases() async {
    final raw = await rootBundle.loadString('CHANGELOG.md');
    return parseChangelog(raw);
  }

  /// Parse changelog text into structured releases.
  /// Exposed for testing.
  static List<ChangelogRelease> parseChangelog(String raw) {
    final releases = <ChangelogRelease>[];
    final lines = raw.split('\n');

    String? currentVersion;
    String? currentDate;
    String? currentSection;
    Map<String, List<String>> currentSections = {};

    for (final line in lines) {
      // Release header: ## [1.0.0](link) (2026-03-20) or ### [1.0.0]... or ## 1.0.0 (2026-03-20)
      final releaseMatch = RegExp(
        r'^#{2,3} \[?(\d+\.\d+\.\d+)\]?.*?\((\d{4}-\d{2}-\d{2})\)',
      ).firstMatch(line);
      if (releaseMatch != null) {
        // Save previous release
        if (currentVersion != null) {
          _addRelease(releases, currentVersion, currentDate!, currentSections);
        }
        currentVersion = releaseMatch.group(1)!;
        currentDate = releaseMatch.group(2)!;
        currentSections = {};
        currentSection = null;
        continue;
      }

      // Section header: ### Features
      final sectionMatch = RegExp(r'^### (.+)$').firstMatch(line);
      if (sectionMatch != null) {
        currentSection = sectionMatch.group(1)!;
        continue;
      }

      // Bullet point: * **scope:** message or * message
      if (line.startsWith('* ') && currentSection != null) {
        if (_allowedSections.contains(currentSection)) {
          currentSections
              .putIfAbsent(currentSection, () => [])
              .add(line.substring(2).trim());
        }
      }
    }

    // Save last release
    if (currentVersion != null) {
      _addRelease(releases, currentVersion, currentDate!, currentSections);
    }

    return releases;
  }

  static void _addRelease(
    List<ChangelogRelease> releases,
    String version,
    String date,
    Map<String, List<String>> sections,
  ) {
    // Only include releases with at least one allowed section
    final filtered = Map<String, List<String>>.fromEntries(
      sections.entries.where((e) => _allowedSections.contains(e.key)),
    );
    if (filtered.isNotEmpty) {
      releases.add(
        ChangelogRelease(version: version, date: date, sections: filtered),
      );
    }
  }
}

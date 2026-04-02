import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../../core/services/changelog_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/logger.dart';
import '../../../core/widgets/glass_card.dart';

const _kLastSeenVersionKey = 'last_seen_changelog_version';

class ChangelogSheet {
  ChangelogSheet._();

  /// Show the changelog bottom sheet manually.
  static Future<void> show(BuildContext context) async {
    final releases = await ChangelogService.loadReleases();
    if (!context.mounted || releases.isEmpty) return;

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black87,
      builder: (_) => _ChangelogContent(releases: releases),
    );
  }

  /// Auto-show on first launch after version change.
  static Future<void> checkAndShow(BuildContext context) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final info = await PackageInfo.fromPlatform();
      final currentVersion = info.version;
      final lastSeen = prefs.getString(_kLastSeenVersionKey);

      if (lastSeen == currentVersion) return;

      await prefs.setString(_kLastSeenVersionKey, currentVersion);

      // Don't show on very first install (no previous version seen)
      if (lastSeen == null) return;

      if (context.mounted) {
        await show(context);
      }
    } catch (e) {
      AppLogger.d('Changelog auto-show skipped', e);
    }
  }
}

class _ChangelogContent extends StatelessWidget {
  const _ChangelogContent({required this.releases});

  final List<ChangelogRelease> releases;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      builder: (context, scrollController) {
        return Container(
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: GlassCard(
            padding: EdgeInsets.zero,
            borderRadius: 20,
            opaque: true,
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 16, 0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "What's New",
                        style: AppTypography.playfairDisplay.copyWith(
                          fontSize: 22,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(
                          Icons.close,
                          color: AppColors.textMuted,
                          size: 18,
                        ),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                ),
                const Divider(color: AppColors.cardBorder, height: 1),
                // Content
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                    itemCount: releases.length,
                    itemBuilder: (context, i) {
                      final release = releases[i];
                      return _ReleaseCard(release: release, index: i);
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ReleaseCard extends StatelessWidget {
  const _ReleaseCard({required this.release, required this.index});

  final ChangelogRelease release;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Version + date header
              Row(
                children: [
                  Text(
                    'v${release.version}',
                    style: AppTypography.jetBrainsMonoSmall.copyWith(
                      color: context.accent,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    release.date,
                    style: AppTypography.jetBrainsMonoSmall.copyWith(
                      color: AppColors.textMuted,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Sections
              ...release.sections.entries.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        entry.key,
                        style: AppTypography.interSmall.copyWith(
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      ...entry.value.map(
                        (item) => Padding(
                          padding: const EdgeInsets.only(left: 8, top: 2),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '  •  ',
                                style: AppTypography.interSmall.copyWith(
                                  color: AppColors.textMuted,
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  _cleanItem(item),
                                  style: AppTypography.interSmall,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(duration: 300.ms, delay: (index * 80).ms)
        .slideY(begin: 0.05, end: 0, duration: 300.ms, delay: (index * 80).ms);
  }

  /// Remove scope prefix like "**scope:** " from changelog items.
  String _cleanItem(String item) {
    return item.replaceFirst(RegExp(r'^\*\*[^*]+:\*\*\s*'), '');
  }
}

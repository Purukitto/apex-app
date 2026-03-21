import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:in_app_update/in_app_update.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../utils/logger.dart';

const _kLastUpdateCheckKey = 'last_update_check';
const _kCheckIntervalHours = 24;
const _kAppStoreId = 'com.purukitto.apex';

/// Platform-aware update checker.
///
/// Android: Google Play In-App Updates (flexible mode).
/// iOS: App Store version lookup via iTunes API.
class UpdateChecker {
  UpdateChecker._();

  /// Check for available updates. Throttled to once per 24h unless [force].
  static Future<void> check(BuildContext context, {bool force = false}) async {
    try {
      if (!force) {
        final prefs = await SharedPreferences.getInstance();
        final lastCheck = prefs.getInt(_kLastUpdateCheckKey) ?? 0;
        final hoursSince = DateTime.now()
            .difference(DateTime.fromMillisecondsSinceEpoch(lastCheck))
            .inHours;
        if (hoursSince < _kCheckIntervalHours) return;
      }

      // Record check time
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(
          _kLastUpdateCheckKey, DateTime.now().millisecondsSinceEpoch);

      if (Platform.isAndroid) {
        await _checkAndroid();
      } else if (Platform.isIOS && context.mounted) {
        await _checkIOS(context);
      }
    } catch (e) {
      // Non-critical — silently ignore update check failures
      AppLogger.d('Update check skipped', e);
    }
  }

  /// Android: Use Google Play In-App Updates (flexible mode).
  static Future<void> _checkAndroid() async {
    final info = await InAppUpdate.checkForUpdate();

    if (info.updateAvailability == UpdateAvailability.updateAvailable) {
      // Use flexible update — user can continue using app while downloading
      if (info.flexibleUpdateAllowed) {
        await InAppUpdate.startFlexibleUpdate();
        await InAppUpdate.completeFlexibleUpdate();
      } else if (info.immediateUpdateAllowed) {
        await InAppUpdate.performImmediateUpdate();
      }
    }
  }

  /// iOS: Query iTunes lookup API and compare versions.
  static Future<void> _checkIOS(BuildContext context) async {
    final packageInfo = await PackageInfo.fromPlatform();
    final currentVersion = packageInfo.version;

    final client = HttpClient();
    try {
      final request = await client.getUrl(Uri.parse(
          'https://itunes.apple.com/lookup?bundleId=$_kAppStoreId'));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      final json = jsonDecode(body) as Map<String, dynamic>;

      final results = json['results'] as List?;
      if (results == null || results.isEmpty) return;

      final latestVersion = results[0]['version'] as String?;
      if (latestVersion == null) return;

      if (_isNewerVersion(latestVersion, currentVersion) && context.mounted) {
        _showIOSUpdateDialog(context, latestVersion);
      }
    } finally {
      client.close();
    }
  }

  /// Compare semantic version strings.
  static bool _isNewerVersion(String latest, String current) {
    final latestParts = latest.split('.').map(int.tryParse).toList();
    final currentParts = current.split('.').map(int.tryParse).toList();

    for (int i = 0; i < 3; i++) {
      final l = (i < latestParts.length ? latestParts[i] : 0) ?? 0;
      final c = (i < currentParts.length ? currentParts[i] : 0) ?? 0;
      if (l > c) return true;
      if (l < c) return false;
    }
    return false;
  }

  static void _showIOSUpdateDialog(BuildContext context, String version) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.backgroundDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.cardBorder),
        ),
        title: Text(
          'Update available',
          style: AppTypography.playfairDisplay.copyWith(fontSize: 20),
        ),
        content: Text(
          'Apex v$version is available. Update for the latest features and fixes.',
          style: AppTypography.interSecondary,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              'Later',
              style: AppTypography.interSmall.copyWith(
                color: AppColors.textMuted,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              launchUrl(
                Uri.parse(
                    'https://apps.apple.com/app/$_kAppStoreId'),
                mode: LaunchMode.externalApplication,
              );
            },
            child: Text(
              'Update',
              style: AppTypography.interSmall.copyWith(
                color: context.accent,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

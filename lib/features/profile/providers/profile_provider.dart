import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/network/supabase_client.dart';
import '../../../core/providers/database_provider.dart';
import '../../../core/providers/sync_provider.dart';
import '../../../core/utils/logger.dart';
import '../../auth/providers/auth_provider.dart';

/// Handles all profile mutation operations.
///
/// State is `AsyncValue<void>` — callers await the mutation methods and handle
/// errors via try/catch, surfacing feedback with ApexToast.
class ProfileNotifier extends AsyncNotifier<void> {
  SupabaseClient get _client => ref.read(supabaseClientProvider);

  @override
  Future<void> build() async {}

  /// Updates the rider name in Supabase auth user metadata.
  Future<void> updateRiderName(String name) async {
    state = const AsyncLoading();
    try {
      final currentUser = _client.auth.currentUser;
      final existing =
          Map<String, dynamic>.from(currentUser?.userMetadata ?? {});
      existing['rider_name'] = name;

      await _client.auth.updateUser(
        UserAttributes(data: existing),
      );

      // Invalidate the user profile cache
      ref.invalidate(userProfileProvider);
      state = const AsyncData(null);
      AppLogger.i('Rider name updated to: $name');
    } catch (e, st) {
      AppLogger.e('Failed to update rider name', e, st);
      state = AsyncError(e, st);
      rethrow;
    }
  }

  /// Initiates an email change — triggers OTP flow via Supabase.
  Future<void> updateEmail(String email) async {
    state = const AsyncLoading();
    try {
      await _client.auth.updateUser(UserAttributes(email: email));
      state = const AsyncData(null);
      AppLogger.i('Email update initiated for: $email');
    } catch (e, st) {
      AppLogger.e('Failed to initiate email update', e, st);
      state = AsyncError(e, st);
      rethrow;
    }
  }

  /// Sends a reauthentication OTP to the current user's email.
  Future<void> reauthenticate() async {
    state = const AsyncLoading();
    try {
      await _client.auth.reauthenticate();
      state = const AsyncData(null);
      AppLogger.i('Reauthentication OTP sent');
    } catch (e, st) {
      AppLogger.e('Failed to reauthenticate', e, st);
      state = AsyncError(e, st);
      rethrow;
    }
  }

  /// Updates the password using a reauthentication nonce (MFA flow).
  Future<void> updatePasswordWithNonce({
    required String password,
    required String nonce,
  }) async {
    state = const AsyncLoading();
    try {
      await _client.auth.updateUser(
        UserAttributes(password: password, nonce: nonce),
      );
      state = const AsyncData(null);
      AppLogger.i('Password updated with nonce');
    } catch (e, st) {
      AppLogger.e('Failed to update password with nonce', e, st);
      state = AsyncError(e, st);
      rethrow;
    }
  }

  /// Verifies the OTP for email change.
  Future<void> verifyEmailChangeOtp({
    required String email,
    required String token,
  }) async {
    state = const AsyncLoading();
    try {
      await _client.auth.verifyOTP(
        email: email,
        token: token,
        type: OtpType.emailChange,
      );
      ref.invalidate(userProfileProvider);
      state = const AsyncData(null);
      AppLogger.i('Email change OTP verified');
    } catch (e, st) {
      AppLogger.e('Failed to verify email change OTP', e, st);
      state = AsyncError(e, st);
      rethrow;
    }
  }

  /// Resends the email change OTP to [email].
  Future<void> resendEmailChangeOtp(String email) async {
    state = const AsyncLoading();
    try {
      await _client.auth.resend(
        type: OtpType.emailChange,
        email: email,
      );
      state = const AsyncData(null);
      AppLogger.i('Email change OTP resent to: $email');
    } catch (e, st) {
      AppLogger.e('Failed to resend email change OTP', e, st);
      state = AsyncError(e, st);
      rethrow;
    }
  }

  /// Signs the current user out, stops sync, and clears local data.
  Future<void> signOut() async {
    state = const AsyncLoading();
    try {
      // Stop sync engine and clear timestamps
      final engine = ref.read(syncEngineProvider);
      engine.stopPeriodicSync();
      await engine.clearSyncTimestamps();

      // Delete all local data
      final db = ref.read(databaseProvider);
      await db.deleteAllData();

      await _client.auth.signOut();
      state = const AsyncData(null);
      AppLogger.i('User signed out — local data cleared');
    } catch (e, st) {
      AppLogger.e('Failed to sign out', e, st);
      state = AsyncError(e, st);
      rethrow;
    }
  }
}

final profileProvider =
    AsyncNotifierProvider<ProfileNotifier, void>(ProfileNotifier.new);

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/network/supabase_client.dart';

/// Stream of Supabase auth state changes.
final authStateProvider = StreamProvider<AuthState>((ref) {
  return ref.read(supabaseClientProvider).auth.onAuthStateChange;
});

/// Derived provider: true when a valid session exists.
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authStateProvider).asData?.value.session != null;
});

/// Minimal user profile read from Supabase auth metadata.
class UserProfile {
  const UserProfile({
    required this.email,
    this.riderName,
  });

  final String email;
  final String? riderName;

  UserProfile copyWith({String? email, String? riderName}) {
    return UserProfile(
      email: email ?? this.email,
      riderName: riderName ?? this.riderName,
    );
  }
}

/// Fetches the current user's profile from Supabase auth.
/// Throws if not authenticated.
final userProfileProvider = FutureProvider<UserProfile>((ref) async {
  // Re-fetch when auth state changes
  ref.watch(authStateProvider);

  final client = ref.read(supabaseClientProvider);
  final response = await client.auth.getUser();
  final user = response.user;

  if (user == null) throw Exception('Not authenticated');

  return UserProfile(
    email: user.email ?? '',
    riderName: user.userMetadata?['rider_name'] as String?,
  );
});

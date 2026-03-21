import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../network/connectivity_provider.dart';
import '../network/supabase_client.dart';
import '../sync/sync_engine.dart';
import '../sync/sync_status.dart';
import '../utils/logger.dart';
import 'database_provider.dart';
import 'shared_prefs_provider.dart';

/// Provides the SyncEngine instance.
final syncEngineProvider = Provider<SyncEngine>((ref) {
  final db = ref.watch(databaseProvider);
  final supabase = ref.watch(supabaseClientProvider);
  final prefs = ref.watch(sharedPrefsProvider);

  final engine = SyncEngine(db: db, supabase: supabase, prefs: prefs);
  ref.onDispose(() => engine.dispose());
  return engine;
});

/// Streams the current SyncState.
final syncStatusProvider = StreamProvider<SyncState>((ref) {
  final engine = ref.watch(syncEngineProvider);
  return engine.stateStream;
});

/// Orchestrator: watches connectivity + auth, starts/stops sync engine,
/// and triggers initial sync on first login.
final syncOrchestratorProvider = Provider<void>((ref) {
  final engine = ref.watch(syncEngineProvider);
  final isOnline = ref.watch(connectivityProvider).asData?.value ?? false;
  final isAuthenticated = ref.watch(isAuthenticatedProvider);

  if (isAuthenticated && isOnline) {
    engine.startPeriodicSync();

    // Check if this is a fresh login (local DB may be empty)
    _maybeInitialSync(ref, engine);
  } else {
    engine.stopPeriodicSync();
    if (!isOnline) {
      engine.setOffline();
    }
  }
});

Future<void> _maybeInitialSync(Ref ref, SyncEngine engine) async {
  final uid = Supabase.instance.client.auth.currentUser?.id;
  if (uid == null) return;

  final prefs = ref.read(sharedPrefsProvider);
  final db = ref.read(databaseProvider);
  final allBikes = await (db.select(db.bikes)).get();

  // If no bikes at all locally, treat as fresh login → initial sync
  if (allBikes.isEmpty) {
    AppLogger.i('Empty local DB detected — performing initial sync');
    await engine.performInitialSync(uid);
  }

  // One-time: re-pull rides to get proper GeoJSON route data
  const migrKey = 'rides_geojson_migrated_v1';
  if (!prefs.containsKey(migrKey)) {
    AppLogger.i('Re-pulling rides for GeoJSON route data');
    await prefs.remove('last_sync_rides');
    await prefs.setBool(migrKey, true);
    await engine.syncAll();
  }
}

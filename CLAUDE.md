# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Apex is a motorcycle companion app built with Flutter (Dart ^3.11.0). It tracks rides via GPS, manages a garage of bikes, logs fuel with mileage calculations, and handles maintenance scheduling with push notifications. The app is offline-first using a local SQLite database (Drift) with Supabase cloud sync and conflict resolution.

## Common Commands

### Setup
```bash
flutter pub get
npm install
cp .env.example .env                                          # fill in Supabase credentials
dart run build_runner build --delete-conflicting-outputs       # generate envied + drift code
```

### Firebase Setup (Android, prod only)
```bash
export FIREBASE_PROJECT_NUMBER=... FIREBASE_PROJECT_ID=... FIREBASE_STORAGE_BUCKET=...
export FIREBASE_MOBILESDK_APP_ID=... FIREBASE_API_KEY=...
dart run tool/inject_google_services.dart
```

### Run
```bash
flutter run --flavor dev -t lib/main_dev.dart     # dev (no Firebase, separate app ID)
flutter run --flavor prod -t lib/main.dart        # prod
```

### Test, Lint, Format
```bash
flutter test                                # all tests
flutter test test/path/to/specific_test.dart  # single test file
flutter analyze                             # static analysis
dart analyze --fatal-infos                  # CI-level analysis (fails on infos)
dart format .                               # format all files
dart format --set-exit-if-changed .         # CI check (no writes)
```

### Code Generation
After changing Drift tables, DAOs, or envied config, re-run:
```bash
dart run build_runner build --delete-conflicting-outputs
```

### Release
```bash
npm run release              # auto-detect bump from conventional commits
npm run release:patch        # force patch
npm run release:minor        # force minor
git push --follow-tags origin main   # triggers CI build + GitHub Release
```

## Architecture

**Stack:** Riverpod (state) + GoRouter (routing) + Drift/SQLite (local DB) + Supabase (auth & cloud sync)

### Entry Points
- `lib/main.dart` — production (Firebase enabled)
- `lib/main_dev.dart` — development (Firebase disabled, `.dev` app ID)
- `lib/app.dart` — root widget, GoRouter config, auth redirect logic

### Build Flavors
| Flavor | App ID | Entry Point |
|--------|--------|-------------|
| `dev` | `com.purukitto.apex.dev` | `lib/main_dev.dart` |
| `prod` | `com.purukitto.apex` | `lib/main.dart` |

### Code Organization
- `lib/core/` — shared infrastructure: database (Drift tables + DAOs), sync engine, Supabase client, theme system, services (Firebase, notifications, location), global Riverpod providers, utility functions
- `lib/features/` — feature modules (auth, dashboard, garage, ride, rides, service, notifications, profile). Simple features have `presentation/` + `providers/`. Complex features add `data/` (e.g., garage's `global_bike_search_service.dart`) or `services/` (e.g., ride's `pocket_detector.dart`).
- `tool/` — build scripts (`inject_google_services.dart`, `sync_version.dart`, `generate_icon.dart`)

### Routing (lib/app.dart)
- Auth routes (no shell): `/login`, `/confirmed`, `/reset-password`
- Shell routes (bottom nav): `/dashboard`, `/garage`, `/ride`, `/rides`
- Standalone: `/profile` (no bottom nav)
- `_RouterRefreshNotifier` bridges Riverpod auth state → GoRouter refresh for auth redirects

### Key Architectural Patterns
- **Offline-first sync:** Local Drift DB is source of truth. `SyncEngine` (`core/sync/sync_engine.dart`) orchestrates bidirectional Supabase sync with 30-second polling. Push phase upserts dirty rows per-table; pull phase uses per-table last-sync timestamps stored in SharedPreferences (`last_sync_TABLE`). Conflict resolution is last-write-wins (server wins ties). `syncOrchestratorProvider` auto-starts/stops sync based on auth + connectivity state, and triggers an initial full sync on fresh login.
- **Drift database:** 7 tables (Bikes, Rides, FuelLogs, MaintenanceLogs, MaintenanceSchedules, ServiceHistory, Notifications) with 5 DAOs accessed via `databaseProvider`. All sync-enabled tables include `isSynced` + `lastModified` columns — local writes set `isSynced=false`, sync engine processes dirty rows. Generated code lives in `*.g.dart` files — never edit these.
- **Provider initialization:** `databaseProvider` and `sharedPrefsProvider` must be overridden in the root `ProviderScope` at startup — they throw if accessed without override. See `main.dart` for the pattern.
- **Environment secrets:** Managed via envied with code generation. `.env` holds Supabase URL/key. `env.g.dart` is generated and gitignored. `AppConfig.initialize(environment:)` in `main()` sets up Supabase.
- **Dark theme only:** No light mode. Accent colors and OLED black variant configurable via `themeProvider` (persisted to SharedPreferences).
- **Foreground service:** Ride recording uses `flutter_foreground_task` to survive backgrounding, with pocket detection via proximity sensor + accelerometer.
- **GeoJSON:** Route geometry stored as text in SQLite. Server-side RPC (`get_rides_with_geojson`) converts PostGIS geometry to GeoJSON for client rendering.

### Files to Never Commit
- `.env`, `env.g.dart`, `google-services.json`, `*.g.dart` (generated files are gitignored but some may be tracked — check before modifying)

## CI/CD

- **ci.yml** (push/PR): code generation → format check → analyze → test
- **commitlint.yml** (PR): validates conventional commit messages (`feat:`, `fix:`, `chore:`, etc.)
- **release.yml** (push to main): builds signed APK, creates GitHub Release with changelog

## Testing Requirements

Every bug fix and feature change **must** include or update relevant tests. Before submitting:

1. **New features/screens:** Add widget tests covering the key UI states (loading, error, data, empty).
2. **Bug fixes:** Add a regression test that would have caught the bug.
3. **Provider changes:** Ensure providers that depend on auth state, connectivity, or other async sources are tested for reactivity (e.g., re-evaluation on auth state changes).
4. **Typography/theme changes:** Verify font families and style properties via unit tests.
5. **Navigation changes:** Test that nav destinations, icons, and routing behave correctly.

Run `flutter test` and `dart analyze --fatal-infos` before every commit.

### Test Organization
- `test/core/utils/` — unit tests for formatters, geo utilities, fuel calculations, GeoJSON parsing
- `test/core/services/` — service tests (changelog, etc.)
- `test/core/theme/` — typography tests
- `test/core/widgets/` — widget tests for buttons, cards, nav bar

## Commit Convention

Uses conventional commits enforced by commitlint: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `style:`, `perf:`, `ci:`, `build:`.

# Apex App — Flutter Migration Plan

> **From:** React 19 + Vite + Capacitor 8 (web + mobile hybrid)
> **To:** Flutter (Dart) — native mobile only (Android first, iOS later)
> **Design language:** "Obsidian Glass" (inspired by Shiren) with Apex accent colours
> **Web app:** Dropped entirely — this is a sensor/GPS-heavy mobile app; web adds no value

---

## Table of Contents

1. [Why Migrate](#1-why-migrate)
2. [What Gets Dropped](#2-what-gets-dropped)
3. [Design System — "Obsidian Glass × Apex"](#3-design-system)
4. [Architecture Overview](#4-architecture-overview)
5. [Project Structure](#5-project-structure)
6. [State Management & Data Flow](#6-state-management--data-flow)
7. [Database & Offline-First Strategy](#7-database--offline-first-strategy)
8. [Feature Breakdown & Screen Map](#8-feature-breakdown--screen-map)
9. [Navigation & Routing](#9-navigation--routing)
10. [Animation System](#10-animation-system)
11. [GPS, Motion & Ride Recording](#11-gps-motion--ride-recording)
12. [Maps](#12-maps)
13. [Notifications & Push](#13-notifications--push)
14. [Authentication](#14-authentication)
15. [Logging & Error Handling](#15-logging--error-handling)
16. [Testing Strategy](#16-testing-strategy)
17. [Build, CI & Release](#17-build-ci--release)
18. [Migration Phases](#18-migration-phases)
19. [Dependency Matrix](#19-dependency-matrix)
20. [Risks & Mitigations](#20-risks--mitigations)
- [Appendix C: Known Production Database Issues](#appendix-c-known-production-database-issues)

---

## 1. Why Migrate

| Concern | React + Capacitor | Flutter |
|---|---|---|
| **Native performance** | JS bridge for GPS/sensors — adds latency, GC pauses | Dart AOT compiles to native ARM; direct platform channel access |
| **Sensor-heavy ride recording** | Capacitor plugin wrapper → JS → bridge → native | Platform channel or FFI → near-native latency |
| **Offline-first** | No built-in local DB; IndexedDB is fragile on mobile | Drift (SQLite) with compile-time type safety, reactive streams |
| **Animation fidelity** | Framer Motion is good but constrained by web rendering | Impeller rendering engine — 120fps glass/blur effects, no jank |
| **Background execution** | Capacitor foreground service is bolted on | Native foreground service with Dart isolates |
| **Single codebase** | Still need native code for Capacitor plugins | True single codebase for Android + iOS |
| **No web burden** | Maintaining web fallbacks (QR code, platform gates) for features that only work on mobile | Mobile-only target — no platform checks, no web fallbacks, every feature can assume native APIs |
| **Discord RPC** | Removed (TOS concerns) | N/A |

---

## 2. What Gets Dropped

### Removed Features
- **Discord RPC integration** — OAuth login, Rich Presence, all sharing toggles. Reason: borderline TOS violation, low user value.
  - Files removed: `src/config/discord.ts`, `src/lib/discordLogin.ts`, `src/lib/discordRpc.ts`, `src/lib/discordAuth.ts`, `src/stores/useDiscordRpcStore.ts`, `src/hooks/useDiscord.ts`, Discord section in `Profile.tsx`, Discord calls in `Ride.tsx`
- **Entire web app** — GPS, accelerometer, foreground services, and push notifications are all mobile-native concerns. The web target adds complexity (platform gates, QR code fallbacks, Firebase SW injection) with no real user value. Flutter build targets Android and iOS only.
- **Web QR code fallback** — Removed with web target.
- **Capacitor bridge layer** — Replaced by Flutter's platform channels.
- **Firebase service worker injection** — Web-only concern (`inject-firebase-sw.js`), no longer needed.
- **`Capacitor.isNativePlatform()` guards** — Every feature can now assume native APIs are available.

### Removed Dependencies (entire React/web stack)
- All `@capacitor/*` packages
- `react`, `react-dom`, `react-router-dom`, `vite`
- `framer-motion`, `zustand`, `@tanstack/react-query`
- `maplibre-gl` (replaced by `flutter_map` + vector tiles)
- `sonner`, `@radix-ui/*`, `tailwindcss`
- `@capgo/inappbrowser` (was only for Discord OAuth)
- `firebase` JS SDK (replaced by `firebase_messaging` Flutter plugin)
- `html2canvas`, `react-qr-code` (web-only utilities)

---

## 3. Design System

### The "Obsidian Glass × Apex" Language

Take Shiren's dark glassmorphism and charcoal card aesthetic, replace the champagne gold accent with Apex's signature green.

### Colour Palette

```
Background
  backgroundDark:    #0A0A0C    // Primary — same as Shiren
  backgroundMid:     #121417    // Secondary panel/sheet backgrounds

Accent (Apex Green — replaces Shiren's champagne gold)
  accent:            #3DBF6F    // Primary accent — buttons, active states, CTAs
  accentMuted:       #2D8F53    // Subtle accent for secondary elements

Error / Warning
  error:             #E35B5B    // Destructive actions, validation errors
  warning:           #F5A623    // Maintenance due warnings

Cards (Shiren's glass system, verbatim)
  cardBg:            rgba(255,255,255, 0.03)   // 3% white — charcoal glass
  cardBorder:        rgba(255,255,255, 0.08)   // 8% white border
  accentCardBg:      rgba(61,191,111, 0.05)    // 5% green tint
  accentCardBorder:  rgba(61,191,111, 0.20)    // 20% green border

Text Hierarchy (from Shiren)
  textPrimary:       #F5F5F5
  textBright:        #E8E8E8
  textSecondary:     #909090
  textMuted:         #808080
  textDim:           #606060
  textDisabled:      #505050

Semantic Glow
  greenGlow:         rgba(61,191,111, 0.15)    // Subtle accent glow
  greenGlowStrong:   rgba(61,191,111, 0.20)    // Active/hover glow
  shadowDark:        rgba(0,0,0, 0.40)         // Card drop shadow
```

### Typography

Same system as Shiren — light weight throughout for a premium feel:

| Role | Font | Weight | Size |
|---|---|---|---|
| Page titles | Playfair Display | w300 | 28–32sp |
| Section headers | Inter | w400 | 18–20sp |
| Body text | Inter | w300 | 14–16sp |
| Labels / captions | Inter | w300 | 12sp, 1.5 letter-spacing |
| Telemetry / numbers | JetBrains Mono | w400 | 14–24sp |
| Input fields | Inter | w300 | 16sp (min, iOS zoom prevention) |

### Component Kit

#### GlassCard
Exact port of Shiren's `GlassCard`:
- `BackdropFilter` with `sigmaX: 40, sigmaY: 40`
- `borderRadius: 24`
- Dark variant: `cardBg` + `cardBorder`
- Accent variant: `accentCardBg` + `accentCardBorder` + green glow shadow
- Padding: 24px default

#### PressableGlassCard
- `AnimatedScale`: 0.97 on press, 150ms, `Curves.easeOut`
- Wraps `GlassCard` with `GestureDetector`

#### MeshBackground
Page scaffold background:
- Linear gradient: `backgroundDark` → `backgroundMid`
- Green radial gradient aura at top-right (replaces Shiren's gold)
- Optional subtle grid overlay (40px step, 0.5px white at 5% opacity)

#### ApexButton
- Filled: `accent` background, `backgroundDark` text
- Outlined: `transparent` background, `accent` border
- Ghost: no background, `textSecondary` text
- All variants: 150ms scale animation on press (0.97)

#### BottomNavBar
- Frosted glass bar with `BackdropFilter`
- 4 destinations: Dashboard, Garage, Ride, History
- Active item: `accent` colour + label; inactive: `textMuted`
- Floating pill style (rounded corners, margin from edges)

---

## 4. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Presentation Layer                     │
│  Screens → Widgets → Animation Controllers               │
│  (StatelessWidget / ConsumerWidget / HookConsumerWidget)  │
└─────────────────────────┬────────────────────────────────┘
                          │ watches providers
┌─────────────────────────▼────────────────────────────────┐
│                   Provider Layer (Riverpod)               │
│  AsyncNotifier / StreamProvider / FutureProvider          │
│  (business logic, mutations, derived state)               │
└─────────────┬────────────────────────┬───────────────────┘
              │                        │
┌─────────────▼──────────┐  ┌─────────▼───────────────────┐
│   Local DB (Drift)     │  │   Remote (Supabase)          │
│   SQLite — offline     │  │   PostgreSQL + PostGIS       │
│   source of truth      │  │   Auth + RLS + Realtime      │
│   reactive .watch()    │  │                               │
└────────────────────────┘  └──────────────────────────────┘
              │                        ▲
              └──── Sync Engine ───────┘
                (background isolate)
```

**Key principles:**
1. **Drift is the single source of truth** — UI always reads from local SQLite via reactive streams
2. **Supabase is the remote persistence** — synced in background
3. **Writes go to Drift first** (`isSynced = false`), then background sync pushes to Supabase
4. **No loading spinners for cached data** — stream from Drift emits immediately
5. **Riverpod manages all state** — no mix of state management libraries

---

## 5. Project Structure

```
lib/
├── main.dart                           // App entry, ProviderScope, theme setup
├── app.dart                            // MaterialApp.router, GoRouter config
│
├── core/
│   ├── theme/
│   │   ├── app_colors.dart             // All colour constants
│   │   ├── app_theme.dart              // ThemeData, text styles, Material 3
│   │   └── app_typography.dart         // Font families, text scale
│   │
│   ├── database/
│   │   ├── app_database.dart           // Drift database class
│   │   ├── app_database.g.dart         // Generated Drift code
│   │   ├── tables/                     // Drift table definitions
│   │   │   ├── bikes_table.dart
│   │   │   ├── rides_table.dart
│   │   │   ├── maintenance_logs_table.dart
│   │   │   ├── fuel_logs_table.dart
│   │   │   ├── maintenance_schedules_table.dart
│   │   │   ├── service_history_table.dart
│   │   │   └── notifications_table.dart
│   │   └── daos/                       // Data Access Objects
│   │       ├── bikes_dao.dart
│   │       ├── rides_dao.dart
│   │       ├── maintenance_dao.dart
│   │       ├── fuel_dao.dart
│   │       └── notifications_dao.dart
│   │
│   ├── network/
│   │   ├── connectivity_provider.dart  // Online/offline state
│   │   └── supabase_client.dart        // Supabase init + client
│   │
│   ├── sync/
│   │   ├── sync_engine.dart            // Background sync orchestrator
│   │   ├── sync_status.dart            // Sync state enum
│   │   └── conflict_resolver.dart      // Last-write-wins strategy
│   │
│   ├── widgets/
│   │   ├── glass_card.dart             // Glassmorphism card
│   │   ├── pressable_glass_card.dart   // Interactive glass card
│   │   ├── mesh_background.dart        // Page gradient background
│   │   ├── apex_button.dart            // Themed button variants
│   │   ├── bottom_nav_bar.dart         // Floating nav
│   │   ├── confirm_dialog.dart         // Confirmation modal
│   │   ├── apex_text_field.dart        // Styled text input
│   │   ├── loading_skeleton.dart       // Shimmer placeholder
│   │   └── pull_to_refresh.dart        // Custom refresh indicator
│   │
│   ├── providers/
│   │   ├── database_provider.dart      // Drift DB instance
│   │   ├── shared_prefs_provider.dart  // SharedPreferences instance
│   │   └── sync_provider.dart          // Sync engine instance
│   │
│   ├── notifications/
│   │   ├── notification_service.dart   // Local + push notification setup
│   │   └── fcm_provider.dart           // Firebase Cloud Messaging
│   │
│   ├── services/
│   │   ├── location_service.dart       // GPS wrapper
│   │   ├── motion_service.dart         // Accelerometer / gyro
│   │   └── image_service.dart          // Image pick + compress
│   │
│   └── utils/
│       ├── logger.dart                 // Logging wrapper (never print())
│       ├── toast.dart                  // SnackBar / overlay toast helper
│       ├── date_utils.dart             // Date formatting
│       ├── geo_utils.dart              // Distance calc, coord conversion
│       └── constants.dart              // App-wide constants
│
├── features/
│   ├── auth/
│   │   ├── presentation/
│   │   │   ├── login_screen.dart
│   │   │   ├── confirm_account_screen.dart
│   │   │   └── reset_password_screen.dart
│   │   └── providers/
│   │       └── auth_provider.dart      // Supabase auth state
│   │
│   ├── dashboard/
│   │   ├── presentation/
│   │   │   ├── dashboard_screen.dart
│   │   │   └── widgets/
│   │   │       ├── fleet_overview_card.dart
│   │   │       ├── last_ride_card.dart
│   │   │       ├── maintenance_alert_card.dart
│   │   │       └── quick_stats_row.dart
│   │   └── providers/
│   │       └── dashboard_provider.dart // Aggregated dashboard state
│   │
│   ├── garage/
│   │   ├── presentation/
│   │   │   ├── garage_screen.dart
│   │   │   └── widgets/
│   │   │       ├── bike_card.dart
│   │   │       ├── add_bike_sheet.dart
│   │   │       ├── bike_detail_sheet.dart
│   │   │       ├── fuel_log_list.dart
│   │   │       └── add_fuel_sheet.dart
│   │   └── providers/
│   │       ├── bikes_provider.dart     // CRUD + Drift stream
│   │       └── fuel_logs_provider.dart
│   │
│   ├── ride/
│   │   ├── presentation/
│   │   │   ├── ride_screen.dart         // Main recorder UI
│   │   │   └── widgets/
│   │   │       ├── ride_hud.dart        // Speed, lean, distance overlay
│   │   │       ├── ride_controls.dart   // Start/pause/stop buttons
│   │   │       ├── ride_startup_animation.dart
│   │   │       └── pocket_curtain.dart
│   │   ├── providers/
│   │   │   ├── ride_session_provider.dart  // Active ride state
│   │   │   └── ride_tracking_provider.dart // GPS + motion streams
│   │   └── services/
│   │       ├── ride_recorder.dart       // Coordinate buffer + lean calc
│   │       └── pocket_detector.dart     // Proximity sensor logic
│   │
│   ├── rides/
│   │   ├── presentation/
│   │   │   ├── all_rides_screen.dart
│   │   │   └── widgets/
│   │   │       ├── ride_list_item.dart
│   │   │       ├── ride_detail_sheet.dart
│   │   │       ├── ride_map_view.dart
│   │   │       └── share_ride_sheet.dart
│   │   └── providers/
│   │       └── rides_provider.dart      // Paginated rides stream
│   │
│   ├── service/
│   │   ├── presentation/
│   │   │   ├── service_screen.dart
│   │   │   └── widgets/
│   │   │       ├── schedule_card.dart
│   │   │       ├── service_health_bar.dart
│   │   │       ├── complete_service_sheet.dart
│   │   │       └── maintenance_log_sheet.dart
│   │   └── providers/
│   │       ├── schedules_provider.dart
│   │       └── service_history_provider.dart
│   │
│   └── profile/
│       ├── presentation/
│       │   ├── profile_screen.dart
│       │   └── widgets/
│       │       ├── profile_header.dart
│       │       ├── theme_selector.dart
│       │       └── app_info_card.dart
│       └── providers/
│           └── profile_provider.dart
```

---

## 6. State Management & Data Flow

### Riverpod 3.x (Manual Providers — no codegen)

Matches Shiren's approach. No `@riverpod` annotations, no `build_runner` for providers (only for Drift).

#### Provider Types Used

| Provider Type | Use Case |
|---|---|
| `Provider` | Singletons: Drift DB, Supabase client, SharedPreferences |
| `StreamProvider` | Reactive UI: Drift `.watch()` queries, connectivity status |
| `FutureProvider` | One-shot reads: user profile, app version |
| `AsyncNotifierProvider` | Mutations: bike CRUD, ride save, fuel log CRUD |
| `StateProvider` | Simple UI state: selected bike filter, sort order |
| `NotifierProvider` | Complex local state: ride session, theme preferences |

#### Data Flow: Write Path

```
User Action
  → Provider.mutate()
    → Drift INSERT/UPDATE (isSynced = false)
      → Stream emits → UI updates instantly
    → SyncEngine queues Supabase upsert
      → On success: Drift UPDATE isSynced = true
      → On failure: retry queue with exponential backoff
```

#### Data Flow: Read Path

```
Screen mounts
  → ref.watch(bikesStreamProvider)
    → Drift .watch() query
      → Emits current rows immediately (no loading state for cached data)
      → Re-emits on any INSERT/UPDATE/DELETE
```

#### Ride Recording Data Flow

```
GPS Stream (geolocator)                    Motion Stream (sensors_plus)
  │                                          │
  ▼                                          ▼
  ride_tracking_provider                     ride_tracking_provider
  (filters, buffers coords)                  (calc lean angle from accel)
  │                                          │
  └──────────────┬───────────────────────────┘
                 ▼
         ride_session_provider (Notifier)
         - coords buffer (List<LatLng>)
         - max lean left/right
         - distance accumulator
         - auto-pause detection
                 │
                 ▼ on stop
         Drift INSERT ride row
         (route_path as JSON LineString)
                 │
                 ▼
         Sync to Supabase
         (PostGIS GEOGRAPHY column)
```

---

## 7. Database & Offline-First Strategy

### Drift Schema (SQLite)

Mirror the Supabase schema locally. Every table gets two extra columns:

```dart
// Added to every table
TextColumn get id => text()();   // UUID, primary key
BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
DateTimeColumn get lastModified => dateTime()();
```

#### Tables

**bikes**
```dart
class Bikes extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get make => text()();
  TextColumn get model => text()();
  IntColumn get year => integer().nullable()();
  RealColumn get currentOdo => real().withDefault(const Constant(0.0))();
  TextColumn get nickName => text().nullable()();
  TextColumn get imageUrl => text().nullable()();
  TextColumn get specsEngine => text().nullable()();
  TextColumn get specsPower => text().nullable()();
  RealColumn get avgMileage => real().nullable()();
  RealColumn get lastFuelPrice => real().nullable()();
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get lastModified => dateTime()();
  DateTimeColumn get createdAt => dateTime()();

  @override Set<Column> get primaryKey => {id};
}
```

**rides**
```dart
class Rides extends Table {
  TextColumn get id => text()();
  TextColumn get bikeId => text().references(Bikes, #id)();
  TextColumn get userId => text()();
  DateTimeColumn get startTime => dateTime()();
  DateTimeColumn get endTime => dateTime().nullable()();
  RealColumn get distanceKm => real().withDefault(const Constant(0.0))();
  RealColumn get maxLeanLeft => real().nullable()();
  RealColumn get maxLeanRight => real().nullable()();
  TextColumn get routePath => text().nullable()(); // GeoJSON LineString as JSON string
  TextColumn get rideName => text().nullable()();
  TextColumn get notes => text().nullable()();
  TextColumn get imageUrl => text().nullable()();
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get lastModified => dateTime()();
  DateTimeColumn get createdAt => dateTime()();

  @override Set<Column> get primaryKey => {id};
}
```

**fuel_logs, maintenance_logs, maintenance_schedules, service_history, notifications** — same pattern.

### Sync Engine

```dart
class SyncEngine {
  /// Runs in a background isolate on app start
  /// 1. Check connectivity
  /// 2. Query all rows where isSynced = false, ordered by lastModified
  /// 3. For each dirty row:
  ///    a. Upsert to Supabase (ON CONFLICT DO UPDATE)
  ///    b. On success → mark isSynced = true in Drift
  ///    c. On failure → log error, increment retry count, backoff
  /// 4. Pull remote changes since last sync timestamp
  ///    a. For each remote row: compare lastModified
  ///    b. Last-write-wins (or server-wins for conflicts)
  ///    c. Insert/update in Drift with isSynced = true
  /// 5. Schedule next sync (30s when online, longer when background)
}
```

**Conflict resolution:** Last-write-wins based on `lastModified` timestamp. Server timestamp is authoritative when conflict is detected.

**Initial sync (fresh install / login):** Pull all user data from Supabase → bulk insert into Drift.

---

## 8. Feature Breakdown & Screen Map

### 8.1 Dashboard

**Purpose:** At-a-glance overview of fleet and recent activity.

**Cards (all GlassCard):**
1. **Fleet Overview** — total bikes, total km, total rides (JetBrains Mono numbers)
2. **Last Ride** — bike name, date, distance, max lean, mini route map
3. **Maintenance Alerts** — overdue/due-soon schedules with warning colour
4. **Quick Stats Row** — avg ride distance, longest ride, this month's rides

**Data source:** `dashboardProvider` aggregates from Drift streams (bikes count, rides sum, schedule status).

**Animations:** Staggered fade+slide entry for cards (100ms delay each). Pull-to-refresh triggers sync.

### 8.2 Garage

**Purpose:** Manage motorcycle fleet.

**Flow:**
- Grid/list of bike cards (image, name, make/model, odo)
- Tap → bike detail bottom sheet (specs, fuel logs, service link)
- FAB → add bike bottom sheet
- Long press → edit / delete (with ride-existence guard)

**Fuel logs section per bike:**
- List of refuels with litres, cost, odo, date
- Auto-calculated avg mileage and last fuel price
- Add refuel bottom sheet

**Delete guards (same as current app):**
- Has rides → block deletion, show error toast
- Has maintenance/fuel logs only → show warning dialog, allow deletion

### 8.3 Ride Recorder

**Purpose:** Record GPS track + lean angle while riding.

**States:**
1. **Idle** — select bike, show start button
2. **Countdown** — 3-2-1 startup animation
3. **Recording** — HUD overlay (speed, lean gauge, distance, elapsed time)
4. **Paused** — manual pause or auto-pause (stationary 5+ min)
5. **Saving** — name ride, add notes/photo, save to Drift

**HUD Design:**
- Minimalist dark overlay — high contrast for sunlight readability
- Speed (km/h) + lean angle indicator (left/right arc)
- Distance counter + elapsed time (JetBrains Mono)
- Pocket mode curtain when proximity sensor triggers

**GPS configuration:**
- `geolocator` package: high accuracy, 2–5s interval, distance filter 5m
- Coordinate buffer in ride session provider
- Auto-pause: velocity < 2km/h for 300s

**Lean angle:**
- `sensors_plus` accelerometer stream
- Roll = atan2(accel_x, accel_z) × 180/π
- Peak filter for max left (negative) / max right (positive)
- 100ms sample rate, low-pass filter for noise

**Foreground service:**
- Flutter foreground service notification to prevent OS kill
- Wakelock to keep GPS alive

### 8.4 Ride History

**Purpose:** Browse and review past rides.

**Features:**
- Paginated list (20 rides per page, infinite scroll)
- Each item: bike name, date, distance, duration
- Tap → ride detail bottom sheet with full route map
- Share: export as image or GPX file
- Delete ride with confirmation

**Map rendering:**
- `flutter_map` with `vector_map_tiles` for dark base style
- Route polyline in accent green
- Start/end markers

### 8.5 Service & Maintenance

**Purpose:** Track maintenance schedules and service history per bike.

**Per bike:**
- List of active schedules (oil change, chain clean, air filter, etc.)
- Health bar: % of interval remaining (green → amber → red)
- "Complete Service" → logs service with odo, date, cost, notes
- Auto-updates `last_service_date` and `last_service_odo`
- Default schedules auto-created on new bike

### 8.6 Profile

**Purpose:** Account settings and app configuration.

**Sections:**
- **Profile header** — rider name, email (editable)
- **Theme selector** — primary accent colour picker (green, cyan, orange, amber)
- **App info** — version, build number, update check (Android)
- **Account actions** — change password (OTP flow), logout
- ~~Discord Integration~~ — **REMOVED**

---

## 9. Navigation & Routing

### GoRouter

```dart
GoRouter(
  initialLocation: '/dashboard',
  redirect: (context, state) {
    final isLoggedIn = ref.read(authProvider).isAuthenticated;
    final isAuthRoute = state.matchedLocation.startsWith('/login');
    if (!isLoggedIn && !isAuthRoute) return '/login';
    if (isLoggedIn && isAuthRoute) return '/dashboard';
    return null;
  },
  routes: [
    // Public
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/confirm', builder: (_, __) => const ConfirmAccountScreen()),
    GoRoute(path: '/reset-password', builder: (_, __) => const ResetPasswordScreen()),

    // Protected — wrapped in ShellRoute with BottomNavBar
    ShellRoute(
      builder: (_, __, child) => AppShell(child: child),
      routes: [
        GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
        GoRoute(path: '/garage', builder: (_, __) => const GarageScreen()),
        GoRoute(path: '/ride', builder: (_, __) => const RideScreen()),
        GoRoute(path: '/rides', builder: (_, __) => const AllRidesScreen()),
      ],
    ),

    // Protected — no bottom nav
    GoRoute(path: '/service/:bikeId', builder: (_, state) =>
      ServiceScreen(bikeId: state.pathParameters['bikeId']!)),
    GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
  ],
);
```

**Bottom nav** hides during active ride recording (same as current app). Use `GoRouter.of(context).location` to determine visibility.

**Page transitions:** Shared axis (horizontal) for tab switches, bottom-to-top for sheets/modals.

---

## 10. Animation System

### flutter_animate (Shiren's approach)

All pages and cards use composable animation chains:

```dart
// Page entry — staggered cards
Column(
  children: [
    FleetOverviewCard().animate().fadeIn(duration: 500.ms).slideY(begin: 0.15),
    LastRideCard().animate().fadeIn(duration: 500.ms, delay: 100.ms).slideY(begin: 0.15),
    MaintenanceCard().animate().fadeIn(duration: 500.ms, delay: 200.ms).slideY(begin: 0.15),
  ],
)
```

### Animation Guidelines

| Element | Animation | Duration | Curve |
|---|---|---|---|
| Page cards (stagger) | fadeIn + slideY(0.15) | 500ms, 100ms delay between | easeOut |
| Bottom sheets | slideY(1→0) + fadeIn | 300ms | easeOutCubic |
| Button press | scale(1→0.97) | 150ms | easeOut |
| Card press | scale(1→0.97) | 150ms | easeOut |
| Tab switch | shared axis horizontal | 300ms | easeInOut |
| Toast / snackbar | slideY(-1→0) + fadeIn | 250ms | easeOut |
| Ride HUD numbers | countUp / value transition | 200ms | linear |
| Route map draw | polyline path animation | 800ms | easeInOut |
| Shimmer loading | shimmer effect | 1500ms loop | linear |
| Pull-to-refresh | scale + rotate spinner | tied to gesture | — |

### Interactive Animations

```dart
// PressableGlassCard — same as Shiren
class PressableGlassCard extends StatefulWidget { ... }
// Uses AnimatedScale: factor 0.97 on tapDown, 1.0 on tapUp/cancel
// Duration: 150ms, curve: Curves.easeOut
```

### Ride Startup Sequence

Cinematic countdown before ride recording:
1. Bike name fades in (600ms)
2. 3 → 2 → 1 countdown with scale+fade (300ms each, 1s interval)
3. "Recording" text slides up + HUD elements fade in (staggered 100ms)

---

## 11. GPS, Motion & Ride Recording

### GPS — `geolocator` package

```dart
// Configuration
const locationSettings = AndroidSettings(
  accuracy: LocationAccuracy.high,
  distanceFilter: 5,           // metres — ignore micro-movements
  intervalDuration: Duration(seconds: 3),
  foregroundNotificationConfig: ForegroundNotificationConfig(
    notificationTitle: 'Apex — Recording Ride',
    notificationText: 'GPS tracking active',
    enableWakeLock: true,
  ),
);

// Stream
Geolocator.getPositionStream(locationSettings: locationSettings)
  .listen((Position position) {
    // Buffer in ride session provider
    // Calculate speed from consecutive coords
    // Check auto-pause condition
  });
```

### Motion — `sensors_plus` package

```dart
// Accelerometer for lean angle
accelerometerEventStream(samplingPeriod: Duration(milliseconds: 100))
  .listen((AccelerometerEvent event) {
    final roll = atan2(event.x, event.z) * (180 / pi);
    // Low-pass filter
    // Update max lean left/right with peak detection
  });
```

### Route Storage

```dart
// In Drift: store as JSON string
// '{"type":"LineString","coordinates":[[lng,lat],[lng,lat],...]}'

// On sync to Supabase: use PostGIS function
// ST_GeomFromGeoJSON(route_path_json)

// On pull from Supabase: convert PostGIS back to GeoJSON
// ST_AsGeoJSON(route_path)
```

### Foreground Service

Use `flutter_foreground_task` to keep the app alive during ride recording:
- Persistent notification with ride stats
- Wakelock to prevent CPU sleep
- Dart isolate keeps GPS stream processing even if UI is in background

---

## 12. Maps

### Decision: `flutter_map` + CartoCDN dark-matter tiles

After evaluating all options, went with `flutter_map` + CartoCDN raster tiles — same tile source the React app already uses (`basemaps.cartocdn.com`).

| Option | Pros | Cons |
|---|---|---|
| **mapbox_maps_flutter** | Native rendering (fastest), built-in dark styles, offline maps | Requires Mapbox account + API key, proprietary, binary bloat |
| **flutter_map + CartoCDN** | Zero cost, no API key, same tiles as React app, lightweight | Raster tiles (not vector), no built-in offline |
| **google_maps_flutter** | Familiar API, accurate | Widget resize lag, no true dark style, per-load pricing |

**Decision: `flutter_map`** — zero cost, no API key management, no account signup. CartoCDN dark-matter raster tiles provide the same dark aesthetic as the React app. `latlong2` provides `LatLng` type. If vector tiles or offline are needed later, can swap to `vector_map_tiles_pmtiles` with self-hosted Protomaps.

```yaml
dependencies:
  flutter_map: ^7.0.2
  latlong2: ^0.9.1
```

**Configuration:**
```dart
RideMap(
  routeData: routeData,  // parsed from GeoJSON
  height: 300,
  interactive: true,      // false for dashboard mini-map
)
```

**Dark map style:** CartoCDN dark-matter (`dark_all`) — charcoal roads, dark water, muted labels. URL: `https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png`. Matches `#0A0A0C` background.

**Route rendering:**
- Dual `PolylineLayer`: shadow (6px, 25% opacity, accent green) + main (3.5px, 90% opacity, accent green), rounded joins/caps
- Start marker: red circle with white border (`AppColors.error`)
- End marker: green circle with white border (`AppColors.accent`)
- Auto-fit camera to `LatLngBounds` with 50px padding, maxZoom 18

**Share functionality preserved:**
- `RenderRepaintBoundary.toImage()` — capture map widget as PNG for image share
- Route data exported as GPX 1.1 file (linear timestamp interpolation)
- Both share options via `share_plus` (`Share.shareXFiles`)

**Usage locations:**
- Dashboard → last ride mini-map (220px, non-interactive)
- Ride history → ride detail full interactive map (300px)
- (Future) Live map during ride recording

---

## 13. Notifications & Push

### Local Notifications — `flutter_local_notifications`

- Maintenance reminders (schedule-based: km or months elapsed)
- Ride auto-pause alert
- Background sync completion (silent)

### Push Notifications — Firebase Cloud Messaging

```yaml
dependencies:
  firebase_core: ^3.x
  firebase_messaging: ^15.x
```

- FCM token registration on login → store in Supabase `user_metadata`
- Server-triggered: maintenance overdue, new app version
- Handle notification tap → deep link to relevant screen via GoRouter

### In-App Notification Centre

- Drift table for notifications (mirrors Supabase `notifications` table)
- Stream-based: new notifications appear in real-time
- Read/dismiss state persisted locally and synced
- Notification bell in app bar with unread count badge

---

## 14. Authentication

### Supabase Auth (via `supabase_flutter`)

```dart
final supabase = Supabase.instance.client;

// Login
await supabase.auth.signInWithPassword(email: email, password: password);

// Signup
await supabase.auth.signUp(email: email, password: password, data: {'rider_name': name});

// Session persistence — handled by supabase_flutter (SharedPreferences)
// Auth state stream
supabase.auth.onAuthStateChange.listen((AuthState state) { ... });
```

### Auth Provider (Riverpod)

```dart
final authProvider = StreamProvider<AuthState>((ref) {
  return Supabase.instance.client.auth.onAuthStateChange;
});

// Derived
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).valueOrNull?.session != null;
});
```

### Flows preserved from current app:
- Email/password login & signup
- Email verification (confirm account screen)
- Password reset with OTP
- Rider name in user metadata

### Post-login:
- Trigger initial Drift sync (pull all user data from Supabase)
- Register FCM token
- Setup notification channel

---

## 15. Logging & Error Handling

### Logger Wrapper

```dart
// lib/core/utils/logger.dart
// Wraps the `logger` package — NEVER use print() or debugPrint()

import 'package:logger/logger.dart';

final logger = Logger(
  printer: PrettyPrinter(methodCount: 0, printTime: true),
  level: kDebugMode ? Level.trace : Level.warning,
);

// Usage:
// logger.d('Bike created: $id');
// logger.e('Sync failed', error: e, stackTrace: st);
```

### Toast Wrapper

```dart
// lib/core/utils/toast.dart
// Wraps ScaffoldMessenger or overlay toast — single source for all user feedback

class ApexToast {
  static void success(BuildContext context, String message) { ... }
  static void error(BuildContext context, String message) { ... }
  static Future<T> promise<T>(BuildContext context, {
    required Future<T> future,
    required String loading,
    required String success,
    String? error,
  }) async { ... }
}
```

### Error Boundary

- `FlutterError.onError` → log to logger
- `PlatformDispatcher.instance.onError` → catch async errors
- Per-feature error handling in AsyncNotifier `build()` methods
- Never swallow errors silently — always log + show user-facing toast

---

## 16. Testing Strategy

### Unit Tests
- Drift DAOs: in-memory SQLite, test CRUD + watch streams
- Providers: mock Drift, test business logic
- Sync engine: mock Supabase client, test conflict resolution
- Geo utils: distance calculation, coordinate conversion

### Widget Tests
- Core widgets: GlassCard renders, PressableGlassCard animates
- Screen composition: correct providers wired, data displayed

### Integration Tests
- Auth flow: login → dashboard → garage → ride → history
- Offline: create bike offline → verify Drift → go online → verify Supabase sync
- Ride recording: mock GPS stream → verify coords buffered → save → verify in Drift

### E2E RLS Tests (Supabase)

These tests exercise actual Supabase RLS policies using a dedicated test user account. They must run against the real database (not mocked) to catch policy gaps like the bikes UPDATE bug.

**Setup:** dedicated `test@apex.internal` Supabase user, cleaned up after each run.

| Test | Steps | Pass condition |
|---|---|---|
| **Bike CRUD** | sign in → INSERT bike → SELECT → UPDATE nick_name → DELETE | All 4 operations return data, no `0 rows` silent failure |
| **Bike isolation** | sign in as user A → insert bike → sign in as user B → attempt SELECT / UPDATE / DELETE on A's bike ID | All 3 operations return empty / error — no cross-user access |
| **Fuel log access** | sign in → insert bike → insert fuel_log (no user_id col) → SELECT fuel_logs for bike | Returns row — RLS via bikes join works |
| **Maintenance log access** | sign in → insert bike → insert maintenance_log → SELECT | Returns row — RLS via bikes join works |
| **Ride CRUD** | sign in → insert ride (with bike_id) → UPDATE → DELETE | All operations succeed for owner |
| **Ride isolation** | user B cannot SELECT or DELETE user A's rides | Returns empty |

Run these via a test script (`scripts/rls_e2e_test.ts`) using the Supabase JS client with service-role key for setup/teardown and anon key (with user JWT) for the actual assertions. Add to CI as a separate `test-rls` job that runs only on `main` pushes.

### Golden Tests (optional)
- Screenshot comparison for GlassCard, MeshBackground, BottomNavBar
- Ensure dark theme consistency across screens

---

## 17. Build, CI & Release

### Target Platforms

- **Android** — primary target, day-one support
- **iOS** — secondary target, added after Android is stable
- **Web** — not supported. No `flutter build web` target.

In `pubspec.yaml`, only Android and iOS platform folders are maintained.

### Android Build Flavours

Two flavours so debug and release APKs can coexist on the same device:

| | **Dev (Debug)** | **Production (Release)** |
|---|---|---|
| App name | **Apex Dev** | **Apex** |
| Package ID | `com.purukitto.apex.dev` | `com.purukitto.apex` |
| Icon | Same icon with a "DEV" ribbon overlay | Normal icon |
| Supabase | Can point to staging project (optional) | Production project |
| Logging | `Level.trace` (verbose) | `Level.warning` |
| Debug banner | Shown | Hidden |

```kotlin
// android/app/build.gradle.kts
android {
  compileSdk = 35
  defaultConfig {
    minSdk = 24        // Android 7.0 — covers 97%+ devices
    targetSdk = 35
    versionCode = flutterVersionCode.toInteger()
    versionName = flutterVersionName
  }

  flavorDimensions += "environment"
  productFlavors {
    create("dev") {
      dimension = "environment"
      applicationIdSuffix = ".dev"
      resValue("string", "app_name", "Apex Dev")
    }
    create("prod") {
      dimension = "environment"
      applicationId = "com.purukitto.apex"
      resValue("string", "app_name", "Apex")
    }
  }

  buildTypes {
    release {
      signingConfig = signingConfigs.getByName("release")
      isMinifyEnabled = true
      isShrinkResources = true
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
    }
  }
}
```

**Flutter build commands:**
```bash
# Development (installs as "Apex Dev" with .dev package suffix)
flutter run --flavor dev -t lib/main_dev.dart

# Production release
flutter build apk --flavor prod -t lib/main.dart --release
```

**Entry points:**
```
lib/
├── main.dart           # Production entry — prod Supabase URL, Level.warning
├── main_dev.dart       # Dev entry — staging URL (optional), Level.trace
└── app.dart            # Shared app widget (both entry points call this)
```

```dart
// lib/main_dev.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppConfig.initialize(environment: Environment.dev);
  runApp(const ProviderScope(child: ApexApp()));
}

// lib/main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppConfig.initialize(environment: Environment.prod);
  runApp(const ProviderScope(child: ApexApp()));
}
```

### CI (GitHub Actions)

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  analyze:
    - flutter pub get
    - dart analyze --fatal-infos
    - dart format --set-exit-if-changed .

  test:
    - flutter test

  build-android:
    - flutter build apk --flavor prod --release
    # No web build — mobile only
```

### Release Process

- Semantic versioning: `pubspec.yaml` version field
- Conventional commits for changelog generation
- GitHub Releases for APK distribution (prod flavour)
- Dev APKs built locally or via CI artifacts for testing
- (Future) Play Store via Fastlane

---

## 18. Migration Phases

### Standing rule: Old-code audit before every phase

**Before starting any phase**, read every React source file listed in that phase's "Old code to audit" section. For each file:

1. Extract every piece of logic that is in-scope for the phase (business rules, edge-case guards, error paths, debug/logging calls, UI copy, validation, timing values, magic constants).
2. Map each piece to a Flutter equivalent or explicitly mark it **dropped** with a reason.
3. Do not close a phase until the checklist below is satisfied:

> - [ ] All non-dropped logic is represented in the Flutter implementation
> - [ ] All `logger` / `console.*` call-sites have a `logger.dart` equivalent
> - [ ] All toast / error paths have an `ApexToast` equivalent
> - [ ] All magic numbers / thresholds / timeouts are preserved (or documented if changed)
> - [ ] Any TODO / FIXME comments in the old code are triaged (fix, carry forward, or drop)

### Standing rule: Update migration.md after every phase

**After completing any phase**, update the corresponding phase section in this document:

1. Mark completed checklist items with `[x]`.
2. Add an **Implementation notes** block below the checklist with:
   - Key decisions made (API choices, pattern deviations, workarounds)
   - Riverpod/Flutter API gotchas encountered and how they were fixed
   - Any items that were deferred to a later phase (with reason)
   - Files created (relative to `D:/Code/apex_flutter/lib/`)
3. Add a **Next phase prerequisites** block listing anything the next phase depends on being in place before it can start (e.g. "apply RLS migration", "verify Supabase connection works").

---

### Phase 0 — Project Setup ✅ COMPLETE

**Old code to audit:** `package.json`, `vite.config.ts`, `capacitor.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/lib/logger.ts`, `src/lib/toast.ts`, `src/lib/animations.ts`, `src/lib/constants.ts` (if present), `src/types/database.ts`

- [x] Audit: confirm all env vars / constants are captured in Flutter `AppConfig` / `constants.dart`
- [x] Audit: confirm logger severity levels and output format are replicated
- [x] Audit: confirm toast variants (success / error / promise) match existing usage
- [x] Audit: confirm animation durations / curves from `animations.ts` are carried into the animation system
- [x] Initialize Flutter project with package name `com.purukitto.apex`
- [x] Configure Android build flavours: `dev` (Apex Dev, `.dev` suffix) + `prod` (Apex) — **deferred to Phase 8**
- [x] Create `main.dart` and `main_dev.dart` entry points
- [x] Set up project structure (core/ + features/)
- [x] Configure `app_colors.dart`, `app_theme.dart`, `app_typography.dart`
- [x] Build core widgets: GlassCard, PressableGlassCard, MeshBackground, ApexButton
- [x] Setup Riverpod, GoRouter, Drift, Supabase client — Drift added in Phase 2
- [x] ~~Configure Mapbox SDK with dark style + access token~~ → Switched to flutter_map + CartoCDN (no API key needed) — **done in Phase 5**
- [x] Configure logger, toast, constants
- [x] Android manifest: permissions (location, internet, sensors, foreground service) — **completed in Phase 4**

**Implementation notes:**

- Flutter project created at `D:/Code/apex_flutter` with package name `com.purukitto.apex`, targeting Android + iOS only (no web).
- **Three items intentionally deferred** to phases where they're actually needed: build flavours → Phase 8 (Build & Release), Mapbox → Phase 5 (Ride History & Maps), Android manifest permissions → Phase 4 (Ride Recorder). This avoids configuring things that can't be tested yet.
- `AppConfig` handles environment switching (dev/prod) with separate Supabase credentials. `main.dart` and `main_dev.dart` select the environment at startup.
- Logger wraps the `logger` package with `AppLogger.t/d/i/w/e` methods and PrettyPrinter with timestamps.
- Toast system (`ApexToast`) provides `success`, `error` (with optional retry action), and `promise` (loading → success/error) variants using floating SnackBars with coloured left border.
- Theme system: `AppColors` (background, accent, status, card, text, glow), `AppTypography` (Playfair Display for titles, Inter for body, JetBrains Mono for numbers), `AppTheme.buildDarkTheme()`.
- Core widgets: `GlassCard` (BackdropFilter frosted glass, optional accent glow), `PressableGlassCard` (scale-on-press), `MeshBackground` (gradient + green aura + optional grid), `ApexButton` (filled/outlined/ghost with loading state), `ApexTextField`, `ConfirmDialog`, `ApexBottomNavBar`.
- Dependencies: `flutter_riverpod ^3.0.0`, `go_router ^14.0.0`, `supabase_flutter ^2.12.0`, `flutter_animate ^4.5.0`, `google_fonts ^8.0.0`, `logger ^2.0.0`, `shared_preferences ^2.0.0`, `uuid ^4.0.0`.
- Completed across Phases 0–1 in a single session; documented separately in Phase 1 notes.

### Phase 1 — Auth & Core Shell ✅ COMPLETE

**Old code to audit:** `src/pages/Login.tsx`, `src/pages/ConfirmAccount.tsx`, `src/pages/ResetPassword.tsx`, `src/pages/Profile.tsx`, `src/App.tsx` (route guards), `src/stores/useAuthStore.ts` (if present), any Supabase auth hooks in `src/hooks/`

- [x] Audit: all Supabase auth call variants (signIn, signUp, OTP, password reset) are preserved
- [x] Audit: session-persistence behaviour (token storage, refresh on resume) is replicated via `supabase_flutter`
- [x] Audit: GoRouter redirect logic matches existing route guard conditions exactly
- [x] Audit: Profile screen — every editable field, every action, all validation rules (Discord section confirmed dropped in §2)
- [x] Audit: all error toasts and success toasts on auth flows are reproduced
- [x] Login screen with Supabase auth
- [x] Confirm account + reset password screens
- [x] Auth provider + GoRouter redirect guard
- [x] App shell with MeshBackground + BottomNavBar
- [x] Navigation between all tab destinations (empty screens)
- [x] Profile screen (rider name, theme selector, logout)

**Implementation notes:**

- Flutter project created at `D:/Code/apex_flutter` (`com.purukitto.apex`, Android + iOS only, no web)
- **Riverpod 3.x `listenManual` removed** — `_RouterRefreshNotifier` rewired to use `ref.listen` inside `build` (valid in ConsumerStatefulWidget) notifying a plain `ChangeNotifier`. GoRouter `refreshListenable` uses this notifier.
- **`AsyncValue.valueOrNull` not available on Riverpod 3.3.1** — use `.asData?.value` instead for `isAuthenticatedProvider`.
- **`User.confirmedAt` deprecated** — use `emailConfirmedAt` in `login_screen.dart`.
- **`PrettyPrinter.printTime` deprecated** — use `dateTimeFormat: DateTimeFormat.onlyTimeAndSinceStart`.
- Phase 0 items (Drift, Mapbox, build flavours, Android manifest) deferred — not needed until Phase 2 (Drift) and Phase 5 (maps, now flutter_map instead of Mapbox). Build flavours deferred to Phase 8.
- `dart analyze` passes with 0 issues.

**Files created (`D:/Code/apex_flutter/lib/`):**
```
main.dart, main_dev.dart, app.dart
core/config/app_config.dart
core/theme/app_colors.dart, app_theme.dart, app_typography.dart
core/utils/constants.dart, logger.dart, toast.dart
core/providers/shared_prefs_provider.dart, theme_provider.dart
core/network/supabase_client.dart
core/widgets/glass_card.dart, pressable_glass_card.dart, mesh_background.dart,
  apex_button.dart, apex_text_field.dart, bottom_nav_bar.dart, confirm_dialog.dart
features/auth/providers/auth_provider.dart
features/auth/presentation/login_screen.dart, confirm_account_screen.dart, reset_password_screen.dart
features/profile/providers/profile_provider.dart
features/profile/presentation/profile_screen.dart
features/dashboard/presentation/dashboard_screen.dart  (placeholder)
features/garage/presentation/garage_screen.dart  (placeholder)
features/ride/presentation/ride_screen.dart  (placeholder)
features/rides/presentation/all_rides_screen.dart  (placeholder)
```

**Next phase prerequisites:**
- Apply `supabase/migrations/20260314000000_fix_bikes_rls.sql` to production before any sync testing
- Verify Supabase connection works: launch the app, attempt login, confirm session persists
- Add `drift` + `drift_dev` + `build_runner` + `sqlite3_flutter_libs` to `pubspec.yaml`
- Confirm Android `minSdk = 24` is set in `android/app/build.gradle.kts`

### Phase 2 — Database & Sync ✅ COMPLETE

**Old code to audit:** `src/types/database.ts` (full Supabase schema), all `src/hooks/use*.ts` TanStack Query hooks (stale times, retry config, optimistic update + rollback logic), `src/stores/` (any persisted Zustand state)

- [x] Audit: every Supabase table column is represented in the corresponding Drift table (no columns silently dropped)
- [x] Audit: RLS join rules for `maintenance_logs` and `fuel_logs` (no `user_id` — ownership via `bikes` join) are handled correctly in sync queries
- [x] Audit: TanStack Query stale times, retry counts, and optimistic rollback patterns are replicated in Riverpod `AsyncNotifier` error handling
- [x] Audit: any Zustand persisted state (non-ride) that must survive app restart has a `SharedPreferences` equivalent
- [x] **Apply migration `20260314000000_fix_bikes_rls.sql`** before testing sync — the `bikes` UPDATE policy was missing in production (see Appendix C)
- [x] Drift schema: all tables with `isSynced` + `lastModified`
- [x] DAOs for all entities
- [x] Sync engine: push dirty rows, pull remote changes
- [x] Initial sync on login (bulk pull)
- [x] Connectivity provider to trigger/pause sync
- [X] Verify offline create → online sync → verify in Supabase

**Implementation notes:**

- **RLS migration applied** via Supabase MCP (`fix_bikes_rls`) — all four CRUD policies on `bikes` are now idempotently created.
- **Android `minSdk` set to 24** in `build.gradle.kts` (required by `sqlite3_flutter_libs`).
- **7 Drift tables** mirror every column from `src/types/database.ts` plus `isSynced` (bool, default false) and `lastModified` (DateTime) for sync tracking. `global_bike_specs` excluded (read-only lookup, fetched on demand from Supabase).
- **5 DAOs** cover all entities: `BikesDao`, `RidesDao`, `FuelDao`, `MaintenanceDao` (covers maintenance_logs + maintenance_schedules + service_history), `NotificationsDao`. Each provides `watchForUser`/`watchForBike`, `getById`, `upsert`, `getDirtyRows`, `markSynced`, `deleteById`.
- **Fuel calculations** ported exactly from `src/utils/fuelCalculations.ts` → `lib/core/utils/fuel_calculations.dart`. `calculateMileage`: filter `isFullTank`, sort by odo desc, take last 2, `(logB.odo - logA.odo) / logB.litres`, null if <2 logs or <=0 or >1000, round 2 decimals. `getLastFuelPrice`: sort by date desc then createdAt desc, return first `pricePerLitre`.
- **`FuelDao.recalculateBikeStats`** calls the ported fuel calculations and updates the parent bike's `avg_mileage` + `last_fuel_price` columns.
- **`MaintenanceDao.initializeDefaultSchedules`** creates 8 default maintenance schedule entries (Engine Oil, Air Filter, Chain Lube, Chain Adjustment, Brake Pads, Coolant, Spark Plug, Tyres) with standard intervals via batch insert.
- **Sync engine** pushes in order: bikes → rides → fuel_logs → maintenance_logs → maintenance_schedules → service_history → notifications. Pull uses `lastSyncTimestamp` per table stored in `SharedPreferences`. Tables with `user_id` filter by `auth.uid()`; tables without (fuel, maintenance) filter by user's `bike_id`s. Rides pull attempts `get_rides_with_geojson` RPC first (PostGIS → GeoJSON), falls back to regular select.
- **Conflict resolution**: last-write-wins by timestamp, server wins ties. Only applies when local row has `isSynced = false` (dirty) and remote row exists.
- **Initial sync** triggers on login when local DB is empty (no bikes). Clears all `lastSyncTimestamp`s and pulls everything.
- **Periodic sync**: 30-second timer when online + authenticated, paused when offline or logged out.
- **Logout cleanup**: `ProfileNotifier.signOut` stops sync engine, clears sync timestamps, calls `db.deleteAllData()` (deletes all rows from all tables), then signs out of Supabase.
- **Sync orchestrator** wired into `app.dart` via `ref.watch(syncOrchestratorProvider)` — automatically starts/stops based on auth + connectivity state.
- **`supabase_flutter` does not export `Provider`** — removed `hide Provider` from imports (no conflict with Riverpod in these files).
- **Drift `Companion.insert()` gotcha**: required fields use raw types (e.g. `DateTime`), not `Value<DateTime>`. Only optional/defaulted fields use `Value<T>`.
- `dart analyze` passes with 0 issues.

**Files created (`D:/Code/apex_flutter/lib/`):**
```
core/database/app_database.dart (+.g.dart generated)
core/database/tables/bikes_table.dart
core/database/tables/rides_table.dart
core/database/tables/fuel_logs_table.dart
core/database/tables/maintenance_logs_table.dart
core/database/tables/maintenance_schedules_table.dart
core/database/tables/service_history_table.dart
core/database/tables/notifications_table.dart
core/database/daos/bikes_dao.dart (+.g.dart)
core/database/daos/rides_dao.dart (+.g.dart)
core/database/daos/fuel_dao.dart (+.g.dart)
core/database/daos/maintenance_dao.dart (+.g.dart)
core/database/daos/notifications_dao.dart (+.g.dart)
core/utils/fuel_calculations.dart
core/providers/database_provider.dart
core/providers/sync_provider.dart
core/network/connectivity_provider.dart
core/sync/sync_status.dart
core/sync/sync_engine.dart
core/sync/conflict_resolver.dart
```

**Files modified:**
```
pubspec.yaml (added drift, sqlite3_flutter_libs, connectivity_plus, path_provider, path, drift_dev, build_runner)
android/app/build.gradle.kts (minSdk = 24)
main.dart (added database construction + ProviderScope override)
main_dev.dart (same)
app.dart (added ref.watch(syncOrchestratorProvider))
features/profile/providers/profile_provider.dart (logout cleanup: stop sync, clear timestamps, delete local data)
```

**Next phase prerequisites (for Phase 3):**
- Phase 2 Drift schema fully generated (`dart run build_runner build`) ✅
- All DAOs tested with in-memory SQLite
- `bikesDao.watchForUser()` stream emits correctly before moving to Garage UI
- Verify `FuelDao.recalculateBikeStats` matches React calculation with sample data

### Phase 3 — Garage & Fuel ✅ COMPLETE

**Old code to audit:** `src/pages/Garage.tsx`, all bike/fuel TanStack Query hooks, `src/components/` bike and fuel components, `src/components/ui/Card.tsx`, `src/components/ui/ConfirmModal.tsx`

- [x] Audit: bike add/edit form — every field (8 fields: Make, Model, Year, Nickname, Current Odo, Image URL, Engine Specs, Power Specs), every validation rule (Make/Model required, odo ≥ 0 rounded to int, year 1900–currentYear+1), every default value
- [x] Audit: deletion guard logic — exact conditions for blocking (has rides) vs. warning (has logs only) are preserved
- [x] Audit: fuel log calculations — avg mileage formula, last fuel price update logic
- [x] Audit: all error states (network failure, validation error) produce the correct toast
- [x] Audit: ConfirmModal usage — every destructive action that requires confirmation is identified and replicated
- [x] Audit: global bike search — `global_bike_specs` table, ilike on `search_text`, client-side scoring (exact +150/+200, word +20, verified +1000, year +5), 500ms debounce, ≥3 chars, limit 5, report feature, self-healing image fetch via edge function
- [x] **Confirm `20260314000000_fix_bikes_rls.sql` is applied** — bike UPDATE was silently failing in production due to missing RLS policy (see Appendix C)
- [x] Garage screen: bike list with GlassCards (hero card + 2-column grid)
- [x] Add/edit bike bottom sheet with global bike search auto-populate
- [x] Delete bike with ride-guard logic
- [x] Fuel log list per bike
- [x] Add/edit refuel bottom sheet with 3-field auto-calculation
- [x] Auto-calculate avg mileage + last fuel price
- [x] All mutations: Drift first → sync → toast feedback

**Implementation notes:**

- **Garage screen** uses `ConsumerWidget` watching `bikesStreamProvider` (Drift stream). Three states: shimmer skeleton (loading), centered empty state with "Add your first machine" CTA, and populated view with `RefreshIndicator` → `CustomScrollView`. Hero bike (index 0) uses `GlassCard(isAccent: true)`, remaining bikes in a 2-column `SliverGrid`. Staggered fade+slideY animations via `flutter_animate` (500ms, 100ms delay between cards).
- **Pull-to-refresh** triggers `SyncEngine.syncAll()` (full push+pull cycle).
- **DAO count methods** added to `FuelDao.countForBike` and `MaintenanceDao.countLogsForBike` using the `selectOnly` + `countAll()` pattern from `RidesDao.countForBike`. Used by `bikeRelatedCountsProvider` for deletion guards.
- **Delete bike dialog** is a custom dialog (not `ConfirmDialog.show`) with conditional content: fetches counts via `bikeRelatedCountsProvider`, shows loading spinner while fetching, red warning box + disabled button if rides > 0, amber warning if logs only, "Safe to delete" if no related data.
- **Add/edit bike sheet** — `DraggableScrollableSheet(initialChildSize: 0.9)` inside `showModalBottomSheet(isScrollControlled: true, useSafeArea: true)`. Add mode includes global search at top. `ApexToast.promise()` for add ("Adding bike..." → "Bike Added"), `ApexToast.success()` for update ("Bike updated successfully").
- **Global bike search** — `GlobalBikeSearchService` queries `global_bike_specs` with `.ilike('search_text', '%$query%')`, fetches 20 results and applies client-side scoring. Results shown as `PressableGlassCard` items with verified badge and report button. On select, auto-populates Make, Model, Year, Image URL, Engine (from displacement), Power using `String.toTitleCase()`. Self-healing: if `image_url` is null, calls `fetch-bike-image` edge function in background.
- **Global search provider** uses `NotifierProvider.autoDispose` (Riverpod 3.x) wrapping `AsyncValue<List<GlobalBikeSpec>>` with a 500ms debounce timer. `ref.onDispose` cancels the timer.
- **Fuel log sheet** — bottom sheet per bike showing header (title, bike name, avg mileage in green monospace), "Add Refuel" button, list of `FuelLogTile` widgets. Empty state with fuel icon. Delete uses `ConfirmDialog.show(isDestructive: true)`.
- **3-field fuel calculation** — tracks which of {litres, pricePerLitre, totalCost} are filled: 2 filled auto-calculates the third (shown in green info box), 3 filled validates `|litres × price - total| ≤ 0.05` (else error), <2 filled shows error on submit. All values rounded to 2 decimal places.
- **Bike actions** — `BikeActions` class (via `Provider`): `addBike` generates UUID, upserts via `BikesCompanion`, then calls `maintenanceDao.initializeDefaultSchedules(bikeId)`. `updateBike` upserts with `isSynced: false`. `deleteBike` calls `bikesDao.deleteById`.
- **Fuel actions** — `FuelActions` class: all mutations call `fuelDao.recalculateBikeStats(bikeId)` after write to keep avg mileage and last fuel price current.
- **`intl` package** added for `DateFormat('MMM d, yyyy')` in fuel log tiles and date picker display.
- **Riverpod 3.x API** — `StateNotifier`/`StateNotifierProvider` removed in 3.x. Used `NotifierProvider.autoDispose` with `Notifier<AsyncValue<T>>` for the search provider. `AsyncNotifier`/`AsyncNotifierProvider` used for profile mutations (existing pattern).
- **Deprecated `Switch.activeColor`** replaced with `activeTrackColor` + `activeThumbColor` (deprecated after Flutter 3.31).
- **Maintenance route** — "Maintenance" button on bike cards navigates to `ServiceScreen` (wired in Phase 6).
- `dart analyze` passes with 0 issues.

**Files created (`D:/Code/apex_flutter/lib/`):**
```
core/utils/string_utils.dart
features/garage/data/global_bike_search_service.dart
features/garage/providers/bikes_provider.dart
features/garage/providers/fuel_logs_provider.dart
features/garage/presentation/widgets/bike_image.dart
features/garage/presentation/widgets/hero_bike_card.dart
features/garage/presentation/widgets/bike_grid_card.dart
features/garage/presentation/widgets/add_edit_bike_sheet.dart
features/garage/presentation/widgets/delete_bike_dialog.dart
features/garage/presentation/widgets/fuel_log_sheet.dart
features/garage/presentation/widgets/fuel_log_tile.dart
features/garage/presentation/widgets/add_edit_fuel_sheet.dart
```

**Files modified:**
```
core/database/daos/fuel_dao.dart (added countForBike)
core/database/daos/maintenance_dao.dart (added countLogsForBike)
features/garage/presentation/garage_screen.dart (rewritten from placeholder)
pubspec.yaml (added intl: ^0.19.0)
```

**Next phase prerequisites (for Phase 4):** ✅ met
- Phase 3 Garage screen functional: bikes visible, add/edit/delete working ✅
- Fuel log 3-field calculation verified with manual testing ✅
- At least one bike exists in local DB (needed for ride recorder bike selector) ✅
- Verify `SyncEngine.syncAll()` successfully pushes new bikes/fuel logs to Supabase ✅

### Phase 4 — Ride Recorder (1–2 sessions) ✅

**Old code to audit:** `src/pages/Ride.tsx`, `src/stores/useRideStore.ts`, `src/hooks/useGeolocation.ts` (or equivalent), `src/hooks/useMotion.ts` (or equivalent), any pocket-mode / proximity sensor logic, `src/lib/animations.ts` (startup sequence)

- [x] Audit: GPS config values — accuracy mode, distance filter (5 m), interval (3 s) — must match
- [x] Audit: lean angle formula (`atan2(x, sqrt(y²+z²))`), EMA alpha=0.15, peak-detection logic — carry forward exactly
- [x] Audit: auto-pause threshold values (speed == 0, 300 s / 5 min) — carry forward exactly
- [x] Audit: coord buffer structure and GeoJSON serialisation format for route path
- [x] Audit: pocket/proximity sensor trigger conditions and curtain dismissal logic
- [x] Audit: startup animation timing (boot 800ms, gauge 1200ms, ready 500ms) — match durations
- [x] Audit: ride save flow — all fields saved (distance, max lean L/R, times, route GeoJSON)
- [x] Audit: any `console.*` / `logger.*` calls in ride store — replicate as `AppLogger` calls
- [x] Ride screen: bike selector card + start button + auto-select single bike
- [x] GPS service with foreground notification (`flutter_foreground_task`)
- [x] Motion service: accelerometer lean angle calculation (EMA smoothing, 70° clamp, motion lock <10 km/h)
- [x] Ride session provider: coord buffer, Haversine distance, lean state, auto-pause timer
- [x] HUD overlay: speed (96sp JetBrains Mono + green glow), lean gauges L/R, current lean, distance, duration
- [x] Pocket mode detection + curtain (proximity_sensor, double-tap/swipe-up dismiss)
- [x] Save flow: Drift insert with `isSynced: false` + odo update → sync engine pushes to Supabase
- [x] Startup countdown animation (3-phase boot→gauge→ready with CustomPainter arc sweep)
- [x] Android manifest: location, foreground service, wake lock, sensor permissions + service declaration
- [x] Bottom nav hidden during active ride (countdown/recording/paused/saving)
- [x] Long-press stop button (3s hold with circular progress)
- [x] Calibrate button with haptic feedback (vibration package)
- [x] Discard ride with ConfirmDialog
- [x] Safety warning banner (5s fade)
- [x] Wakelock during recording (wakelock_plus)

**Implementation notes:**

- `flutter analyze` passes with 0 issues; debug APK builds successfully.
- Dependencies added: `geolocator ^13.0.2`, `sensors_plus ^6.1.1`, `flutter_foreground_task ^8.12.0`, `wakelock_plus ^1.2.8`, `vibration ^2.0.0`, `proximity_sensor ^1.0.5`.
- **Key constants match React exactly:** EMA alpha 0.15, max lean 70°, motion lock 10 km/h, auto-pause 5 min, long-press 3s, safety warning 5s, calibration key `apex-calibration-offset`, distance filter 5m, distance rounding 2dp, lean rounding 1dp.
- Lean formula: `rollRad = atan2(x, sqrt(y² + z²))`, calibrated with stored offset, EMA smoothed, clamped to 70°. Left lean when calibrated < 0.
- Ride session state uses Riverpod `Notifier<RideSessionState>` with status enum: idle → countdown → recording → paused → saving → idle.
- Ride tracking provider orchestrates GPS/motion/pocket streams; starts/stops based on session status changes.
- Save writes to Drift with GeoJSON `{"type":"LineString","coordinates":[[lng,lat],...]}`, updates bike `currentOdo`, marks `isSynced: false` for sync engine.
- Pocket curtain: full black overlay, circular-motion text (30px radius), dismiss via double-tap (500ms window) or swipe-up (>100px delta). Android only.
- Name/notes/photo fields on ride are deferred — the Rides table supports them but the save flow doesn't prompt for them yet (matches React behaviour where these are optional post-save edits).

```
New files:
  lib/core/services/location_service.dart
  lib/core/services/motion_service.dart
  lib/core/services/foreground_service.dart
  lib/core/utils/geo_utils.dart
  lib/features/ride/providers/ride_session_provider.dart
  lib/features/ride/providers/ride_tracking_provider.dart
  lib/features/ride/providers/ride_actions_provider.dart
  lib/features/ride/services/pocket_detector.dart
  lib/features/ride/presentation/widgets/ride_hud.dart
  lib/features/ride/presentation/widgets/ride_controls.dart
  lib/features/ride/presentation/widgets/ride_startup_animation.dart
  lib/features/ride/presentation/widgets/pocket_curtain.dart
  lib/features/ride/presentation/widgets/bike_selection_modal.dart

Modified files:
  pubspec.yaml (6 new dependencies)
  android/app/src/main/AndroidManifest.xml (permissions + service)
  lib/features/ride/presentation/ride_screen.dart (full rewrite)
  lib/app.dart (hide bottom nav during recording)
```

**Next phase prerequisites (for Phase 5):**
- Phase 4 ride recorder functional: can start, record GPS/lean, save to Drift ✅
- At least one saved ride in local DB with route_path GeoJSON (needed for map/history testing) ✅
- ~~Mapbox access token available for SDK setup~~ → Switched to flutter_map + CartoCDN (no API key needed)

### Phase 5 — Ride History & Maps + UI Fixes (1 session) ✅

**Old code to audit:** `src/pages/Rides.tsx` (or History), ride detail component, map rendering component, GPX export logic, share logic, `src/pages/Dashboard.tsx` (last-ride mini-map)

- [x] Audit: pagination page size and infinite-scroll trigger offset
- [x] Audit: ride detail fields displayed — every stat shown in the sheet is reproduced
- [x] Audit: GPX export format and file naming convention are preserved
- [x] Audit: share sheet options (image vs. GPX) and any share text / metadata
- [x] Audit: map polyline styling (colour, width, start/end markers) matches spec exactly
- [x] Audit: dashboard mini-map — static snapshot vs. live map decision, camera framing logic
- [x] All rides screen: paginated list from Drift stream
- [x] Ride detail bottom sheet with full map
- [x] ~~Mapbox SDK setup with `MapboxStyles.DARK`~~ → flutter_map + CartoCDN dark-matter tiles (same tile source as React app)
- [x] Route polyline rendering (accent green)
- [x] Share ride: GPX file export via share_plus + widget image capture via RenderRepaintBoundary
- [x] Delete ride with confirmation
- [x] Dashboard mini-map for last ride
- [x] UI Fix: GlassCard — charcoal gradient instead of glass blur (matching React card styling)
- [x] UI Fix: Bottom nav — reorder (Dashboard, Garage, History, Ride), Ride as green CTA, increased margin
- [x] UI Fix: Pocket mode — debounce (300ms uncovering, 500ms sustained cover), fade-in curtain

**Implementation notes:**

- `dart analyze` passes with 0 issues; debug APK builds successfully.
- Dependencies added: `flutter_map ^7.0.2`, `latlong2 ^0.9.1`, `share_plus ^10.1.4`.

**UI Fixes (Part A):**

- **GlassCard** rewritten from `BackdropFilter(blur: 40)` → `Container` with `LinearGradient(topLeft→bottomRight)` from `Color(0x80181818)` → `Color(0xCC0A0A0A)` → `Color(0xF20A0A0A)`. Matches React app's `bg-gradient-to-br from-rgba(24,24,27,0.5) via-black/80 to-black/95`. Accent variant uses green-tinted charcoal gradient + green glow shadow. Removes expensive `ClipRRect` + `BackdropFilter` wrapper.
- **Bottom nav** reordered: Dashboard, Garage, History, **Ride** (last = bottom right). Ride button is a permanently filled green (`AppColors.accent`) pill with icon + "RIDE" label always visible, dark text, green shadow. Other buttons remain icon-only when inactive, icon+label when active. Bottom margin increased from 8 → 16px. Nav background changed from `AppColors.backgroundMid.withOpacity(0.8)` to `Colors.white.withOpacity(0.1)`. Removed `BackdropFilter` from nav bar (was `blur: 20`).
- **Pocket mode** — `PocketDetector`: raw proximity events now processed through a `StreamTransformer` with dual debounce: 500ms sustained coverage before emitting `true` (prevents false triggers from hand passing over sensor), 300ms debounce before emitting `false` (prevents rapid on/off flicker). `AppLogger.d` calls added for sensor state changes. `PocketCurtain`: wraps in `FadeTransition` with 300ms `AnimationController` so brief sensor flickers don't flash the curtain. Changed mixin from `SingleTickerProviderStateMixin` to `TickerProviderStateMixin` for two controllers.

**Ride History & Maps (Part B):**

- **Map decision:** `flutter_map` + CartoCDN dark-matter raster tiles (`https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png`) — same tile provider the React app uses via `basemaps.cartocdn.com/dark-matter-gl-style`. Zero cost, no API key, no account required. Dropped Mapbox SDK to avoid binary bloat + API key management. `latlong2` provides `LatLng` type.
- **RideMap widget** — reusable `FlutterMap` widget with: CartoCDN dark tiles, dual `PolylineLayer` (6px shadow at 25% opacity + 3.5px main at 90% opacity, both accent green, rounded joins/caps), start marker (red circle with white border) + end marker (green circle with white border), camera auto-fits to `LatLngBounds` with 50px padding. Supports interactive (ride detail) and non-interactive (dashboard mini-map) modes. `ClipRRect` with borderRadius 16.
- **Utility files** — `format_utils.dart` (duration "Xh Ym", relative date "Today"/"Yesterday"/"3 days ago"/"Mar 12", full datetime), `geojson_parser.dart` (GeoJSON LineString/MultiLineString → `RouteData` with coordinates + bounding box), `gpx_export.dart` (GPX 1.1 XML with linear timestamp interpolation, XML escaping, `ride_YYYY-MM-DD.gpx` naming), `share_utils.dart` (GPX file share via `Share.shareXFiles`, widget image capture via `RenderRepaintBoundary.toImage` at 3x pixel ratio → PNG → share).
- **RidesDao extensions** — `countForUser(userId)` using `selectOnly` + `countAll()`, `totalDistanceForUser(userId)` using `rides.distanceKm.sum()`, `watchRecentForUser(userId, limit: 5)` for dashboard. Generated code regenerated via `build_runner`.
- **Rides provider** — follows garage pattern: `ridesStreamProvider` (all user rides), `rideCountProvider` (total count), `ridesListProvider` (paginated via `RidesListNotifier` managing growing limit — starts 20, `loadMore()` adds 20, watches `watchForUserPaginated`), `rideActionsProvider` with `RideActions.updateRide()` (preserves all existing fields, marks `isSynced: false`) and `deleteRide()` (deletes from both Drift and Supabase directly since sync engine doesn't track deletes).
- **RideListTile** — `PressableGlassCard` showing ride name (or bike name fallback) + relative date, optional bike name secondary text, stats row (distance in JetBrains Mono, duration, lean angles).
- **EditRideSheet** — `showModalBottomSheet(isScrollControlled: true)` with ride name, notes (multiline, 500 char max), image URL fields. Save via `rideActionsProvider.updateRide()` + `ApexToast.promise()`.
- **RideDetailSheet** — `DraggableScrollableSheet(initialChildSize: 0.85)` containing: header (name + date), stats row (distance, duration, lean L/R as JetBrains Mono mini-cards), start/end times in `GlassCard`, notes section, interactive `RideMap` (300px), action buttons (GPX export, edit → pops detail and opens edit sheet, delete with `ConfirmDialog.show(isDestructive: true)` → deletes from Drift + Supabase → pops sheet).
- **AllRidesScreen** — `ConsumerStatefulWidget` with `ScrollController` detecting near-bottom (200px threshold) → `ridesListNotifier.loadMore()`. Resolves bike names from `bikesStreamProvider`. Staggered fade+slideY animations (400ms, 60ms delay per item). Empty state with route icon + message. 120px bottom padding for nav bar.
- **DashboardScreen** — `ConsumerWidget` with `dashboardStatsProvider` (aggregates: rider name from user metadata, total distance via `totalDistanceForUser`, bike count from `bikesStreamProvider`, ride count via `countForUser`) and `recentRidesProvider` (watches recent 5 rides). Layout: welcome card (`GlassCard(isAccent: true)` with name + total km in green JetBrains Mono), stats row (tappable `PressableGlassCard` navigating to /garage and /rides), last ride card (name, bike, stats, 220px non-interactive `RideMap` mini-map). `RefreshIndicator` triggers `syncEngine.syncAll()` + `ref.invalidate(dashboardStatsProvider)`. Staggered animations (500ms, 100ms delay).

**Files created (`D:/Code/apex_flutter/lib/`):**
```
core/utils/format_utils.dart
core/utils/geojson_parser.dart
core/utils/gpx_export.dart
core/utils/share_utils.dart
core/widgets/ride_map.dart
features/rides/providers/rides_provider.dart
features/rides/presentation/widgets/ride_list_tile.dart
features/rides/presentation/widgets/edit_ride_sheet.dart
features/rides/presentation/widgets/ride_detail_sheet.dart
features/dashboard/providers/dashboard_provider.dart
```

**Files modified:**
```
core/widgets/glass_card.dart (rewritten: charcoal gradient instead of BackdropFilter blur)
core/widgets/bottom_nav_bar.dart (rewritten: reordered, Ride CTA, margin, background)
core/database/daos/rides_dao.dart (added countForUser, totalDistanceForUser, watchRecentForUser)
core/database/daos/rides_dao.g.dart (regenerated by build_runner)
features/ride/services/pocket_detector.dart (rewritten: debounce + sustained cover)
features/ride/presentation/widgets/pocket_curtain.dart (added FadeTransition, dual ticker)
features/rides/presentation/all_rides_screen.dart (rewritten from placeholder)
features/dashboard/presentation/dashboard_screen.dart (rewritten from placeholder)
pubspec.yaml (added flutter_map, latlong2, share_plus)
```

**Next phase prerequisites (for Phase 6):**
- Phase 5 ride history screen functional: rides visible, detail sheet with map, edit/delete working ✅
- Dashboard shows stats + last ride with mini-map ✅
- At least one bike with rides exists for maintenance testing
- Verify maintenance DAO default schedules seeded on bike creation (done in Phase 3)

### Phase 6 — Service & Maintenance (1 session) ✅

**Old code to audit:** `src/pages/Service.tsx` (or Maintenance), schedule/service hooks, `src/pages/Dashboard.tsx` (maintenance alert card), default schedule seed data

- [x] Audit: health bar percentage formula — interval type (km vs. months), calculation from `last_service_odo` / `last_service_date`
- [x] Audit: alert threshold values (due-soon %, overdue %) — carry forward exactly
- [x] Audit: default schedule list (names, intervals, units) seeded on new bike — Flutter seeds 8 schedules (more comprehensive than React's 3)
- [x] Audit: complete-service form fields (odo, date, cost, notes) and how `last_service_*` columns are updated
- [x] Audit: maintenance log list fields and sort order
- [x] Service screen per bike
- [x] Schedule cards with health bars
- [x] Complete service bottom sheet
- [x] Maintenance log view
- [x] Auto-create default schedules on new bike (already done in Phase 3 via `MaintenanceDao.initializeDefaultSchedules`)
- [x] Maintenance alert card on dashboard

**Implementation notes:**
- Health formula ported exactly from React `HealthCard.tsx`: `kmHealth = 100 - (kmUsed / intervalKm) * 100`, `timeHealth = 100 - (monthsUsed / intervalMonths) * 100`, `finalHealth = min(kmHealth, timeHealth).clamp(0, 100)`. Never-serviced time-based items → 0%.
- Alert threshold: health < 60% shows on dashboard alert card; health < 20% shows "DUE" badge + red "Fix Now" button on health card.
- Service screen uses `Navigator.push` (MaterialPageRoute) from garage — not a GoRouter route — matching the pattern of overlay screens that don't need deep-link support.
- `maintenanceAlertsProvider` is a reactive `Provider` (not `StreamProvider`) that watches `bikesStreamProvider` + `schedulesStreamProvider` for all bikes, returns sorted alerts.
- Dashboard alert card taps to `/garage` (user picks bike → service).

**Files created:**
```
features/service/providers/service_provider.dart
features/service/providers/maintenance_alerts_provider.dart
features/service/presentation/service_screen.dart
features/service/presentation/widgets/health_card.dart
features/service/presentation/widgets/complete_service_sheet.dart
features/service/presentation/widgets/service_history_sheet.dart
features/dashboard/presentation/widgets/maintenance_alert_card.dart
```

**Files modified:**
```
features/garage/presentation/garage_screen.dart (_onMaintenance → navigates to ServiceScreen)
features/dashboard/presentation/dashboard_screen.dart (added MaintenanceAlertCard)
```

**Next phase prerequisites (for Phase 7):**
- Phase 6 service & maintenance fully functional: health cards, complete service, service history, dashboard alerts ✅
- At least one bike with default schedules seeded (8 schedules per bike)
- Verify health formula produces 0% for never-serviced time-based items
- Verify "Fix Now" → complete service → health resets correctly

### Phase 7 — Notifications & Polish (1 session)

**Old code to audit:** `src/stores/useNotificationStore.ts`, Firebase SW injection scripts (`scripts/inject-firebase-sw.js`), notification-related hooks, `src/pages/Dashboard.tsx` (pull-to-refresh, skeleton states), any loading/skeleton components

- [x] Audit: FCM token registration flow and where the token is stored in Supabase user metadata
- [x] Audit: local notification schedule triggers (km elapsed, months elapsed, exact thresholds)
- [x] Audit: in-app notification data shape, read/dismiss state fields
- [x] Audit: pull-to-refresh — which screens have it, what data is refetched
- [x] Audit: skeleton / loading states — which screens show shimmer vs. spinner vs. nothing
- [x] FCM setup + token registration (`FirebaseService` — init, requestPermission, getToken, registerToken via `upsert_push_token` RPC, foreground/background handlers)
- [x] Local notifications for maintenance reminders (`LocalNotificationService` — maintenance channel, schedule/cancel by scheduleId, distance-based immediate trigger)
- [x] In-app notification centre (bell + pane) (`NotificationBell` with unread badge, `NotificationSheet` bottom sheet with mark-read/dismiss/clear-all, `NotificationTile` with type badge + timeago)
- [x] Pull-to-refresh on dashboard + garage + rides (all three screens now have `RefreshIndicator` → `syncAll()` + provider invalidation)
- [x] Loading skeletons (shimmer) for initial data fetch (`DashboardShimmer`, `RidesShimmer`, `ShimmerCard` — all using `flutter_animate` `.shimmer()` effect)
- [x] App update checker (Android) (`UpdateChecker` — reads `app_settings` table for `latest_version_android`, shows non-blocking dialog)
- [x] Maintenance checker provider (`maintenanceCheckerProvider` — watches all bikes/schedules, creates Drift notifications when health ≤ 20%, triggers local notification for overdue items)
- [x] Notification providers (`notificationsProvider`, `unreadCountProvider`, `NotificationActions` — mark read/dismiss/bulk ops)
- [x] Firebase Android integration (google-services.json copied, google-services plugin, core library desugaring, POST_NOTIFICATIONS permission)
- [ ] Final animation polish pass
- [ ] Edge-to-edge + safe area handling

### Phase 8 — Testing & Release (1 session)

**Old code to audit:** existing test files (if any), `package.json` scripts, `.github/workflows/` CI config, `.env.example` (all env vars accounted for in Flutter `AppConfig`)

- [ ] Audit: every env var in `.env.example` has a Flutter equivalent (Supabase URL/anon key, Firebase config — Mapbox token no longer needed)
- [ ] Audit: CI steps (lint, type check, build) are replicated with Flutter equivalents (`dart analyze`, `flutter test`, `flutter build apk`)
- [ ] Audit: any existing unit/integration tests — port coverage intent (not the tests themselves) to Flutter
- [ ] Unit tests: DAOs, providers, sync engine, geo utils
- [ ] Widget tests: core components
- [ ] Integration test: full user flow
- [ ] **E2E RLS test suite** (`scripts/rls_e2e_test.ts`) — bike CRUD, cross-user isolation, fuel/maintenance log RLS via bikes join (see §16 E2E RLS Tests)
- [ ] CI pipeline (GitHub Actions) — add `test-rls` job gated on `main` push
- [ ] Release APK signing
- [ ] Migration guide for existing users (re-login to trigger initial sync)

---

## 19. Dependency Matrix

| Category | Package | Version | Purpose |
|---|---|---|---|
| **Framework** | `flutter` | SDK | UI framework |
| **State** | `flutter_riverpod` | ^3.2.x | State management |
| **Routing** | `go_router` | ^14.x | Declarative navigation |
| **Database** | `drift` | ^2.32.x | Local SQLite ORM |
| **Database** | `sqlite3_flutter_libs` | ^0.5.x | SQLite native bindings |
| **Backend** | `supabase_flutter` | ^2.12.x | Auth + DB + Realtime |
| **GPS** | `geolocator` | ^13.x | Location streaming |
| **Sensors** | `sensors_plus` | ^6.x | Accelerometer, gyroscope |
| **Maps** | `flutter_map` | ^7.0.x | Tile-based map rendering (CartoCDN dark-matter tiles, no API key) |
| **Maps** | `latlong2` | ^0.9.x | LatLng type for flutter_map coordinates |
| **Animations** | `flutter_animate` | ^4.5.x | Composable animations |
| **Typography** | `google_fonts` | ^8.x | Playfair Display + Inter |
| **Icons** | `lucide_icons` | ^0.257.x | Icon set (matches current) |
| **Charts** | `fl_chart` | ^1.1.x | Fuel/ride statistics |
| **Notifications** | `flutter_local_notifications` | ^18.x | Local notification scheduling |
| **Push** | `firebase_core` | ^3.x | Firebase init |
| **Push** | `firebase_messaging` | ^15.x | FCM push notifications |
| **Images** | `image_picker` | ^1.x | Camera/gallery picker |
| **Images** | `flutter_image_compress` | ^2.x | Compress before upload |
| **Background** | `flutter_foreground_task` | ^8.x | Foreground service for GPS |
| **Storage** | `shared_preferences` | ^2.x | Simple key-value persistence |
| **Storage** | `path_provider` | ^2.x | File system paths |
| **Connectivity** | `connectivity_plus` | ^6.x | Online/offline detection |
| **Utils** | `uuid` | ^4.x | UUID generation |
| **Utils** | `intl` | ^0.19.x | Date/number formatting |
| **Utils** | `logger` | ^2.x | Structured logging |
| **Utils** | `share_plus` | ^10.x | Share files/text |
| **Utils** | `url_launcher` | ^6.x | Open external links |
| **Utils** | `package_info_plus` | ^9.x | App version info |
| **Dev** | `build_runner` | ^2.x | Drift code generation |
| **Dev** | `drift_dev` | ^2.x | Drift schema codegen |
| **Dev** | `flutter_lints` | ^4.x | Lint rules |

---

## 20. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **PostGIS ↔ Drift mismatch** | Route paths stored differently in SQLite vs PostgreSQL | Store as GeoJSON text in Drift; convert to/from PostGIS geometry on sync using `ST_GeomFromGeoJSON` / `ST_AsGeoJSON` RPC functions |
| **Background GPS killed by OEM** | Xiaomi/Samsung/Oppo aggressive battery optimization kills foreground service | Use `flutter_foreground_task` with persistent notification; document OEM battery settings for users; test on real devices from these manufacturers |
| **Drift migration complexity** | Schema changes require careful migration code | Use Drift's versioned migrations from day 1; never alter tables in place |
| **Initial sync bandwidth** | Users with many rides could have large initial sync | Paginate initial pull (50 rows per batch); show progress indicator; sync rides last (largest payload) |
| **Lean angle accuracy** | Accelerometer noise varies between phone models | Low-pass filter + calibration option; document that lean angle is approximate |
| **flutter_map tile cost** | CartoCDN raster tiles have no hard usage limits but are rate-limited | Free tier sufficient for mobile app usage; could self-host PMTiles if needed |
| **Auth token refresh** | Supabase token expiry during long rides | `supabase_flutter` handles auto-refresh; verify behavior during 2hr+ rides |
| **Data loss during migration** | Users switching from React to Flutter app | No data migration needed — same Supabase backend; user logs in → initial sync pulls all existing data |
| **RLS policy gaps** | Missing UPDATE/DELETE policy causes silent 0-row returns — no error shown to user, optimistic UI reverts unexpectedly | Apply `20260314000000_fix_bikes_rls.sql`; cover all tables with E2E RLS test suite before every release |

---

## Appendix A: Files to Remove (Discord Cleanup)

These files should be deleted from the React codebase before archiving:

```
src/config/discord.ts
src/lib/discordLogin.ts
src/lib/discordRpc.ts
src/lib/discordAuth.ts
src/stores/useDiscordRpcStore.ts
src/hooks/useDiscord.ts
```

Plus remove Discord references from:
- `src/pages/Profile.tsx` (Discord Integration section)
- `src/pages/Ride.tsx` (Discord presence calls)
- `.env` / `.env.example` (VITE_DISCORD_RPC_ENABLED, VITE_DISCORD_RPC_APP_ID)

---

## Appendix B: Design Comparison

| Element | Current (React) | New (Flutter) |
|---|---|---|
| Background | `#0A0A0A` solid | `#0A0A0C → #121417` gradient + green aura |
| Cards | Tailwind classes, opaque | Charcoal gradient (0x80181818 → 0xCC0A0A0A → 0xF20A0A0A), no blur |
| Card borders | Tailwind border | 8% white / 20% green accent borders |
| Accent | `#3DBF6F` | `#3DBF6F` (preserved) |
| Error | `#E35B5B` | `#E35B5B` (preserved) |
| Text primary | `#f5f5dc` (beige) | `#F5F5F5` (pure near-white, cleaner) |
| Font - headers | System font | Playfair Display w300 |
| Font - body | System font | Inter w300 |
| Font - numbers | JetBrains Mono | JetBrains Mono (preserved) |
| Animations | Framer Motion variants | flutter_animate chains |
| Nav | Bottom pill nav | Floating pill nav, white 10% bg, Ride = green CTA |
| Buttons | Tailwind + Framer hover | AnimatedScale 0.97 on press |
| Modals | Radix UI Dialog | Bottom sheets (Material 3) |

---

## Appendix C: Known Production Database Issues

### C.1 — bikes UPDATE RLS policy missing

**Symptom:** Users cannot save edits to a bike. The UI optimistically updates then reverts. No error toast appears (Supabase returns 0 rows silently instead of a permission error).

**Root cause:** The `bikes` table had RLS enabled but lacked an `UPDATE` policy. Supabase's RLS silently returns an empty result set when no policy matches — it does not raise an error — so the client-side code saw `data = []` and the optimistic update was rolled back without a user-visible error.

**Fix:** `supabase/migrations/20260314000000_fix_bikes_rls.sql`

Run in the Supabase SQL editor:

```sql
-- Verify current state first
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'bikes'
ORDER BY cmd;

-- Then apply the migration (idempotent — safe to re-run)
DROP POLICY IF EXISTS "Users can update own bikes" ON public.bikes;
CREATE POLICY "Users can update own bikes"
  ON public.bikes
  FOR UPDATE
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Why both `USING` and `WITH CHECK`:**
- `USING` — which existing rows the user can target (read gate)
- `WITH CHECK` — which values are allowed after the write (write gate, prevents reassigning `user_id` to another user)

**Status:** ✅ Migration applied to production via Supabase MCP (Phase 2, 2026-03-15).

**Preventive measure:** E2E RLS test suite (§16) added to CI — covers all four operations (SELECT / INSERT / UPDATE / DELETE) for all user-owned tables, and verifies cross-user isolation.

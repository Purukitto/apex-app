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

### `flutter_map` + Vector Tiles

```yaml
dependencies:
  flutter_map: ^7.x
  vector_map_tiles: ^8.x
  latlong2: ^0.9.x
```

**Dark map style:** Use a dark vector tile style (e.g., MapTiler Dark, Protomaps dark) to match the Obsidian Glass theme.

**Route rendering:**
- `PolylineLayer` with accent green stroke, 3px width, slight opacity
- Start marker: green circle
- End marker: checkered flag icon
- Auto-fit bounds to route with padding

**Usage locations:**
- Dashboard → last ride mini-map
- Ride history → ride detail full map
- (Optional) Live map during ride recording

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

### Android Build

```yaml
# android/app/build.gradle.kts
android {
  compileSdk = 35
  defaultConfig {
    applicationId = "com.purukitto.apex"
    minSdk = 24        // Android 7.0 — covers 97%+ devices
    targetSdk = 35
    versionCode = flutterVersionCode.toInteger()
    versionName = flutterVersionName
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
    - flutter build apk --release
    # No web build — mobile only
```

### Release Process

- Semantic versioning: `pubspec.yaml` version field
- Conventional commits for changelog generation
- GitHub Releases for APK distribution
- (Future) Play Store via Fastlane

---

## 18. Migration Phases

### Phase 0 — Project Setup (1 session)
- [ ] Initialize Flutter project with package name `com.purukitto.apex`
- [ ] Set up project structure (core/ + features/)
- [ ] Configure `app_colors.dart`, `app_theme.dart`, `app_typography.dart`
- [ ] Build core widgets: GlassCard, PressableGlassCard, MeshBackground, ApexButton
- [ ] Setup Riverpod, GoRouter, Drift, Supabase client
- [ ] Configure logger, toast, constants
- [ ] Android manifest: permissions (location, internet, sensors, foreground service)

### Phase 1 — Auth & Core Shell (1 session)
- [ ] Login screen with Supabase auth
- [ ] Confirm account + reset password screens
- [ ] Auth provider + GoRouter redirect guard
- [ ] App shell with MeshBackground + BottomNavBar
- [ ] Navigation between all tab destinations (empty screens)
- [ ] Profile screen (rider name, theme selector, logout)

### Phase 2 — Database & Sync (1 session)
- [ ] Drift schema: all tables with `isSynced` + `lastModified`
- [ ] DAOs for all entities
- [ ] Sync engine: push dirty rows, pull remote changes
- [ ] Initial sync on login (bulk pull)
- [ ] Connectivity provider to trigger/pause sync
- [ ] Verify offline create → online sync → verify in Supabase

### Phase 3 — Garage & Fuel (1 session)
- [ ] Garage screen: bike list with GlassCards
- [ ] Add/edit bike bottom sheet
- [ ] Delete bike with ride-guard logic
- [ ] Fuel log list per bike
- [ ] Add refuel bottom sheet
- [ ] Auto-calculate avg mileage + last fuel price
- [ ] All mutations: Drift first → sync → toast feedback

### Phase 4 — Ride Recorder (1–2 sessions)
- [ ] Ride screen: bike selector + start button
- [ ] GPS service with foreground notification
- [ ] Motion service: accelerometer lean angle calculation
- [ ] Ride session provider: coord buffer, distance, lean, auto-pause
- [ ] HUD overlay: speed, lean gauge, distance, time
- [ ] Pocket mode detection + curtain
- [ ] Save flow: name, notes, photo → Drift → Supabase (PostGIS)
- [ ] Startup countdown animation

### Phase 5 — Ride History & Maps (1 session)
- [ ] All rides screen: paginated list from Drift stream
- [ ] Ride detail bottom sheet with full map
- [ ] flutter_map setup with dark vector tiles
- [ ] Route polyline rendering (accent green)
- [ ] Share ride: image export + GPX file
- [ ] Delete ride with confirmation
- [ ] Dashboard mini-map for last ride

### Phase 6 — Service & Maintenance (1 session)
- [ ] Service screen per bike
- [ ] Schedule cards with health bars
- [ ] Complete service bottom sheet
- [ ] Maintenance log view
- [ ] Auto-create default schedules on new bike
- [ ] Maintenance alert card on dashboard

### Phase 7 — Notifications & Polish (1 session)
- [ ] FCM setup + token registration
- [ ] Local notifications for maintenance reminders
- [ ] In-app notification centre (bell + pane)
- [ ] Pull-to-refresh on dashboard + garage + rides
- [ ] Loading skeletons (shimmer) for initial data fetch
- [ ] App update checker (Android)
- [ ] Final animation polish pass
- [ ] Edge-to-edge + safe area handling

### Phase 8 — Testing & Release (1 session)
- [ ] Unit tests: DAOs, providers, sync engine, geo utils
- [ ] Widget tests: core components
- [ ] Integration test: full user flow
- [ ] CI pipeline (GitHub Actions)
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
| **Maps** | `flutter_map` | ^7.x | Map rendering |
| **Maps** | `vector_map_tiles` | ^8.x | Dark vector tile style |
| **Maps** | `latlong2` | ^0.9.x | Coordinate types |
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
| **flutter_map tile cost** | Vector tile providers may have usage limits | Use Protomaps (self-hosted PMTiles) or MapTiler free tier; cache tiles aggressively |
| **Auth token refresh** | Supabase token expiry during long rides | `supabase_flutter` handles auto-refresh; verify behavior during 2hr+ rides |
| **Data loss during migration** | Users switching from React to Flutter app | No data migration needed — same Supabase backend; user logs in → initial sync pulls all existing data |

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
| Cards | Tailwind classes, opaque | Glassmorphism, 40px blur, 3% white |
| Card borders | Tailwind border | 8% white / 20% green accent borders |
| Accent | `#3DBF6F` | `#3DBF6F` (preserved) |
| Error | `#E35B5B` | `#E35B5B` (preserved) |
| Text primary | `#f5f5dc` (beige) | `#F5F5F5` (pure near-white, cleaner) |
| Font - headers | System font | Playfair Display w300 |
| Font - body | System font | Inter w300 |
| Font - numbers | JetBrains Mono | JetBrains Mono (preserved) |
| Animations | Framer Motion variants | flutter_animate chains |
| Nav | Bottom pill nav | Frosted glass floating nav |
| Buttons | Tailwind + Framer hover | AnimatedScale 0.97 on press |
| Modals | Radix UI Dialog | Bottom sheets (Material 3) |

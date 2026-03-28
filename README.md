# Apex

A motorcycle companion app built with Flutter — track rides, manage your garage, log fuel, and stay on top of maintenance.

## Features

- **Ride Tracking** — GPS ride recording with foreground service, pocket detection, and route visualization
- **Garage** — manage multiple bikes with global bike search and image support
- **Fuel Logs** — track fill-ups with mileage calculation (km/l) and price history
- **Maintenance** — service scheduling with push notification alerts and health tracking
- **Offline-First** — local SQLite database (Drift) with Supabase cloud sync and conflict resolution
- **Dark Theme** — accent color customization with OLED black mode

## Getting Started

### Prerequisites

- Flutter SDK (stable channel, Dart ^3.11.0)
- Android Studio / Xcode
- Node.js 20+ (for commitlint & changelog tooling)

### Setup

1. **Clone & install dependencies**
   ```bash
   git clone https://github.com/Purukitto/apex-app.git
   cd apex-app
   flutter pub get
   npm install
   ```

2. **Create `.env`** from the template
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase project URL and anon key.

3. **Generate code** (envied + drift)
   ```bash
   dart run build_runner build --delete-conflicting-outputs
   ```

4. **Set up Firebase** (Android)
   ```bash
   export FIREBASE_PROJECT_NUMBER=...
   export FIREBASE_PROJECT_ID=...
   export FIREBASE_STORAGE_BUCKET=...
   export FIREBASE_MOBILESDK_APP_ID=...
   export FIREBASE_API_KEY=...
   dart run tool/inject_google_services.dart
   ```

5. **Run**
   ```bash
   # Development (no Firebase, .dev app ID)
   flutter run --flavor dev -t lib/main_dev.dart

   # Production
   flutter run --flavor prod -t lib/main.dart
   ```

## Build Flavours

| Flavour | App ID                    | App Name  | Entry Point          |
|---------|---------------------------|-----------|----------------------|
| `dev`   | `xyz.purukitto.apex.dev`  | Apex Dev  | `lib/main_dev.dart`  |
| `prod`  | `xyz.purukitto.apex`      | Apex      | `lib/main.dart`      |

Both can be installed side-by-side on the same device.

## Architecture

```
lib/
├── main.dart / main_dev.dart    # Entry points per flavour
├── app.dart                     # Root widget, GoRouter, auth state
├── core/
│   ├── config/                  # Environment config (envied)
│   ├── database/                # Drift tables & DAOs
│   ├── network/                 # Supabase client provider
│   ├── providers/               # Global Riverpod providers
│   ├── services/                # Firebase, notifications, updates
│   ├── sync/                    # Sync engine & conflict resolver
│   ├── theme/                   # Colors, typography, theme
│   ├── utils/                   # Formatters, geo, fuel calc
│   └── widgets/                 # Reusable UI components
└── features/
    ├── auth/                    # Login, confirm, reset password
    ├── dashboard/               # Home screen with stats
    ├── garage/                  # Bike management + fuel logs
    ├── notifications/           # Push & maintenance notifications
    ├── profile/                 # Settings, changelog, bug report
    ├── ride/                    # Active ride recording
    ├── rides/                   # Ride history & details
    └── service/                 # Maintenance scheduling
```

**State management:** Riverpod
**Routing:** GoRouter
**Database:** Drift (SQLite) with Supabase sync
**Auth:** Supabase Auth (email/password)

## Release Process

See [RELEASING.md](RELEASING.md) for the complete release guide.

Quick version:
```bash
# Bump version, update changelog, sync pubspec.yaml
npm run release          # auto-detect from commits
npm run release:patch    # force patch bump
npm run release:minor    # force minor bump

# Push with tags
git push --follow-tags origin main
```

The CI pipeline automatically builds a signed APK and creates a GitHub Release.

## Testing

```bash
flutter test                              # all tests
flutter test test/core/utils/             # unit tests only
flutter test test/core/widgets/           # widget tests only
```

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push & PR | `dart analyze` + `dart format` + `flutter test` |
| `commitlint.yml` | PR | Validates conventional commit messages |
| `release.yml` | Push to `main` | Builds signed APK, creates GitHub Release |

## Contributing

1. Create a feature branch from `main`
2. Use [conventional commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.)
3. Open a PR — CI will lint commits and run tests
4. After merge, the release workflow handles versioning automatically

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

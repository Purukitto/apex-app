# Release Guide

Everything is automated — you just need to run one command and push.

## Quick Release

```bash
# 1. Merge your PR first, then switch to main
git checkout main
git pull origin main

# 2. Bump version + generate changelog (auto-detects from commit types)
npm run release

# 3. Push — the CI release workflow fires automatically on the chore(release) commit
git push origin main
```

That's it. The GitHub Actions `release.yml` workflow will:
- Build a signed release APK (`--flavor prod`)
- Extract release notes from CHANGELOG.md
- Create a GitHub Release with the APK attached

> **Important:** Never run `npm run release` on a feature branch. The release
> workflow triggers on push to `main` when the HEAD commit is `chore(release): x.y.z`.
> Running it on a branch means the trigger fires before the PR is merged and will fail.

## Re-triggering a Failed Release

If the workflow didn't fire (e.g. the `chore(release)` commit was already on main
before the workflow fix), use the manual trigger:

GitHub → Actions → Release → **Run workflow** → enter the version number (e.g. `2.0.10`).

## Forcing a Version Bump

```bash
npm run release:patch    # 1.0.0 → 1.0.1
npm run release:minor    # 1.0.0 → 1.1.0
npm run release:major    # 1.0.0 → 2.0.0
```

## What `npm run release` Does

1. Reads commits since the last tag
2. Determines bump type from conventional commits (`feat:` = minor, `fix:` = patch)
3. Bumps version in both `package.json` and `pubspec.yaml` via `bumpFiles` in `.versionrc.json`
   - `package.json`: updated to `x.y.z` (standard JSON updater)
   - `pubspec.yaml`: updated to `x.y.z+1` via `tool/pubspec-updater.js` (custom updater)
4. Updates `CHANGELOG.md`
5. Creates a git commit (`chore(release): x.y.z`) and local tag (`vx.y.z`)

## GitHub Secrets Required

Set these in **Settings → Secrets and variables → Actions**:

### Supabase
| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Supabase publishable anon key |

### Firebase (one of the following)
| Secret | Description |
|--------|-------------|
| `GOOGLE_SERVICES_JSON` | Raw `google-services.json` content (preferred) |

Or, if not using `GOOGLE_SERVICES_JSON`, set individual vars:

| Secret | Description |
|--------|-------------|
| `FIREBASE_PROJECT_NUMBER` | Firebase project number |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `FIREBASE_MOBILESDK_APP_ID` | Android app ID |
| `FIREBASE_API_KEY` | Firebase API key |

### APK Signing
| Secret | Description |
|--------|-------------|
| `RELEASE_KEYSTORE` | Base64-encoded release keystore file |
| `RELEASE_KEYSTORE_PASSWORD` | Keystore password |
| `RELEASE_KEY_ALIAS` | Key alias in the keystore |
| `RELEASE_KEY_PASSWORD` | Key password |

### How to Base64-Encode the Keystore

```bash
base64 -w 0 release-keystore.jks | pbcopy   # macOS
base64 -w 0 release-keystore.jks | clip      # Windows (Git Bash)
```

Paste the output into the `RELEASE_KEYSTORE` secret.

## Local Development Build

```bash
# Dev flavour (no Firebase, installs as "Apex Dev")
flutter run --flavor dev -t lib/main_dev.dart

# Prod flavour
flutter run --flavor prod -t lib/main.dart

# Release APK (unsigned, debug keys)
flutter build apk --flavor prod -t lib/main.dart --release
```

## Pre-Release Checklist

1. All tests pass: `flutter test`
2. No analyzer issues: `dart analyze --fatal-infos`
3. Code formatted: `dart format .`
4. `.env` is NOT committed (check with `git status`)
5. `env.g.dart` is NOT committed
6. `google-services.json` is NOT committed
7. All GitHub secrets are configured (see table above)

## First-Time Setup

If you haven't set up the signing keystore yet:

```bash
# Generate a release keystore
keytool -genkey -v -keystore release-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias apex

# Base64 encode it and add to GitHub Secrets
base64 -w 0 release-keystore.jks
```

Then update `android/app/build.gradle.kts` to use the release signing config for production builds (the CI workflow handles this via apksigner).

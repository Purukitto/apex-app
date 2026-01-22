# Developer Documentation

This document contains all the technical information needed to set up, develop, and contribute to Apex.

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL + PostGIS)
- **Mobile**: Capacitor 8 (iOS & Android)
- **Routing**: React Router v7
- **Notifications**: Sonner
- **Icons**: Lucide React

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Supabase Account**: For backend services
- **For Mobile Development**:
  - **iOS**: Xcode 14+ (macOS only)
  - **Android**: Android Studio with Android SDK

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Purukitto/apex-app.git
cd apex-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Notifications (Server + Push):**

⚠️ **Important:** You must set up your own Firebase project. The placeholder values in the repo will not work.

1. Create a Firebase project at https://console.firebase.google.com/
2. Add a Web app and an Android app to your Firebase project
3. Copy the configuration values to your `.env` file:

```env
VITE_SERVER_NOTIFICATIONS=true
VITE_PUSH_NOTIFICATIONS=true
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_web_vapid_key
```

4. For Android builds, download `google-services.json` from Firebase Console and place it at `android/app/google-services.json`
   - Use `android/app/google-services.json.example` as a template
   - **Optional:** To keep your `google-services.json` private, uncomment line 65 in `android/.gitignore`

**Note:** The `firebase-messaging-sw.js` file is automatically generated from `firebase-messaging-sw.js.template` at build time using your `VITE_FIREBASE_*` environment variables. The generated file is gitignored to prevent committing your Firebase credentials.

**For Discord RPC (Android, Optional):**
- Users provide a Discord Gateway token locally in the Profile screen.
- No server-side OAuth or token storage is used.

### 4. Database Setup

Ensure your Supabase database has the following tables with PostGIS enabled:

- `bikes` - Motorcycle profiles
- `rides` - Ride records with GPS paths (PostGIS LineString)
- `maintenance_logs` - Service history

**Notifications Tables (Required):**
- `notifications` - Server-synced notification feed (read/dismiss state)
- `push_tokens` - Device tokens for FCM delivery
- `notification_delivery_queue` - Delivery queue processed by cron


### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📱 Mobile Development

### iOS Setup

1. Install iOS dependencies:
```bash
npx cap sync ios
```

2. Open in Xcode:
```bash
npx cap open ios
```

3. Build and run from Xcode

### Android Setup

1. Install Android dependencies:
```bash
npx cap sync android
```

2. Open in Android Studio:
```bash
npx cap open android
```

3. Build and run from Android Studio

### Building for Production

1. Build the web app:
```bash
npm run build
```

2. Sync with Capacitor:
```bash
npx cap sync
```

3. Build native apps in Xcode/Android Studio

## 📁 Project Structure

```
apex-app/
├── src/
│   ├── components/          # React components
│   │   ├── layout/         # Layout components (MainLayout, NotificationPane)
│   │   ├── BikeCard.tsx
│   │   ├── AddBikeModal.tsx
│   │   ├── MaintenanceLogList.tsx
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Garage.tsx
│   │   ├── Login.tsx
│   │   └── Profile.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useBikes.ts
│   │   ├── useRideRecorder.ts
│   │   ├── useMaintenanceLogs.ts
│   │   └── ...
│   ├── stores/             # Zustand stores
│   │   └── useNotificationStore.ts
│   ├── lib/                # Utilities
│   │   ├── supabaseClient.ts
│   │   ├── toast.ts
│   │   └── animations.ts
│   └── types/              # TypeScript types
│       └── database.ts
├── android/                # Android native project
├── ios/                    # iOS native project
├── public/                 # Static assets
└── capacitor.config.ts     # Capacitor configuration
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run release` - Create a new release (uses standard-version)
- `npm run release:patch` - Patch release
- `npm run release:minor` - Minor release
- `npm run release:major` - Major release

## 🔄 CI/CD

This project uses GitHub Actions for continuous integration:

### Workflows

- **CI** (`.github/workflows/ci.yml`): Runs on every push and PR
  - Linting with ESLint
  - Type checking with TypeScript
  - Production build verification

- **Commitlint** (`.github/workflows/commitlint.yml`): Validates commit messages
  - Ensures commits follow [Conventional Commits](https://www.conventionalcommits.org/) format
  - Runs on pull requests

- **Release** (`.github/workflows/release.yml`): Automated releases
  - Builds Android APK
  - Creates GitHub releases with changelog
  - Runs on pushes to main branch

### Local Hooks

The project uses Husky for git hooks:
- **Pre-commit**: Runs `npm run lint` before commits
- **Commit-msg**: Validates commit message format

### Issue & Pull Request Templates

GitHub automatically uses templates when creating issues or pull requests:
- **Issue templates** (`.github/ISSUE_TEMPLATE/`): Bug reports and feature requests
- **Pull request template** (`.github/pull_request_template.md`): Standardized PR format

No additional configuration needed - GitHub detects and uses these templates automatically.

### Dependabot

Automated dependency updates are configured via `.github/dependabot.yml`:
- Weekly checks for npm dependencies
- Grouped updates to reduce PR noise
- Major version updates require manual review for critical packages

## 🔒 Security

- Row Level Security (RLS) is enforced in Supabase
- All queries filter by `user_id` matching `auth.uid()`
- Environment variables are never committed to version control
- Authentication handled by Supabase Auth

## 🧪 Development Guidelines

### Code Standards

- TypeScript with strict type checking
- Functional components and hooks
- Centralized state with Zustand
- Data fetching with TanStack Query
- All mutations must show toast notifications

### Animation Standards

- Import animation variants from `src/lib/animations.ts`
- Use staggered animations for page content
- Apply `buttonHoverProps` to all buttons
- Apply `cardHoverProps` to all cards

See `.cursor/rules/` for detailed coding standards.

### Logging Standards

- **MANDATORY**: Always use `logger` from `src/lib/logger.ts` instead of `console.*` methods
- **NEVER** use `console.log`, `console.error`, `console.warn`, etc. directly
- All logs are captured in devtools console AND persisted to session files on native platforms

### Notification Standards

- **MANDATORY**: Always use `apexToast` utility from `src/lib/toast.ts` for all notifications
- **MANDATORY**: Every TanStack Query mutation MUST show a toast notification
- **MANDATORY**: Every form submission MUST show a toast notification
- Use `apexToast.promise()` for async operations
- Use `apexToast.success()` or `apexToast.error()` for synchronous operations

See `.cursor/rules/200-notifications.mdc` for detailed notification standards.

### UI/UX Standards

- Always use **Tailwind CSS**
- Backgrounds must be `bg-apex-black`
- Telemetry/Numbers must use `font-mono` (JetBrains Mono)
- Use `lucide-react` for all iconography
- Favor `framer-motion` for subtle, high-end transitions
- All pages must use staggered entry animations
- All cards must use gradient backgrounds and border hover effects

See `.cursor/rules/300-ux-polish.mdc` for detailed UI/UX standards.

## 🐛 Debugging & Logs

For detailed information on viewing and debugging logs, see [VIEW_LOGS.md](VIEW_LOGS.md).

### Quick Reference

- **DevTools Panel**: Use the in-app DevTools panel to view and export logs
- **Android Logcat**: Use `npm run log:android` or `npm run log:android:motion` for detailed logs
- **Log Export**: Native apps support sharing logs via system share dialog

## 📚 Additional Documentation

- **[README.md](README.md)** - User-focused documentation and overview
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and data flow
- **[DOCS.md](DOCS.md)** - Design philosophy, core pillars, and Discord integration details
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guidelines for contributing
- **[VIEW_LOGS.md](VIEW_LOGS.md)** - Debugging and log viewing guide

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on contributing to this project.

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

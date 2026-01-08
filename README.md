# Apex: The Rider's Black Box

A minimalist, high-precision utility for motorcyclists. Apex is a "Flight Recorder" for the road and a "Digital Garage" for the machine.

## 🎯 Vision

Apex combines real-time ride tracking with comprehensive maintenance management, designed with the philosophy of "The Dark Cockpit" - optimized for OLED displays, high contrast, and instrument-grade precision.

## ✨ Features

### The Garage
- **Multi-bike Management**: Track multiple motorcycles in your fleet
- **Maintenance Logs**: Record service history, track service intervals
- **Service Reminders**: Automatic notifications when maintenance is due
- **Odometer Tracking**: Monitor mileage for each bike

### The Recorder
- **GPS Tracking**: Real-time route recording with PostGIS LineString storage
- **Telemetry**: Speed, lean angle, G-force, and altitude tracking
- **Ride History**: View past rides with detailed statistics

### The Dashboard
- **Current Status**: Overview of all bikes and their maintenance status
- **Last Ride Summary**: Quick access to recent ride data
- **Maintenance Alerts**: Warnings for upcoming service intervals

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
git clone <repository-url>
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

You can find these values in your Supabase project settings under API.

### 4. Database Setup

Ensure your Supabase database has the following tables with PostGIS enabled:

- `bikes` - Motorcycle profiles
- `rides` - Ride records with GPS paths (PostGIS LineString)
- `maintenance_logs` - Service history

See `ARCHITECTURE.md` for detailed schema information.

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

## 🎨 Design Philosophy

### The Dark Cockpit
- **OLED First**: Pure black backgrounds (`#0A0A0A`) to save battery and reduce glare
- **High Contrast**: White and Apex Green (`#00FF41`) for critical data
- **Instrument Grade**: Monospaced fonts (JetBrains Mono) for telemetry
- **Glove-Friendly**: Large touch targets, long-press for destructive actions

### UX Standards
- All pages use staggered entry animations (Framer Motion)
- Consistent card styling with gradient backgrounds and border hover effects
- Toast notifications for all mutations and form submissions
- Persistent notifications for maintenance warnings
- Pull-to-refresh on mobile for data feeds

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

## 📚 Documentation

- `ARCHITECTURE.md` - System architecture and data flow
- `DOCS.md` - Design philosophy and core pillars
- `CHANGELOG.md` - Version history

## 🤝 Contributing

See `CONTRIBUTING.md` for guidelines on contributing to this project.

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

Built with modern web technologies and designed for riders who demand precision and simplicity.

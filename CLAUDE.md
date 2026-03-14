# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # TypeScript check + production build
npm run lint         # ESLint validation
npm run preview      # Preview production build

# Mobile development
npm run cap:build    # Sync Capacitor dependencies
npm run dev:android  # Live-reload Android development

# Releases (uses standard-version + conventional commits)
npm run release:patch / release:minor / release:major
```

Pre-build scripts auto-inject Firebase config: `scripts/inject-firebase-sw.js` and `scripts/inject-google-services.js` run before `dev` and `build`.

## Architecture

**Stack**: React 19 + TypeScript + Vite (SWC) + TailwindCSS 4 + Supabase + Capacitor 8

**State split**:
- Zustand stores (`src/stores/`) — local/device state: ride recording, notifications, theme, Discord RPC
- TanStack Query (`src/hooks/`) — all server state: bikes, rides, maintenance, fuel logs (5-min stale time, optimistic updates with rollback)

**Data flow for rides**: Capacitor Geolocation/Motion → `useRideStore` (Zustand buffer) → Supabase with PostGIS GEOGRAPHY(LINESTRING, 4326) on save.

**Mobile vs. web**: Platform-gated features use `Capacitor.isNativePlatform()`. The Recorder page shows a QR code on web — never initialize GPS/Motion listeners on web.

**Database RLS notes** (from `src/types/database.ts`):
- `bikes` and `rides` have `user_id` — always filter by `auth.uid()`
- `maintenance_logs` and `fuel_logs` have **no** `user_id` — RLS enforces ownership via join through `bikes`

## Mandatory Conventions

**Always use these wrappers — never the underlying library directly:**
- Logging: `logger` from `src/lib/logger.ts` (methods: trace/debug/info/warn/error). Never `console.*`.
- Toasts: `apexToast` from `src/lib/toast.ts`. Never import `sonner` directly.
- Animations: variants from `src/lib/animations.ts` (containerVariants, itemVariants, buttonHoverProps, cardHoverProps). All pages use staggered entry; all buttons use `{...buttonHoverProps}`.

**Every TanStack Query mutation and form submission must show a toast.** Use `apexToast.promise()` for async ops.

**Confirmation dialogs**: Use `ConfirmModal` component — never `window.confirm()`.

**Deletion**: Block bike deletion if rides exist. Warn (but allow) deletion of bikes with maintenance/fuel logs.

## UI System

- Background: `bg-apex-black` (#0A0A0A), Text: `text-apex-white` (#f5f5dc)
- Accent green: `text-apex-green` (#3DBF6F), Error red: `text-apex-red` (#E35B5B)
- Numbers/telemetry: JetBrains Mono font
- Icons: Lucide React only
- Cards: always use `src/components/ui/Card.tsx`, not inline styling

## Commits & CI

Conventional commits enforced by commitlint + Husky:
```
feat(garage): add bike deletion confirmation
fix(rides): correct lean angle rounding
```
Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

CI runs ESLint + TypeScript check + build on every push/PR.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { isSupabaseConfigured } from './lib/supabaseClient.ts'
import { initializeTheme } from './lib/theme.ts'
import { initializeVersion } from './lib/version.ts'
// Initialize logger early to ensure all logs are captured
import { logger } from './lib/logger.ts'

// Configure StatusBar for native platforms (visible with dark style)
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: true })
  StatusBar.setStyle({ style: Style.Dark })
}

// Check Supabase configuration and log warning if missing
if (!isSupabaseConfigured()) {
  logger.error('⚠️ Supabase environment variables are missing! The app may not work correctly.');
}

// Initialize logger session
logger.info('Apex app initializing', {
  platform: Capacitor.getPlatform(),
  isNative: Capacitor.isNativePlatform(),
  sessionId: logger.getSessionId(),
});

// Initialize version system (caches version in localStorage)
initializeVersion();

// Initialize theme system
initializeTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)

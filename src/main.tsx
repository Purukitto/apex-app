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

// Configure StatusBar for fullscreen on native platforms
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: true })
  StatusBar.setStyle({ style: Style.Dark })
  StatusBar.hide()
}

// Check Supabase configuration and log warning if missing
if (!isSupabaseConfigured()) {
  console.error('⚠️ Supabase environment variables are missing! The app may not work correctly.');
}

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

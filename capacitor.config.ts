import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apex.app',
  appName: 'Apex',
  webDir: 'dist',
  android: {
    // Adjust margins for edge-to-edge support (Android 15+)
    adjustMarginsForEdgeToEdge: 'force',
  },
  plugins: {
    Keyboard: {
      // Prevent full-screen resize issues on Android 15+
      resizeOnFullScreen: false,
      // Use native keyboard behavior
      style: 'dark',
    },
  },
};

export default config;

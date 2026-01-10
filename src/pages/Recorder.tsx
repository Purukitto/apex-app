import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '../lib/animations';
import QRCode from 'react-qr-code';

/**
 * Web Fallback Component for Recorder
 * Full-screen, non-scrollable landing page for web platforms
 */
const WebFallback = () => {
  const downloadUrl = 'https://github.com/Purukitto/apex-app/releases/latest';
  
  // Calculate initial QR code size
  const calculateQRSize = () => {
    if (typeof window === 'undefined') return 256;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // Use 60% of viewport width, but cap at 40% of viewport height and max 320px
    const maxSize = Math.min(
      viewportWidth * 0.6,
      viewportHeight * 0.4,
      320
    );
    return Math.max(200, maxSize); // Minimum 200px
  };

  const [qrSize, setQrSize] = useState(calculateQRSize);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setQrSize(calculateQRSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-apex-black flex flex-col items-center justify-center p-4 md:p-6">
      <motion.div
        className="flex flex-col items-center justify-center space-y-6 md:space-y-8 w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section - Glowing Apex Logo */}
        <motion.div
          className="flex flex-col items-center space-y-3 md:space-y-4"
          variants={itemVariants}
        >
          {/* Glowing Apex Logo/Text */}
          <motion.div
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-apex-green font-sans tracking-tight"
            style={{
              textShadow: '0 0 20px rgba(0, 255, 65, 0.5), 0 0 40px rgba(0, 255, 65, 0.3)',
            }}
            variants={itemVariants}
          >
            APEX
          </motion.div>
          
          <motion.h1
            className="text-xl sm:text-2xl md:text-3xl font-bold text-apex-white text-center px-4"
            variants={itemVariants}
          >
            Recorder is Mobile Only
          </motion.h1>
        </motion.div>

        {/* QR Code Section */}
        <motion.div
          className="flex flex-col items-center space-y-3 md:space-y-4 w-full px-4"
          variants={itemVariants}
        >
          <div className="bg-apex-white p-3 md:p-4 rounded-lg">
            <QRCode
              value={downloadUrl}
              size={qrSize}
              level="M"
              bgColor="#0A0A0A"
              fgColor="#00FF41"
            />
          </div>
          
          <p className="text-xs sm:text-sm md:text-base text-apex-white/80 text-center font-medium max-w-sm">
            Scan to download the latest Flight Recorder (APK)
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

/**
 * Main Recorder Component
 * Shows web fallback on non-native platforms
 */
export default function Recorder() {
  const isNative = Capacitor.isNativePlatform();

  // Show web fallback for non-native platforms
  if (!isNative) {
    return <WebFallback />;
  }

  // For native platforms, you can add the actual recorder interface here
  // For now, return a placeholder
  return (
    <div className="min-h-screen bg-apex-black flex items-center justify-center p-6">
      <p className="text-apex-white/60">Recorder interface coming soon...</p>
    </div>
  );
}

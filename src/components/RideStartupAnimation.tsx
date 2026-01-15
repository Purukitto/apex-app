import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApexTelemetryIcon from './ui/ApexTelemetryIcon';

interface RideStartupAnimationProps {
  onComplete: () => void;
}

/**
 * Bike Instrumentation Cluster Startup Animation
 * Mimics the startup sequence of a motorcycle's digital instrument cluster
 */
export function RideStartupAnimation({ onComplete }: RideStartupAnimationProps) {
  const [phase, setPhase] = useState<'boot' | 'gauges' | 'ready'>('boot');
  const [gaugeProgress, setGaugeProgress] = useState(0);

  useEffect(() => {
    // Phase 1: Boot sequence (0.8s)
    const bootTimer = setTimeout(() => {
      setPhase('gauges');
    }, 800);

    // Phase 2: Gauge sweep animation (1.2s)
    if (phase === 'gauges') {
      const startTime = Date.now();
      const duration = 1200;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setGaugeProgress(progress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setPhase('ready');
        }
      };
      
      requestAnimationFrame(animate);
    }

    // Phase 3: Ready state (0.5s delay before completing)
    if (phase === 'ready') {
      const readyTimer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(readyTimer);
    }

    return () => clearTimeout(bootTimer);
  }, [phase, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-apex-black z-[100] flex flex-col items-center justify-center"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Boot Phase - Logo with pulse */}
        {phase === 'boot' && (
          <motion.div
            className="flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <ApexTelemetryIcon size={120} static />
            </motion.div>
            <motion.p
              className="mt-6 text-apex-white/40 font-mono text-sm tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              INITIALIZING...
            </motion.p>
          </motion.div>
        )}

        {/* Gauge Sweep Phase */}
        {phase === 'gauges' && (
          <motion.div
            className="flex flex-col items-center justify-center w-full max-w-md px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Speedometer Sweep */}
            <div className="relative w-64 h-64 mb-8">
              {/* Outer Ring */}
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 200 200"
              >
                {/* Background arc */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="rgba(226, 226, 226, 0.1)"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 90}`}
                />
                {/* Animated sweep arc */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#00FF41"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={2 * Math.PI * 90 * (1 - gaugeProgress)}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - gaugeProgress) }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                />
              </svg>
              
              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  className="text-5xl font-mono font-bold text-apex-green"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: gaugeProgress > 0.5 ? 1 : 0,
                    scale: gaugeProgress > 0.5 ? 1 : 0.5
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {Math.round(gaugeProgress * 100)}
                </motion.div>
                <motion.p
                  className="text-xs text-apex-white/40 mt-2 font-mono uppercase tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: gaugeProgress > 0.7 ? 1 : 0 }}
                  transition={{ delay: 0.2 }}
                >
                  km/h
                </motion.p>
              </div>
            </div>

            {/* Status Text */}
            <motion.p
              className="text-apex-green font-mono text-sm tracking-wider uppercase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: gaugeProgress > 0.8 ? 1 : 0,
                y: gaugeProgress > 0.8 ? 0 : 10
              }}
              transition={{ duration: 0.3 }}
            >
              SYSTEMS ONLINE
            </motion.p>
          </motion.div>
        )}

        {/* Ready Phase */}
        {phase === 'ready' && (
          <motion.div
            className="flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
              }}
            >
              <ApexTelemetryIcon size={80} static />
            </motion.div>
            <motion.p
              className="mt-4 text-apex-green font-mono text-lg tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              READY TO RIDE
            </motion.p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

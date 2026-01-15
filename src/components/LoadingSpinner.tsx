import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * LoadingSpinner - Themed loading component with shimmer effect
 * Follows Apex UX standards with shimmer animation
 */
export default function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} relative`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-full h-full text-apex-green" strokeWidth={2.5} />
      </motion.div>
      {text && (
        <motion.p
          className="text-apex-white/60 font-mono text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-apex-black flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * LoadingSkeleton - Shimmer effect skeleton loader for data fetching
 * Use for list items, cards, etc.
 */
export function LoadingSkeleton({
  className = '',
  count = 1,
}: {
  className?: string;
  count?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-lg p-4 ${className}`}
        >
          <div className="space-y-3">
            <div className="h-4 bg-apex-white/10 rounded animate-shimmer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-apex-white/20 to-transparent translate-x-[-100%] animate-shimmer" />
            </div>
            <div className="h-3 bg-apex-white/10 rounded w-3/4 animate-shimmer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-apex-white/20 to-transparent translate-x-[-100%] animate-shimmer" />
            </div>
            <div className="h-3 bg-apex-white/10 rounded w-1/2 animate-shimmer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-apex-white/20 to-transparent translate-x-[-100%] animate-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

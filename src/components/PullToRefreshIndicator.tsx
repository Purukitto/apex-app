import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  accentColor: string;
}

export default function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  accentColor,
}: PullToRefreshIndicatorProps) {
  if (pullDistance <= 0 && !isRefreshing) {
    return null;
  }

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-70 flex items-center justify-center pb-2 pointer-events-none"
      style={{
        paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))`,
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: isRefreshing ? 1 : Math.min(pullDistance / 80, 1),
        y: isRefreshing ? 0 : Math.min(pullDistance * 0.5, 60),
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-apex-black/90 backdrop-blur-sm border border-apex-white/20 rounded-full px-4 py-2 flex items-center gap-2">
        <RefreshCw
          size={16}
          className={`transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: isRefreshing ? 'none' : `rotate(${pullDistance * 4}deg)`,
            color: pullDistance >= 80 || isRefreshing ? accentColor : 'currentColor',
          }}
        />
        <span className="text-xs text-apex-white">
          {isRefreshing
            ? 'Refreshing...'
            : pullDistance >= 80
              ? 'Release to refresh'
              : 'Pull to refresh'}
        </span>
      </div>
    </motion.div>
  );
}

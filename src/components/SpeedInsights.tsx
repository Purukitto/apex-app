import { useEffect } from 'react';
import { injectSpeedInsights } from '@vercel/speed-insights';

/**
 * SpeedInsights component for integrating Vercel Speed Insights
 * This component injects the Speed Insights tracking script on mount
 */
export function SpeedInsights() {
  useEffect(() => {
    // Inject the Speed Insights script
    injectSpeedInsights();
  }, []);

  // This component doesn't render anything, it's just for side effects
  return null;
}

export default SpeedInsights;

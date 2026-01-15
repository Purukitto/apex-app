import { isDev } from '../lib/devtools';

interface DebugPanelProps {
  /**
   * Title/label for the debug panel (shown in summary)
   */
  title: string;
  /**
   * Data to display in the debug panel (will be JSON stringified)
   */
  data: unknown;
  /**
   * Optional className for the wrapper element
   */
  className?: string;
  /**
   * Optional max height for the pre element (default: 'max-h-32')
   */
  maxHeight?: string;
}

/**
 * DebugPanel - Reusable component for displaying debug information in development mode
 * 
 * Features:
 * - Only renders in development mode (using isDev())
 * - Collapsible details/summary element
 * - JSON formatted data display
 * - Consistent styling with Apex theme
 * 
 * Usage:
 * ```tsx
 * <DebugPanel title="route_path" data={ride.route_path} />
 * ```
 */
export default function DebugPanel({ 
  title, 
  data, 
  className = '', 
  maxHeight = 'max-h-32' 
}: DebugPanelProps) {
  if (!isDev()) return null;

  return (
    <details className={`mb-2 text-xs text-white/40 ${className}`}>
      <summary className="cursor-pointer hover:text-white/60 transition-colors">
        Debug: {title}
      </summary>
      <pre className={`mt-1 p-2 bg-apex-black/50 rounded text-xs overflow-auto ${maxHeight} font-mono text-apex-white/80`}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

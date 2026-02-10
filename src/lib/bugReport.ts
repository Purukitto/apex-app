import { Capacitor } from '@capacitor/core';
import { logger } from './logger';
import { getAppVersion } from './version';
import { supabase } from './supabaseClient';

const getOsLabel = (userAgent: string): string => {
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac os x/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  return 'Unknown';
};

const getEnvironmentInfo = () => {
  const platform = Capacitor.getPlatform();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  const device = typeof navigator !== 'undefined' ? (navigator.platform || 'Unknown') : 'Unknown';
  const os = getOsLabel(userAgent);
  const screenInfo = typeof window !== 'undefined'
    ? `${window.screen.width}x${window.screen.height} @${window.devicePixelRatio}x`
    : 'Unknown';

  return {
    platform,
    os,
    device,
    screen: screenInfo,
    appVersion: getAppVersion(),
    userAgent,
  };
};

interface BugReportBodyOptions {
  description: string;
  stepsToReproduce?: string;
  logsText: string;
}

const buildBugReportBody = (options: BugReportBodyOptions) => {
  const env = getEnvironmentInfo();
  const logsSection = `## Logs (Last 150 lines)\n\n\`\`\`\n${options.logsText}\n\`\`\`\n`;

  const stepsSection = options.stepsToReproduce?.trim()
    ? options.stepsToReproduce.trim()
    : '_(No steps provided)_';

  return `## Bug Description

${options.description}

## Steps to Reproduce

${stepsSection}

## Environment

- **Platform**: ${env.platform}
- **OS**: ${env.os}
- **Device**: ${env.device}
- **Screen**: ${env.screen}
- **App Version**: ${env.appVersion}
- **User Agent**: ${env.userAgent}

${logsSection}
`;
};

export interface BugReportPayload {
  title: string;
  description: string;
  stepsToReproduce?: string;
}

export interface BugReportResult {
  issueUrl: string;
  issueNumber: number;
}

/**
 * Submits a bug report via the Supabase Edge Function,
 * which creates a GitHub issue server-side.
 */
export const submitBugReport = async (payload: BugReportPayload): Promise<BugReportResult> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured');
  }

  const logsText = logger.getRecentLogsText().trim() || 'No logs available.';
  const body = buildBugReportBody({
    description: payload.description,
    stepsToReproduce: payload.stepsToReproduce,
    logsText,
  });

  const title = payload.title.trim().startsWith('[BUG]')
    ? payload.title.trim()
    : `[BUG] ${payload.title.trim()}`;

  // Match fetch-bike-image: this project's Edge Functions accept user JWT only, not anon key
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Please sign in to submit a bug report');
  }

  const functionUrl = `${supabaseUrl}/functions/v1/create-bug-report`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({ title, body }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    logger.error('Bug report submission failed:', { status: response.status, error: errorData });
    throw new Error(errorData.error || 'Failed to submit bug report');
  }

  const result = await response.json();
  return result as BugReportResult;
};

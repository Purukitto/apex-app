import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { logger } from './logger';
import { getAppVersion } from './version';

const BUG_REPORT_URL = 'https://github.com/Purukitto/apex-app/issues/new';
const BUG_REPORT_TEMPLATE = 'bug_report.md';

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

const buildBugReportBody = (options: { logsText: string; includeLogsInline: boolean }) => {
  const env = getEnvironmentInfo();
  const logsSection = options.includeLogsInline
    ? `## 🧾 Logs (Last 150 lines)\n\n\`\`\`\n${options.logsText}\n\`\`\`\n`
    : '## 🧾 Logs (Last 150 lines)\n\nAttach the shared log file from the app.\n';

  return `## 🐛 Bug Description

A clear and concise description of what the bug is.

## 🔄 Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## ✅ Expected Behavior

A clear and concise description of what you expected to happen.

## ❌ Actual Behavior

A clear and concise description of what actually happened.

## 📸 Screenshots

If applicable, add screenshots to help explain your problem.

## 🌍 Environment

- **Platform**: ${env.platform}
- **OS**: ${env.os}
- **Device**: ${env.device}
- **Screen**: ${env.screen}
- **App Version**: ${env.appVersion}
- **User Agent**: ${env.userAgent}

${logsSection}
## 📝 Additional Context

Add any other context about the problem here.

## 🔍 Possible Solution

If you have ideas on how to fix this, please share them here.
`;
};

export const createBugReportPayload = (options: { includeLogsInline: boolean }) => {
  const logsText = logger.getRecentLogsText().trim() || 'No logs available.';
  const body = buildBugReportBody({ logsText, includeLogsInline: options.includeLogsInline });
  const params = new URLSearchParams({
    template: BUG_REPORT_TEMPLATE,
    title: '[BUG] ',
    body,
  });
  return {
    issueUrl: `${BUG_REPORT_URL}?${params.toString()}`,
    logsText,
  };
};

export const openBugReportIssue = async (issueUrl: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: issueUrl, windowName: '_blank' });
    return;
  }

  if (typeof window !== 'undefined') {
    window.open(issueUrl, '_blank', 'noopener,noreferrer');
  }
};

export const shareBugReportLogs = async (logsText: string, issueUrl: string): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const shareFileName = `apex-logs-bug-report-${Date.now()}.txt`;
    const base64Data = btoa(unescape(encodeURIComponent(logsText)));

    await Filesystem.writeFile({
      path: shareFileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    const fileUri = await Filesystem.getUri({
      path: shareFileName,
      directory: Directory.Cache,
    });

    await Share.share({
      title: 'Apex Bug Report Logs',
      text: `Attach this log file to your bug report.\n${issueUrl}`,
      url: fileUri.uri,
      dialogTitle: 'Share Logs',
    });

    Filesystem.deleteFile({
      path: shareFileName,
      directory: Directory.Cache,
    }).catch((error) => {
      logger.warn('Failed to delete bug report log file:', error);
    });
  } catch (error) {
    logger.error('Failed to share bug report logs:', error);
    throw error;
  }
};

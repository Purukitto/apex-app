import { Capacitor } from '@capacitor/core';
import { InAppBrowser, BackgroundColor, ToolBarType } from '@capgo/inappbrowser';
import { logger } from './logger';

const DISCORD_LOGIN_URL = 'https://discord.com/login';

/**
 * Mirrors AnymeX discord_login.dart (https://github.com/RyanYuuki/AnymeX/blob/0eb1433ece02ad8adc191569d913f694cddb87a3/lib/controllers/discord/discord_login.dart):
 * - onLoadStart: window.LOCAL_STORAGE = localStorage (alias before Discord can overwrite)
 * - on /login: clear LOCAL_STORAGE + sessionStorage
 * - when URL != /login: wait 2s, getItem('token'), postMessage
 * We use one script; executeScript returns void so we postMessage instead of return.
 */
const SCRIPT = `
(function() {
  try { window.LOCAL_STORAGE = window.LOCAL_STORAGE || localStorage; } catch (e) {}
  var u = (window.location && window.location.href) || '';
  if (!u || u === 'about:blank') return;
  if (u.indexOf('discord.com/login') !== -1) {
    try { (window.LOCAL_STORAGE || localStorage).clear(); sessionStorage.clear(); } catch (e) {}
    return;
  }
  setTimeout(function() {
    try {
      var t = (window.LOCAL_STORAGE || localStorage).getItem('token');
      if (t && t !== 'null' && window.mobileApp && window.mobileApp.postMessage)
        window.mobileApp.postMessage({ detail: { token: t } });
    } catch (e) {}
  }, 2000);
})();
`;

export function isDiscordLoginSupported(): boolean {
  return Capacitor.isNativePlatform();
}

export async function openDiscordLogin(opts: {
  onTokenExtracted: (token: string) => void;
  onClose?: () => void;
}): Promise<void> {
  if (!isDiscordLoginSupported()) {
    logger.warn('Discord login is not supported on this platform');
    return;
  }

  let tokenExtracted = false;

  const cleanup = () => InAppBrowser.removeAllListeners().catch(() => {});

  const run = () => {
    InAppBrowser.executeScript({ code: SCRIPT }).catch((e) =>
      logger.error('Discord login script error:', e)
    );
  };

  await InAppBrowser.addListener('urlChangeEvent', (evt) => {
    if (!evt?.url || evt.url === 'about:blank') return;
    run();
  });

  await InAppBrowser.addListener('browserPageLoaded', run);

  await InAppBrowser.addListener('messageFromWebview', (evt) => {
    const token = evt?.detail?.token;
    if (token == null) return;
    const t = String(token).replace(/"/g, '').trim();
    if (!t || t === 'null') return;
    tokenExtracted = true;
    cleanup();
    opts.onTokenExtracted(t);
    InAppBrowser.close().catch((e) => logger.error('Discord login close error:', e));
  });

  await InAppBrowser.addListener('closeEvent', () => {
    cleanup();
    if (!tokenExtracted) opts.onClose?.();
  });

  await InAppBrowser.openWebView({
    url: DISCORD_LOGIN_URL,
    title: 'Login to Discord',
    toolbarType: ToolBarType.COMPACT,
    backgroundColor: BackgroundColor.BLACK,
    toolbarColor: '#1e1f22',
    toolbarTextColor: '#b5bac1',
    visibleTitle: true,
  });
}

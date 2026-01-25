import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { logger } from '../lib/logger';
import { useDiscordRpcStore } from '../stores/useDiscordRpcStore';
import { DISCORD_RPC_APP_ID, isDiscordRpcEnabledForPlatform } from '../config/discord';
import { apexToast } from '../lib/toast';
import { isDiscordLoginSupported, openDiscordLogin } from '../lib/discordLogin';
import { validateDiscordToken } from '../lib/discordAuth';
import {
  clearDiscordPresence,
  connectDiscordRpc,
  disconnectDiscordRpc,
  updateDiscordPresence,
} from '../lib/discordRpc';

/**
 * Hook for managing Discord RPC updates
 */
export function useDiscord() {
  const platform = Capacitor.getPlatform();
  const rpcToken = useDiscordRpcStore((state) => state.rpcToken);
  const setRpcToken = useDiscordRpcStore((state) => state.setRpcToken);
  const invalidTokenNotifiedRef = useRef(false);

  useEffect(() => {
    if (rpcToken) {
      invalidTokenNotifiedRef.current = false;
    }
  }, [rpcToken]);

  useEffect(() => {
    if (!isDiscordRpcEnabledForPlatform(platform)) {
      return;
    }

    let isMounted = true;
    let appStateHandle: Awaited<ReturnType<typeof App.addListener>> | null = null;
    let pauseHandle: Awaited<ReturnType<typeof App.addListener>> | null = null;

    const clearAndDisconnect = async (reason: string) => {
      try {
        logger.debug(`Discord RPC cleanup triggered (${reason})`);
        await clearDiscordPresence();
        await disconnectDiscordRpc();
      } catch (error) {
        logger.error('Discord RPC cleanup failed:', error);
      }
    };

    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        void clearAndDisconnect('appStateChange');
      }
    }).then((handle) => {
      if (isMounted) {
        appStateHandle = handle;
      } else {
        handle.remove();
      }
    });

    App.addListener('pause', () => {
      void clearAndDisconnect('pause');
    }).then((handle) => {
      if (isMounted) {
        pauseHandle = handle;
      } else {
        handle.remove();
      }
    });

    return () => {
      isMounted = false;
      if (appStateHandle) {
        appStateHandle.remove();
      }
      if (pauseHandle) {
        pauseHandle.remove();
      }
    };
  }, [platform]);

  const notifyInvalidToken = () => {
    if (invalidTokenNotifiedRef.current) return;
    invalidTokenNotifiedRef.current = true;
    setRpcToken('');
    apexToast.error('Discord login expired', {
      action: {
        label: 'Reconnect',
        onClick: () => {
          if (!isDiscordLoginSupported()) return;
          openDiscordLogin({
            onTokenExtracted: (token) => {
              setRpcToken(token);
              apexToast.success('Connected');
            },
          });
        },
      },
    });
  };

  const buildPresenceDetails = ({
    type,
    bikeName,
    city,
    shareRideStatus,
    shareBikeName,
    shareCity,
  }: {
    type: 'start' | 'end';
    bikeName?: string;
    city?: string;
    shareRideStatus: boolean;
    shareBikeName: boolean;
    shareCity: boolean;
  }) => {
    if (type === 'end') return { details: undefined, state: undefined };
    // Single line: "Riding", "Riding My Daily", "Riding in Pune City", "Riding My Daily in Pune City"
    if (!shareRideStatus) return { details: undefined, state: undefined };
    const parts: string[] = ['Riding'];
    if (shareBikeName && bikeName) parts.push(bikeName);
    if (shareCity && city) parts.push(`in ${city}`);
    const details = parts.length > 1 ? parts.join(' ') : parts[0];
    return { details, state: undefined };
  };

  // Update Discord presence (for ride start/end)
  const updatePresence = useMutation({
    mutationFn: async ({
      type,
      bikeName,
      city,
    }: {
      type: 'start' | 'end';
      bikeName?: string;
      city?: string;
    }): Promise<void> => {
      if (!isDiscordRpcEnabledForPlatform(platform)) {
        logger.debug('Discord RPC not supported on this platform');
        return;
      }

      const preferences = useDiscordRpcStore.getState();
      if (!preferences.enabled && type !== 'end') {
        logger.debug('Discord RPC disabled by user');
        return;
      }

      if (type === 'end') {
        await clearDiscordPresence();
        await disconnectDiscordRpc();
        return;
      }

      if (!preferences.rpcToken) {
        logger.debug('Discord RPC token unavailable, skipping RPC update');
        return;
      }

      const tokenStatus = await validateDiscordToken(preferences.rpcToken);
      if (tokenStatus === 'invalid') {
        await clearDiscordPresence();
        await disconnectDiscordRpc();
        notifyInvalidToken();
        return;
      }

      const { details, state } = buildPresenceDetails({
        type,
        bikeName,
        city,
        shareRideStatus: preferences.shareRideStatus,
        shareBikeName: preferences.shareBikeName,
        shareCity: preferences.shareCity,
      });

      if (!details && !state) {
        logger.debug('Discord RPC has no details to share');
        return;
      }

      await connectDiscordRpc(preferences.rpcToken);
      await updateDiscordPresence(details, state, DISCORD_RPC_APP_ID);
    },
    onError: (error: Error) => {
      // Don't show toast for presence updates - they're background operations
      logger.error('Failed to update Discord presence:', error);
    },
  });

  return {
    updatePresence,
  };
}

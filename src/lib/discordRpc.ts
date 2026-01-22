import { Capacitor, registerPlugin } from '@capacitor/core';
import { logger } from './logger';

interface DiscordRpcPlugin {
  connect(options: { token: string }): Promise<void>;
  updatePresence(options: { details?: string; state?: string }): Promise<void>;
  clearPresence(): Promise<void>;
  disconnect(): Promise<void>;
}

const DiscordRpc = registerPlugin<DiscordRpcPlugin>('DiscordRpc', {
  web: {
    connect: async () => undefined,
    updatePresence: async () => undefined,
    clearPresence: async () => undefined,
    disconnect: async () => undefined,
  },
});

export const isDiscordRpcSupported = () => Capacitor.getPlatform() === 'android';

export const connectDiscordRpc = async (token: string) => {
  if (!isDiscordRpcSupported()) {
    return;
  }
  try {
    await DiscordRpc.connect({ token });
  } catch (error) {
    logger.error('Discord RPC connect failed:', error);
  }
};

export const updateDiscordPresence = async (details?: string, state?: string) => {
  if (!isDiscordRpcSupported()) {
    return;
  }
  try {
    await DiscordRpc.updatePresence({ details, state });
  } catch (error) {
    logger.error('Discord RPC update failed:', error);
  }
};

export const clearDiscordPresence = async () => {
  if (!isDiscordRpcSupported()) {
    return;
  }
  try {
    await DiscordRpc.clearPresence();
  } catch (error) {
    logger.error('Discord RPC clear failed:', error);
  }
};

export const disconnectDiscordRpc = async () => {
  if (!isDiscordRpcSupported()) {
    return;
  }
  try {
    await DiscordRpc.disconnect();
  } catch (error) {
    logger.error('Discord RPC disconnect failed:', error);
  }
};

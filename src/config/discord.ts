export const DISCORD_RPC_ENABLED =
  import.meta.env.VITE_DISCORD_RPC_ENABLED?.toString() !== 'false';

export const isDiscordRpcEnabledForPlatform = (platform: string) =>
  DISCORD_RPC_ENABLED && platform === 'android';

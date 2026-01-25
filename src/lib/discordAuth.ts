import { logger } from './logger';

type DiscordTokenStatus = 'valid' | 'invalid' | 'unknown';

const DISCORD_ME_URL = 'https://discord.com/api/v10/users/@me';
const CACHE_TTL_MS = 5 * 60 * 1000;

let lastToken: string | null = null;
let lastCheckedAt = 0;
let lastStatus: DiscordTokenStatus = 'unknown';

export async function validateDiscordToken(token: string): Promise<DiscordTokenStatus> {
  if (!token) {
    return 'invalid';
  }

  const now = Date.now();
  if (token === lastToken && now - lastCheckedAt < CACHE_TTL_MS) {
    return lastStatus;
  }

  try {
    const response = await fetch(DISCORD_ME_URL, {
      headers: { Authorization: token },
    });

    let status: DiscordTokenStatus = 'unknown';
    if (response.status === 200) {
      status = 'valid';
    } else if (response.status === 401 || response.status === 403) {
      status = 'invalid';
    } else {
      logger.warn(`Discord token validation returned ${response.status}`);
    }

    lastToken = token;
    lastCheckedAt = now;
    lastStatus = status;
    return status;
  } catch (error) {
    logger.error('Discord token validation failed:', error);
    lastToken = token;
    lastCheckedAt = now;
    lastStatus = 'unknown';
    return 'unknown';
  }
}

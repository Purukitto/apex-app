import { logger } from '../lib/logger';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'Apex/1.0 (https://github.com/Purukitto/apex-app)';

const ADDRESS_KEYS = [
  'city',
  'town',
  'village',
  'municipality',
  'county',
  'state_district',
  'district',
  'suburb',
  'neighbourhood',
  'state', // fallback: e.g. Maharashtra, California
] as const;

/**
 * Reverse geocode (lat, lon) to a locality name via Nominatim.
 * Tries city, town, village, municipality, county, state_district, district, suburb, neighbourhood.
 * Respects 1 req/s; do not call in a tight loop.
 */
export async function getCityFromCoords(
  lat: number,
  lon: number
): Promise<string | undefined> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: 'json',
    });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) {
      logger.debug('Geocode response not ok:', res.status);
      return undefined;
    }
    const data = (await res.json()) as { address?: Record<string, string> };
    const a = data?.address;
    if (!a) return undefined;
    for (const k of ADDRESS_KEYS) {
      const v = a[k];
      if (v && typeof v === 'string' && v.trim()) return v.trim();
    }
    logger.debug('Geocode: no known locality in address', Object.keys(a));
    return undefined;
  } catch (e) {
    logger.debug('Geocode failed:', e);
    return undefined;
  }
}

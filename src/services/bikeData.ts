import { logger } from '../lib/logger';

export interface WikipediaSearchResult {
  title: string;
  imageUrl: string | null;
  extract: string | null;
  pageId: number | null;
}

export interface WikipediaPageData {
  title: string;
  imageUrl: string | null;
  extract: string | null;
  pageId: number | null;
}

/**
 * Search Wikipedia for bike information
 * @param query - Search query (e.g., "Dominar 400", "Yamaha MT-07")
 * @returns Wikipedia page data including image URL and extract
 */
export async function searchBike(query: string): Promise<WikipediaPageData | null> {
  if (!query || query.trim().length === 0) {
    return null;
  }

  try {
    // Clean the query: trim and replace spaces with underscores for Wikipedia API
    const cleanQuery = query.trim().replace(/\s+/g, '_');
    
    // Wikipedia API endpoint
    const apiUrl = new URL('https://en.wikipedia.org/w/api.php');
    apiUrl.searchParams.set('action', 'query');
    apiUrl.searchParams.set('format', 'json');
    apiUrl.searchParams.set('formatversion', '2');
    apiUrl.searchParams.set('prop', 'pageimages|extracts');
    apiUrl.searchParams.set('piprop', 'original');
    apiUrl.searchParams.set('exintro', 'true'); // Get only intro section
    apiUrl.searchParams.set('explaintext', 'true'); // Plain text, no HTML
    apiUrl.searchParams.set('titles', cleanQuery);
    apiUrl.searchParams.set('origin', '*'); // CORS

    logger.debug('Searching Wikipedia:', { query, cleanQuery, url: apiUrl.toString() });

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      logger.error('Wikipedia API error:', {
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const data = await response.json();

    logger.debug('Wikipedia API response:', {
      hasQuery: !!data.query,
      pagesCount: data.query?.pages?.length || 0,
    });

    // Check if we have pages in the response
    if (!data.query || !data.query.pages || data.query.pages.length === 0) {
      logger.debug('No pages found in Wikipedia response');
      return null;
    }

    // Get the first page (Wikipedia API returns pages as an array in formatversion=2)
    const page = data.query.pages[0];

    // Check if page exists (missing pages have -1 pageid)
    if (page.missing || page.pageid === -1) {
      logger.debug('Wikipedia page not found:', { query });
      return null;
    }

    // Extract image URL from original property
    const imageUrl = page.original?.source || null;

    // Extract text from extract property
    const extract = page.extract || null;

    logger.debug('Wikipedia page found:', {
      title: page.title,
      pageId: page.pageid,
      hasImage: !!imageUrl,
      hasExtract: !!extract,
      extractLength: extract?.length || 0,
    });

    return {
      title: page.title,
      imageUrl,
      extract,
      pageId: page.pageid,
    };
  } catch (error) {
    logger.error('Error searching Wikipedia:', error);
    return null;
  }
}

/**
 * Extract engine specifications from Wikipedia extract text
 * Looks for common patterns like "cc", "cylinder", "PS", "hp", "kW"
 * @param extract - Wikipedia extract text
 * @returns Engine specification string or null
 */
export function extractEngineSpecs(extract: string | null): string | null {
  if (!extract) return null;

  // Common patterns for engine specs
  const enginePatterns = [
    // Pattern: "373 cc" or "373cc" or "373 cc single-cylinder"
    /(\d+\s*cc(?:\s+(?:single|twin|triple|four|inline|V|parallel|boxer)[-\s]?cylinder)?)/i,
    // Pattern: "373 cubic centimetres"
    /(\d+\s*cubic\s*centimetres?)/i,
    // Pattern: "373 cm³"
    /(\d+\s*cm³)/i,
  ];

  for (const pattern of enginePatterns) {
    const match = extract.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extract power specifications from Wikipedia extract text
 * Looks for patterns like "40 PS", "40 hp", "30 kW"
 * @param extract - Wikipedia extract text
 * @returns Power specification string or null
 */
export function extractPowerSpecs(extract: string | null): string | null {
  if (!extract) return null;

  // Common patterns for power specs
  const powerPatterns = [
    // Pattern: "40 PS @ 8000 rpm" or "40 PS (29 kW)"
    /(\d+\s*(?:PS|hp|HP|bhp|BHP)(?:\s*@\s*\d+\s*rpm)?(?:\s*\([^)]+\))?)/i,
    // Pattern: "30 kW @ 8000 rpm"
    /(\d+\s*kW(?:\s*@\s*\d+\s*rpm)?)/i,
    // Pattern: "40 horsepower"
    /(\d+\s*horsepower)/i,
  ];

  for (const pattern of powerPatterns) {
    const match = extract.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

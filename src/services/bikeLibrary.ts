import { supabase } from '../lib/supabaseClient';
import { logger } from '../lib/logger';
import type { GlobalBikeSpec } from '../types/database';

export interface SearchBikeParams {
  make?: string;
  model?: string;
  query?: string; // Full search query (make + model combined)
  year?: number;
}

/**
 * Search for a bike in the global_bike_specs database using fuzzy matching
 * If found but image_url is NULL, automatically fetch and update the image
 * @param params - Search parameters (make, model, query, optional year)
 * @returns Bike specification with image URL, or null if not found
 */
export async function searchGlobalBikes(
  params: SearchBikeParams
): Promise<GlobalBikeSpec | null> {
  const { make, model, query, year } = params;

  // If query is provided, parse it into make, model, and year
  let searchMake = make?.trim() || '';
  let searchModel = model?.trim() || '';
  let extractedYear = year;

  if (query && !make && !model) {
    // Smart parsing: extract year, then parse make/model
    let queryToParse = query.trim();
    const currentYear = new Date().getFullYear();
    const minYear = 1900;
    const maxYear = currentYear + 1;

    // Extract year (4-digit number between 1900 and current year + 1)
    const yearPattern = /\b(19\d{2}|20\d{2})\b/;
    const yearMatches = queryToParse.match(yearPattern);
    if (yearMatches) {
      const foundYear = parseInt(yearMatches[0], 10);
      if (foundYear >= minYear && foundYear <= maxYear) {
        extractedYear = foundYear;
        // Remove year from query for further parsing
        queryToParse = queryToParse.replace(yearPattern, '').trim();
      }
    }

    const queryParts = queryToParse.split(/\s+/).filter(part => part.length > 0);

    // Common multi-word motorcycle makes (case-insensitive matching)
    const multiWordMakes = [
      'royal enfield',
      'royal enfield',
      'bajaj auto',
      'hero motocorp',
      'hero honda',
      'tvs motor',
      'mahindra two',
      'ktm',
      'bmw motorrad',
      'honda',
      'yamaha',
      'suzuki',
      'kawasaki',
      'triumph',
      'ducati',
      'harley davidson',
      'harley-davidson',
      'indian motorcycle',
      'aprilia',
      'mv agusta',
      'benelli',
      'cf moto',
      'cfmoto',
    ];

    // Try to identify make from common patterns
    const queryLower = queryToParse.toLowerCase();
    let identifiedMake = '';
    let remainingQuery = queryToParse;

    // Check for multi-word makes first (longer matches first)
    const sortedMakes = multiWordMakes.sort((a, b) => b.length - a.length);
    for (const makePattern of sortedMakes) {
      if (queryLower.startsWith(makePattern)) {
        identifiedMake = queryToParse.substring(0, makePattern.length);
        remainingQuery = queryToParse.substring(makePattern.length).trim();
        break;
      }
    }

    // If no multi-word make found, try single-word makes
    if (!identifiedMake && queryParts.length > 0) {
      const firstWord = queryParts[0].toLowerCase();
      // Common single-word makes
      const singleWordMakes = [
        'yamaha', 'honda', 'suzuki', 'kawasaki', 'ktm', 'bmw', 'triumph',
        'ducati', 'aprilia', 'benelli', 'bajaj', 'hero', 'tvs', 'mahindra',
        'royal', 'enfield', 'indian', 'harley', 'cf', 'cfmoto',
      ];
      
      if (singleWordMakes.includes(firstWord)) {
        // Check if it's part of a multi-word make
        if (queryParts.length >= 2) {
          const twoWords = `${firstWord} ${queryParts[1].toLowerCase()}`;
          const isMultiWord = sortedMakes.some(m => m.startsWith(twoWords));
          if (isMultiWord) {
            // It's part of a multi-word make, use first 2 words
            identifiedMake = `${queryParts[0]} ${queryParts[1]}`;
            remainingQuery = queryParts.slice(2).join(' ');
          } else {
            // Single-word make
            identifiedMake = queryParts[0];
            remainingQuery = queryParts.slice(1).join(' ');
          }
        } else {
          // Single word - could be make or model, try as make first
          identifiedMake = queryParts[0];
          remainingQuery = '';
        }
      }
    }

    // Assign parsed values
    if (identifiedMake) {
      searchMake = identifiedMake;
      searchModel = remainingQuery;
    } else {
      // No make identified - treat all as model (or first word as make if multiple words)
      if (queryParts.length >= 2) {
        // Heuristic: first word might be make, rest is model
        searchMake = queryParts[0];
        searchModel = queryParts.slice(1).join(' ');
      } else if (queryParts.length === 1) {
        // Single word - search as model (more specific)
        searchModel = queryParts[0];
      }
    }
  }

  if (!searchMake && !searchModel) {
    logger.warn('searchGlobalBikes: make, model, or query is required');
    return null;
  }

  try {
    // Build search query using the combined search_text field
    // This is more efficient and handles all combinations (make, model, year) in one field
    let dbQuery = supabase
      .from('global_bike_specs')
      .select('*')
      .lt('report_count', 3); // Only get bikes that haven't been reported too many times

    // Build search query string from parsed components
    let searchQueryString = '';
    if (searchMake) {
      searchQueryString += searchMake.toLowerCase();
    }
    if (searchModel) {
      if (searchQueryString) searchQueryString += ' ';
      searchQueryString += searchModel.toLowerCase();
    }
    if (extractedYear) {
      if (searchQueryString) searchQueryString += ' ';
      searchQueryString += extractedYear.toString();
    }

    // Use search_text field for efficient full-text search
    if (searchQueryString.trim()) {
      // Use ILIKE on search_text for case-insensitive partial matching
      // This searches the combined "make model year" field
      dbQuery = dbQuery.ilike('search_text', `%${searchQueryString.trim()}%`);
    } else {
      // Fallback: if no search string, return null
      logger.warn('searchGlobalBikes: No search terms provided');
      return null;
    }

    // Order by relevance: exact matches first, then partial matches
    // Get multiple results and pick the best match
    const { data, error } = await dbQuery
      .order('make', { ascending: true })
      .order('model', { ascending: true })
      .limit(10); // Get top 10 matches

    if (error) {
      logger.error('searchGlobalBikes: Query error', error);
      throw error;
    }

    if (!data || data.length === 0) {
      logger.debug('searchGlobalBikes: No bike found', { make: searchMake, model: searchModel, year });
      return null;
    }

    // Score and rank results for best match
    const searchQueryLower = searchQueryString.trim().toLowerCase();
    const scoredResults = data.map((bike) => {
      let score = 0;
      const bikeMake = bike.make?.toLowerCase() || '';
      const bikeModel = bike.model?.toLowerCase() || '';
      const bikeSearchText = bike.search_text?.toLowerCase() || '';
      const searchMakeLower = searchMake.toLowerCase();
      const searchModelLower = searchModel.toLowerCase();

      // Check if entire search query matches search_text (highest priority)
      if (bikeSearchText.includes(searchQueryLower)) {
        // Exact phrase match in search_text
        if (bikeSearchText.startsWith(searchQueryLower)) {
          score += 200; // Starts with entire query
        } else {
          score += 150; // Contains entire query
        }
      }

      // Exact match gets highest score
      if (searchMake && bikeMake === searchMakeLower) {
        score += 100;
      } else if (searchMake && bikeMake.startsWith(searchMakeLower)) {
        score += 50; // Starts with gets good score
      } else if (searchMake && bikeMake.includes(searchMakeLower)) {
        score += 25; // Contains gets lower score
      }

      if (searchModel && bikeModel === searchModelLower) {
        score += 100;
      } else if (searchModel && bikeModel.startsWith(searchModelLower)) {
        score += 50;
      } else if (searchModel && bikeModel.includes(searchModelLower)) {
        score += 25;
      }

      // Year match bonus
      if (extractedYear && bike.year === extractedYear) {
        score += 50;
      }

      // Prefer verified bikes
      if (bike.is_verified) {
        score += 10;
      }

      return { bike: bike as GlobalBikeSpec, score };
    });

    // Sort by score descending and get the best match
    scoredResults.sort((a, b) => b.score - a.score);
    const bestMatch = scoredResults[0]?.bike;

    if (!bestMatch) {
      logger.debug('searchGlobalBikes: No valid match found');
      return null;
    }

    const bike = bestMatch;

    // Self-healing: If bike found but image_url is NULL, fetch and update
    if (!bike.image_url) {
      logger.debug('searchGlobalBikes: Bike found but image_url is NULL, fetching...', {
        bikeId: bike.id,
        make: bike.make,
        model: bike.model,
      });

      try {
        // Get current session for Edge Function authentication
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          logger.warn('searchGlobalBikes: No session, cannot fetch image');
          return bike; // Return bike without image
        }

        // Call Edge Function to fetch image
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          logger.error('searchGlobalBikes: VITE_SUPABASE_URL not configured');
          return bike;
        }

        const functionUrl = `${supabaseUrl}/functions/v1/fetch-bike-image`;

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({
            make: bike.make,
            model: bike.model,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          logger.error('searchGlobalBikes: Edge Function error', {
            status: response.status,
            error: errorData,
          });
          return bike; // Return bike without image
        }

        const { imageUrl } = await response.json();

        if (imageUrl) {
          // Update the global_bike_specs table with the new image URL
          const { error: updateError } = await supabase
            .from('global_bike_specs')
            .update({ image_url: imageUrl })
            .eq('id', bike.id)
            .is('image_url', null); // Only update if image_url is still NULL (race condition protection)

          if (updateError) {
            logger.error('searchGlobalBikes: Failed to update image_url', updateError);
            // Return bike with image URL in memory even if update failed
            return { ...bike, image_url: imageUrl };
          }

          logger.info('searchGlobalBikes: Successfully updated image_url', {
            bikeId: bike.id,
            imageUrl,
          });

          // Return bike with updated image URL
          return { ...bike, image_url: imageUrl };
        } else {
          logger.debug('searchGlobalBikes: No image found from Edge Function', {
            bikeId: bike.id,
          });
        }
      } catch (error) {
        logger.error('searchGlobalBikes: Error fetching image', error);
        // Return bike without image on error
      }
    }

    return bike;
  } catch (error) {
    logger.error('searchGlobalBikes: Error searching for bike', error);
    return null;
  }
}

/**
 * Report a bike specification as having bad data
 * Increments the report_count for the bike
 * @param bikeId - ID of the bike to report
 * @returns Success status
 */
export async function reportBikeSpec(bikeId: string): Promise<boolean> {
  try {
    // Get current bike to increment report_count
    const { data: bike, error: fetchError } = await supabase
      .from('global_bike_specs')
      .select('report_count')
      .eq('id', bikeId)
      .single();

    if (fetchError || !bike) {
      logger.error('reportBikeSpec: Bike not found', fetchError);
      return false;
    }

    // Increment report_count
    const { error: updateError } = await supabase
      .from('global_bike_specs')
      .update({ report_count: (bike.report_count || 0) + 1 })
      .eq('id', bikeId);

    if (updateError) {
      logger.error('reportBikeSpec: Failed to update report_count', updateError);
      return false;
    }

    logger.info('reportBikeSpec: Successfully reported bike', { bikeId });
    return true;
  } catch (error) {
    logger.error('reportBikeSpec: Error reporting bike', error);
    return false;
  }
}

/**
 * Add a new bike specification to the global database
 * @param spec - Bike specification data
 * @returns Created bike specification or null on error
 */
export async function addBikeSpec(
  spec: Omit<GlobalBikeSpec, 'id' | 'created_at' | 'updated_at' | 'report_count' | 'is_verified'>
): Promise<GlobalBikeSpec | null> {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.error('addBikeSpec: User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('global_bike_specs')
      .insert({
        make: spec.make.trim(),
        model: spec.model.trim(),
        year: spec.year || null,
        category: spec.category || null,
        displacement: spec.displacement || null,
        power: spec.power || null,
        torque: spec.torque || null,
        image_url: spec.image_url || null,
        created_by: user.id,
        is_verified: false,
        report_count: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('addBikeSpec: Failed to insert bike spec', error);
      return null;
    }

    logger.info('addBikeSpec: Successfully added bike spec', { bikeId: data.id });
    return data as GlobalBikeSpec;
  } catch (error) {
    logger.error('addBikeSpec: Error adding bike spec', error);
    return null;
  }
}

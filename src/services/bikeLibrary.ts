import { supabase } from '../lib/supabaseClient';
import { logger } from '../lib/logger';
import type { GlobalBikeSpec } from '../types/database';

export interface SearchBikeParams {
  make: string;
  model: string;
  year?: number;
}

/**
 * Search for a bike in the global_bike_specs database
 * If found but image_url is NULL, automatically fetch and update the image
 * @param params - Search parameters (make, model, optional year)
 * @returns Bike specification with image URL, or null if not found
 */
export async function searchGlobalBikes(
  params: SearchBikeParams
): Promise<GlobalBikeSpec | null> {
  const { make, model, year } = params;

  if (!make || !model) {
    logger.warn('searchGlobalBikes: make and model are required');
    return null;
  }

  try {
    // Build query
    let query = supabase
      .from('global_bike_specs')
      .select('*')
      .eq('make', make.trim())
      .eq('model', model.trim())
      .lt('report_count', 3); // Only get bikes that haven't been reported too many times

    // Add year filter if provided
    if (year) {
      query = query.eq('year', year);
    }

    // Execute query
    const { data, error } = await query.limit(1).single();

    if (error) {
      // If no rows found, that's okay - return null
      if (error.code === 'PGRST116') {
        logger.debug('searchGlobalBikes: No bike found', { make, model, year });
        return null;
      }
      throw error;
    }

    if (!data) {
      logger.debug('searchGlobalBikes: No bike found', { make, model, year });
      return null;
    }

    const bike = data as GlobalBikeSpec;

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

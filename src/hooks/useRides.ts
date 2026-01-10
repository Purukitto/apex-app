import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Ride } from '../types/database';

interface UseRidesOptions {
  bikeId?: string;
  limit?: number;
}

/**
 * Hook to fetch recent rides from Supabase
 * @param options - Configuration options
 * @param options.bikeId - Optional bike ID to filter rides
 * @param options.limit - Maximum number of rides to fetch (default: 10)
 */
export function useRides(options: UseRidesOptions = {}) {
  const { bikeId, limit = 10 } = options;

  const { data: rides, isLoading, error } = useQuery({
    queryKey: ['rides', bikeId, limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('rides')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(limit);

      // Filter by bike if specified
      if (bikeId) {
        query = query.eq('bike_id', bikeId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      return (data as Ride[]) || [];
    },
  });

  return { rides, isLoading, error };
}

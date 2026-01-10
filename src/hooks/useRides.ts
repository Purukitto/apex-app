import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Ride } from '../types/database';

// React Query configuration for rides
const RIDES_STALE_TIME = 0; // Always consider data stale, refetch when needed
const RIDES_CACHE_TIME = 5 * 60 * 1000; // Keep in cache for 5 minutes

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

  const { data: rides, isLoading, error, refetch, isFetching } = useQuery({
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
    staleTime: RIDES_STALE_TIME,
    gcTime: RIDES_CACHE_TIME, // Previously cacheTime
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  return { rides, isLoading, error, refetch, isFetching };
}

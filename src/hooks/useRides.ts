import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { apexToast } from '../lib/toast';
import type { Ride } from '../types/database';

// React Query configuration for rides
const RIDES_STALE_TIME = Infinity; // Never consider stale - only refetch manually
const RIDES_CACHE_TIME = 5 * 60 * 1000; // Keep in cache for 5 minutes

interface UseRidesOptions {
  bikeId?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Common helper function to fetch rides from Supabase
 * Used by both useRides and paginated queries
 */
export async function fetchRides(options: {
  bikeId?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
}): Promise<{ rides: Ride[]; total?: number }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { bikeId, limit, page, pageSize } = options;

  // If pagination is requested
  if (page !== undefined && pageSize !== undefined) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let countQuery = supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    let dataQuery = supabase
      .from('rides')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .range(from, to);

    // Filter by bike if specified
    if (bikeId) {
      countQuery = countQuery.eq('bike_id', bikeId);
      dataQuery = dataQuery.eq('bike_id', bikeId);
    }

    const [{ count }, { data, error: queryError }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (queryError) throw queryError;
    return { rides: (data as Ride[]) || [], total: count || 0 };
  }

  // Legacy limit-based query
  let query = supabase
    .from('rides')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })
    .limit(limit || 10);

  // Filter by bike if specified
  if (bikeId) {
    query = query.eq('bike_id', bikeId);
  }

  const { data, error: queryError } = await query;

  if (queryError) throw queryError;
  return { rides: (data as Ride[]) || [] };
}

/**
 * Hook to fetch recent rides from Supabase
 * @param options - Configuration options
 * @param options.bikeId - Optional bike ID to filter rides
 * @param options.limit - Maximum number of rides to fetch (default: 10)
 * @param options.page - Page number for pagination (0-indexed)
 * @param options.pageSize - Number of rides per page
 */
export function useRides(options: UseRidesOptions = {}) {
  const queryClient = useQueryClient();
  const { bikeId, limit, page, pageSize } = options;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['rides', bikeId, limit, page, pageSize],
    queryFn: () => fetchRides({ bikeId, limit, page, pageSize }),
    staleTime: RIDES_STALE_TIME,
    gcTime: RIDES_CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  const rides = data?.rides || [];
  const total = data?.total;

  // Update ride mutation
  const updateRide = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<Ride, 'ride_name' | 'notes'>>;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('rides')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Ride;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      apexToast.success('Ride updated');
    },
    onError: (error) => {
      apexToast.error(
        error instanceof Error ? error.message : 'Failed to update ride'
      );
    },
  });

  // Delete ride mutation
  const deleteRide = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('rides')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      apexToast.success('Ride deleted');
    },
    onError: (error) => {
      apexToast.error(
        error instanceof Error ? error.message : 'Failed to delete ride'
      );
    },
  });

  return {
    rides,
    total,
    isLoading,
    error,
    refetch,
    isFetching,
    updateRide,
    deleteRide,
  };
}

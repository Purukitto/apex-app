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

    // Get count first
    let countQuery = supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (bikeId) {
      countQuery = countQuery.eq('bike_id', bikeId);
    }

    // Try to use RPC function first (if it exists) with timeout
    // Skip RPC if it doesn't exist to avoid slow loading
    try {
      const rpcResult = await Promise.race([
        supabase.rpc('get_rides_with_geojson', {
          p_user_id: user.id,
          p_bike_id: bikeId || null,
          p_limit: pageSize,
          p_offset: from,
        }),
        new Promise<{ error: { message: string } }>((resolve) => {
          setTimeout(() => resolve({ error: { message: 'RPC timeout' } }), 2000);
        }),
      ]) as Awaited<ReturnType<typeof supabase.rpc<'get_rides_with_geojson'>>> | { error: { message: string } };
      
      if ('data' in rpcResult && rpcResult.data && !rpcResult.error) {
        const [{ count }] = await Promise.all([countQuery]);
        
        // Process route_path from JSONB to GeoJSONLineString format
        const processedRides = (rpcResult.data || []).map((ride: Ride & { route_path?: unknown }) => {
          if (ride.route_path) {
            try {
              // route_path comes as JSONB, parse it if it's a string
              const routePath = typeof ride.route_path === 'string' 
                ? JSON.parse(ride.route_path) 
                : ride.route_path;
              return { ...ride, route_path: routePath as Ride['route_path'] };
            } catch {
              return { ...ride, route_path: undefined };
            }
          }
          return { ...ride, route_path: undefined };
        });
        
        return { rides: processedRides as Ride[], total: count || 0 };
      }
    } catch {
      // RPC function doesn't exist or timed out, fall back to regular query
      console.warn('RPC function get_rides_with_geojson not available, using fallback query');
    }

    // Fallback: regular query (route_path won't be available as GeoJSON)
    let dataQuery = supabase
      .from('rides')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .range(from, to);

    if (bikeId) {
      dataQuery = dataQuery.eq('bike_id', bikeId);
    }

    const [{ count }, { data, error: queryError }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (queryError) throw queryError;
    
    // Without RPC function, route_path won't be available
    const processedRides = (data || []).map((ride: Ride) => ({
      ...ride,
      route_path: undefined, // Can't convert PostGIS geography without RPC function
    }));
    
    return { rides: processedRides as Ride[], total: count || 0 };
  }

  // Legacy limit-based query
  // Try RPC function first with timeout
  try {
    const rpcResult = await Promise.race([
      supabase.rpc('get_rides_with_geojson', {
        p_user_id: user.id,
        p_bike_id: bikeId || null,
        p_limit: limit || 10,
        p_offset: 0,
      }),
      new Promise<{ error: { message: string } }>((resolve) => {
        setTimeout(() => resolve({ error: { message: 'RPC timeout' } }), 2000);
      }),
    ]) as Awaited<ReturnType<typeof supabase.rpc<'get_rides_with_geojson'>>> | { error: { message: string } };
    
    if ('data' in rpcResult && rpcResult.data && !rpcResult.error) {
      const processedRides = (rpcResult.data || []).map((ride: Ride & { route_path?: unknown }) => {
        if (ride.route_path) {
          try {
            const routePath = typeof ride.route_path === 'string' 
              ? JSON.parse(ride.route_path) 
              : ride.route_path;
            return { ...ride, route_path: routePath as Ride['route_path'] };
          } catch {
            return { ...ride, route_path: undefined };
          }
        }
        return { ...ride, route_path: undefined };
      });
      
      return { rides: processedRides as Ride[] };
    }
  } catch {
    console.warn('RPC function get_rides_with_geojson not available, using fallback query');
  }

  // Fallback: regular query
  let query = supabase
    .from('rides')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })
    .limit(limit || 10);

  if (bikeId) {
    query = query.eq('bike_id', bikeId);
  }

  const { data, error: queryError } = await query;

  if (queryError) throw queryError;
  
  const processedRides = (data || []).map((ride: Ride) => ({
    ...ride,
    route_path: undefined,
  }));
  
  return { rides: processedRides as Ride[] };
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

      // First verify the ride exists and belongs to the user
      const { data: existingRide, error: fetchError } = await supabase
        .from('rides')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingRide) {
        throw new Error('Ride not found or you do not have permission to update it');
      }

      const { data, error } = await supabase
        .from('rides')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        // Provide more helpful error messages
        if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
          throw new Error('Ride not found or you do not have permission to update it');
        }
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          throw new Error('Database columns not found. Please run the migration to add ride_name and notes columns.');
        }
        throw error;
      }

      if (!data) {
        throw new Error('Update succeeded but no data was returned');
      }

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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { apexToast } from '../lib/toast';
import type { Ride } from '../types/database';
import { logger } from '../lib/logger';

// React Query configuration for rides
const RIDES_STALE_TIME = Infinity; // Never consider stale - only refetch manually
const RIDES_CACHE_TIME = 5 * 60 * 1000; // Keep in cache for 5 minutes

interface UseRidesOptions {
  bikeId?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  includeRoute?: boolean;
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
  includeRoute?: boolean;
}): Promise<{ rides: Ride[]; total?: number }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { bikeId, limit, page, pageSize, includeRoute = false } = options;
  const baseColumns =
    'id,bike_id,user_id,start_time,end_time,distance_km,max_lean_left,max_lean_right,ride_name,notes,image_url,created_at' as const;
  const baseColumnsWithRoute =
    'id,bike_id,user_id,start_time,end_time,distance_km,max_lean_left,max_lean_right,ride_name,notes,image_url,created_at,route_path' as const;
  const selectColumns = includeRoute ? baseColumnsWithRoute : baseColumns;

  // If pagination is requested
  if (page !== undefined && pageSize !== undefined) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    if (includeRoute) {
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
          
          return { rides: processedRides as Ride[] };
        }
      } catch {
        // RPC function doesn't exist or timed out, fall back to regular query
        logger.warn('RPC function get_rides_with_geojson not available, using fallback query');
      }
    }

    // Fallback: regular query (route_path won't be available as GeoJSON)
    let dataQuery = supabase
      .from('rides')
      .select(selectColumns)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .range(from, to);

    if (bikeId) {
      dataQuery = dataQuery.eq('bike_id', bikeId);
    }

    const { data, error: queryError } = await dataQuery;
    const typedData = data as unknown as Ride[] | null;

    if (queryError) throw queryError;
    
    // Without RPC function, route_path won't be available
    const processedRides = (typedData || []).map((ride: Ride) => {
      if (includeRoute && ride.route_path && typeof ride.route_path === 'string') {
        try {
          return { ...ride, route_path: JSON.parse(ride.route_path) as Ride['route_path'] };
        } catch {
          return { ...ride, route_path: undefined };
        }
      }
      return {
        ...ride,
        route_path: includeRoute ? ride.route_path : undefined, // Can't convert PostGIS geography without RPC function
      };
    });
    
    return { rides: processedRides as Ride[] };
  }

  if (includeRoute) {
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
      logger.warn('RPC function get_rides_with_geojson not available, using fallback query');
    }
  }

  // Fallback: regular query
  let query = supabase
    .from('rides')
    .select(selectColumns)
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })
    .limit(limit || 10);

  if (bikeId) {
    query = query.eq('bike_id', bikeId);
  }

  const { data, error: queryError } = await query;
  const typedData = data as unknown as Ride[] | null;

  if (queryError) throw queryError;
  
  const processedRides = (typedData || []).map((ride: Ride) => {
    if (includeRoute && ride.route_path && typeof ride.route_path === 'string') {
      try {
        return { ...ride, route_path: JSON.parse(ride.route_path) as Ride['route_path'] };
      } catch {
        return { ...ride, route_path: undefined };
      }
    }
    return {
      ...ride,
      route_path: includeRoute ? ride.route_path : undefined,
    };
  });
  
  return { rides: processedRides as Ride[] };
}

async function fetchRideCount(options: { bikeId?: string }): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { bikeId } = options;

  let countQuery = supabase
    .from('rides')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (bikeId) {
    countQuery = countQuery.eq('bike_id', bikeId);
  }

  const { count, error } = await countQuery;

  if (error) throw error;

  return count || 0;
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
  const { bikeId, limit, page, pageSize, includeRoute = false } = options;
  const isPaginated = page !== undefined && pageSize !== undefined;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['rides', bikeId, limit, page, pageSize, includeRoute],
    queryFn: () => fetchRides({ bikeId, limit, page, pageSize, includeRoute }),
    staleTime: RIDES_STALE_TIME,
    gcTime: RIDES_CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  const { data: totalCount } = useQuery({
    queryKey: ['rides', 'count', bikeId],
    queryFn: () => fetchRideCount({ bikeId }),
    enabled: isPaginated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  const rides = data?.rides || [];
  const total = totalCount ?? data?.total;

  // Update ride mutation
  const updateRide = useMutation({
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['rides'] });
      
      const previousRides = queryClient.getQueriesData({ queryKey: ['rides'] });
      
      // Optimistically update all ride queries
      queryClient.setQueriesData<{ rides: Ride[]; total?: number }>(
        { queryKey: ['rides'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            rides: old.rides.map(ride => ride.id === id ? { ...ride, ...updates } : ride)
          };
        }
      );
      
      return { previousRides };
    },
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<Ride, 'ride_name' | 'notes' | 'image_url'>>;
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
          const missingColumn = error.message.includes('image_url') 
            ? 'image_url' 
            : error.message.includes('ride_name') || error.message.includes('notes')
            ? 'ride_name or notes'
            : 'required columns';
          throw new Error(`Database column not found. Please run the migration to add ${missingColumn} column(s).`);
        }
        throw error;
      }

      if (!data) {
        throw new Error('Update succeeded but no data was returned');
      }

      // Note: route_path (PostGIS geography) is not returned in simple select
      // It will be refetched via query invalidation in onSuccess
      return data as Ride;
    },
    onSuccess: (updatedRide) => {
      // Invalidate and refetch to ensure all data (including route_path) is fresh
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      
      // Also optimistically update cache with the returned data
      queryClient.setQueriesData<{ rides: Ride[]; total?: number }>(
        { queryKey: ['rides'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            rides: old.rides.map(ride => ride.id === updatedRide.id ? updatedRide : ride)
          };
        }
      );
      apexToast.success('Ride updated');
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousRides) {
        context.previousRides.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      apexToast.error(
        error instanceof Error ? error.message : 'Failed to update ride'
      );
    },
  });

  // Delete ride mutation
  const deleteRide = useMutation({
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['rides'] });
      
      const previousRides = queryClient.getQueriesData({ queryKey: ['rides'] });
      const countKey = ['rides', 'count', bikeId];
      const previousCount = queryClient.getQueryData<number>(countKey);
      
      // Optimistically remove
      queryClient.setQueriesData<{ rides: Ride[]; total?: number }>(
        { queryKey: ['rides'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            rides: old.rides.filter(ride => ride.id !== id),
            total: old.total !== undefined ? Math.max(0, (old.total || 0) - 1) : undefined
          };
        }
      );

      if (previousCount !== undefined) {
        queryClient.setQueryData<number>(countKey, Math.max(0, previousCount - 1));
      }
      
      return { previousRides, previousCount };
    },
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
      // Data already optimistically removed
      apexToast.success('Ride deleted');
    },
    onError: (error, _id, context) => {
      // Rollback on error
      if (context?.previousRides) {
        context.previousRides.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(['rides', 'count', bikeId], context.previousCount);
      }
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

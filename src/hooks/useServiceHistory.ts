import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { ServiceHistory } from '../types/database';

export function useServiceHistory(bikeId?: string, scheduleId?: string) {
  // Fetch service history for a specific bike/schedule
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['serviceHistory', bikeId, scheduleId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('service_history')
        .select('*')
        .order('service_date', { ascending: false });

      // If bikeId is provided, filter by bike
      if (bikeId) {
        query = query.eq('bike_id', bikeId);
      } else {
        // Otherwise, get history for all user's bikes
        const { data: bikes } = await supabase
          .from('bikes')
          .select('id')
          .eq('user_id', user.id);

        if (bikes && bikes.length > 0) {
          const bikeIds = bikes.map((b) => b.id);
          query = query.in('bike_id', bikeIds);
        } else {
          return [];
        }
      }

      // If scheduleId is provided, filter by schedule
      if (scheduleId) {
        query = query.eq('schedule_id', scheduleId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      return (data as ServiceHistory[]) || [];
    },
    enabled: !!bikeId || true,
  });

  return {
    history: history || [],
    isLoading,
    error,
  };
}

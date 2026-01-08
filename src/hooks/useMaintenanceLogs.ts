import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { MaintenanceLog } from '../types/database';

export function useMaintenanceLogs(bikeId?: string) {
  const queryClient = useQueryClient();

  // Fetch maintenance logs for a specific bike or all bikes
  const { data: maintenanceLogs, isLoading, error } = useQuery({
    queryKey: ['maintenanceLogs', bikeId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('maintenance_logs')
        .select('*')
        .order('date_performed', { ascending: false });

      // If bikeId is provided, filter by bike
      if (bikeId) {
        query = query.eq('bike_id', bikeId);
      } else {
        // Otherwise, get logs for all user's bikes
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

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      return (data as MaintenanceLog[]) || [];
    },
    enabled: !!bikeId || true, // Only run if bikeId is provided or we can get user bikes
  });

  // Create a new maintenance log
  const createMaintenanceLog = useMutation({
    mutationFn: async (
      logData: Omit<MaintenanceLog, 'id' | 'created_at'>
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify the bike belongs to the user
      const { data: bike, error: bikeError } = await supabase
        .from('bikes')
        .select('id')
        .eq('id', logData.bike_id)
        .eq('user_id', user.id)
        .single();

      if (bikeError || !bike) {
        throw new Error('Bike not found or you do not have permission');
      }

      const { error } = await supabase
        .from('maintenance_logs')
        .insert(logData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
      queryClient.invalidateQueries({ queryKey: ['bikes'] }); // In case we update bike odo
    },
  });

  // Update a maintenance log
  const updateMaintenanceLog = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<MaintenanceLog, 'id' | 'bike_id' | 'created_at'>>;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify the log's bike belongs to the user
      const { data: log } = await supabase
        .from('maintenance_logs')
        .select('bike_id')
        .eq('id', id)
        .single();

      if (!log) throw new Error('Maintenance log not found');

      const { data: bike } = await supabase
        .from('bikes')
        .select('id')
        .eq('id', log.bike_id)
        .eq('user_id', user.id)
        .single();

      if (!bike) {
        throw new Error('You do not have permission to update this log');
      }

      const { error } = await supabase
        .from('maintenance_logs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
    },
  });

  // Delete a maintenance log
  const deleteMaintenanceLog = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify the log's bike belongs to the user
      const { data: log } = await supabase
        .from('maintenance_logs')
        .select('bike_id')
        .eq('id', id)
        .single();

      if (!log) throw new Error('Maintenance log not found');

      const { data: bike } = await supabase
        .from('bikes')
        .select('id')
        .eq('id', log.bike_id)
        .eq('user_id', user.id)
        .single();

      if (!bike) {
        throw new Error('You do not have permission to delete this log');
      }

      const { error } = await supabase
        .from('maintenance_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
    },
  });

  return {
    maintenanceLogs: maintenanceLogs || [],
    isLoading,
    error,
    createMaintenanceLog,
    updateMaintenanceLog,
    deleteMaintenanceLog,
  };
}


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { apexToast } from '../lib/toast';
import type { MaintenanceLog, Bike } from '../types/database';
import { logger } from '../lib/logger';

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
    onMutate: async (logData) => {
      await queryClient.cancelQueries({ queryKey: ['maintenanceLogs', bikeId] });
      await queryClient.cancelQueries({ queryKey: ['bikes'] });
      
      const previousLogs = queryClient.getQueryData<MaintenanceLog[]>(['maintenanceLogs', bikeId]);
      const previousBikes = queryClient.getQueryData<Bike[]>(['bikes']);
      
      // Optimistically add log
      const optimisticLog: MaintenanceLog = {
        ...logData,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData<MaintenanceLog[]>(['maintenanceLogs', bikeId], (old = []) => 
        [optimisticLog, ...old]
      );
      
      return { previousLogs, previousBikes };
    },
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

      const { data, error } = await supabase
        .from('maintenance_logs')
        .insert(logData)
        .select()
        .single();

      if (error) throw error;
      return data as MaintenanceLog;
    },
    onSuccess: (newLog) => {
      // Update with actual data from server
      queryClient.setQueryData<MaintenanceLog[]>(['maintenanceLogs', bikeId], (old = []) => {
        const withoutTemp = old.filter(log => !log.id.startsWith('temp-'));
        return [newLog, ...withoutTemp];
      });
      queryClient.invalidateQueries({ queryKey: ['bikes'] }); // In case we update bike odo
    },
    onError: (_error, _logData, context) => {
      // Rollback on error
      if (context?.previousLogs) {
        queryClient.setQueryData(['maintenanceLogs', bikeId], context.previousLogs);
      }
      if (context?.previousBikes) {
        queryClient.setQueryData(['bikes'], context.previousBikes);
      }
    },
  });

  // Update a maintenance log
  const updateMaintenanceLog = useMutation({
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['maintenanceLogs', bikeId] });
      await queryClient.cancelQueries({ queryKey: ['bikes'] });
      
      const previousLogs = queryClient.getQueryData<MaintenanceLog[]>(['maintenanceLogs', bikeId]);
      const previousBikes = queryClient.getQueryData<Bike[]>(['bikes']);
      
      // Optimistically update
      queryClient.setQueryData<MaintenanceLog[]>(['maintenanceLogs', bikeId], (old = []) =>
        old.map(log => log.id === id ? { ...log, ...updates } : log)
      );
      
      return { previousLogs, previousBikes };
    },
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

      const { data, error } = await supabase
        .from('maintenance_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as MaintenanceLog;
    },
    onSuccess: (updatedLog) => {
      // Update with actual data from server
      queryClient.setQueryData<MaintenanceLog[]>(['maintenanceLogs', bikeId], (old = []) =>
        old.map(log => log.id === updatedLog.id ? updatedLog : log)
      );
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousLogs) {
        queryClient.setQueryData(['maintenanceLogs', bikeId], context.previousLogs);
      }
      if (context?.previousBikes) {
        queryClient.setQueryData(['bikes'], context.previousBikes);
      }
    },
  });

  // Delete a maintenance log
  const deleteMaintenanceLog = useMutation({
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['maintenanceLogs', bikeId] });
      
      const previousLogs = queryClient.getQueryData<MaintenanceLog[]>(['maintenanceLogs', bikeId]);
      
      // Optimistically remove
      queryClient.setQueryData<MaintenanceLog[]>(['maintenanceLogs', bikeId], (old = []) =>
        old.filter(log => log.id !== id)
      );
      
      return { previousLogs };
    },
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
      // Data already optimistically removed
      apexToast.success('Maintenance log deleted');
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
    },
    onError: (error, _id, context) => {
      // Rollback on error
      if (context?.previousLogs) {
        queryClient.setQueryData(['maintenanceLogs', bikeId], context.previousLogs);
      }
      logger.error('Error deleting maintenance log:', error);
      apexToast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete maintenance log'
      );
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


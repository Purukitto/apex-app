import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { apexToast } from '../lib/toast';
import type { FuelLog } from '../types/database';
import { logger } from '../lib/logger';
import { calculateMileage, getLastFuelPrice } from '../utils/fuelCalculations';

export function useFuelLogs(bikeId?: string) {
  const queryClient = useQueryClient();

  // Fetch fuel logs for a specific bike or all bikes
  const { data: fuelLogs, isLoading, error } = useQuery({
    queryKey: ['fuelLogs', bikeId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('fuel_logs')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

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
      return (data as FuelLog[]) || [];
    },
    enabled: !!bikeId || true,
  });

  // Create a new fuel log
  const createFuelLog = useMutation({
    mutationFn: async (logData: Omit<FuelLog, 'id' | 'created_at'>) => {
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

      const { error } = await supabase.from('fuel_logs').insert(logData);

      if (error) throw error;

      // Calculate and update mileage and last_fuel_price in bikes table
      await updateBikeFuelStats(logData.bike_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelLogs'] });
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
      apexToast.success('Fuel log added');
    },
    onError: (error) => {
      logger.error('Error creating fuel log:', error);
      apexToast.error(
        error instanceof Error ? error.message : 'Failed to add fuel log'
      );
    },
  });

  // Update a fuel log
  const updateFuelLog = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<FuelLog, 'id' | 'bike_id' | 'created_at'>>;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify the log's bike belongs to the user
      const { data: log } = await supabase
        .from('fuel_logs')
        .select('bike_id')
        .eq('id', id)
        .single();

      if (!log) throw new Error('Fuel log not found');

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
        .from('fuel_logs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Recalculate and update mileage and last_fuel_price
      await updateBikeFuelStats(log.bike_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelLogs'] });
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
      apexToast.success('Fuel log updated');
    },
    onError: (error) => {
      logger.error('Error updating fuel log:', error);
      apexToast.error(
        error instanceof Error ? error.message : 'Failed to update fuel log'
      );
    },
  });

  // Delete a fuel log
  const deleteFuelLog = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify the log's bike belongs to the user
      const { data: log } = await supabase
        .from('fuel_logs')
        .select('bike_id')
        .eq('id', id)
        .single();

      if (!log) throw new Error('Fuel log not found');

      const { data: bike } = await supabase
        .from('bikes')
        .select('id')
        .eq('id', log.bike_id)
        .eq('user_id', user.id)
        .single();

      if (!bike) {
        throw new Error('You do not have permission to delete this log');
      }

      const { error } = await supabase.from('fuel_logs').delete().eq('id', id);

      if (error) throw error;

      // Recalculate and update mileage and last_fuel_price after deletion
      await updateBikeFuelStats(log.bike_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelLogs'] });
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
      apexToast.success('Fuel log deleted');
    },
    onError: (error) => {
      logger.error('Error deleting fuel log:', error);
      apexToast.error(
        error instanceof Error ? error.message : 'Failed to delete fuel log'
      );
    },
  });

  /**
   * Helper function to update bike's avg_mileage and last_fuel_price
   * Called after create/update/delete operations
   */
  const updateBikeFuelStats = async (bikeId: string) => {
    try {
      // Fetch all fuel logs for this bike
      const { data: allLogs, error: fetchError } = await supabase
        .from('fuel_logs')
        .select('*')
        .eq('bike_id', bikeId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        logger.error('Error fetching fuel logs for stats update:', fetchError);
        return;
      }

      const fuelLogs = (allLogs as FuelLog[]) || [];

      // Calculate mileage and last fuel price
      const mileage = calculateMileage(fuelLogs);
      const lastPrice = getLastFuelPrice(fuelLogs);

      // Update bike with calculated values
      const updates: { avg_mileage?: number | null; last_fuel_price?: number | null } = {};
      
      if (mileage !== null) {
        updates.avg_mileage = mileage;
      } else {
        updates.avg_mileage = null; // Clear if no valid calculation
      }

      if (lastPrice !== null) {
        updates.last_fuel_price = lastPrice;
      } else {
        updates.last_fuel_price = null; // Clear if no logs
      }

      const { error: updateError } = await supabase
        .from('bikes')
        .update(updates)
        .eq('id', bikeId);

      if (updateError) {
        logger.error('Error updating bike fuel stats:', updateError);
      } else {
        logger.debug('Bike fuel stats updated:', { bikeId, mileage, lastPrice });
      }
    } catch (error) {
      logger.error('Unexpected error updating bike fuel stats:', error);
    }
  };

  return {
    fuelLogs: fuelLogs || [],
    isLoading,
    error,
    createFuelLog,
    updateFuelLog,
    deleteFuelLog,
  };
}

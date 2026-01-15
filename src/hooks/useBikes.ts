import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { apexToast } from '../lib/toast';
import type { Bike } from '../types/database';
import { logger } from '../lib/logger';
import { initializeDefaultSchedules } from './useMaintenanceSchedules';

export function useBikes() {
  const queryClient = useQueryClient();

  // Fetch all bikes for the current user
  const { data: bikes, isLoading, error } = useQuery({
    queryKey: ['bikes'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Bike[];
    },
  });

  // Create a new bike
  const createBike = useMutation({
    mutationFn: async (bikeData: Omit<Bike, 'id' | 'user_id' | 'created_at'>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bikes')
        .insert({
          ...bikeData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      const newBike = data as Bike;
      
      // Initialize default maintenance schedules for the new bike
      try {
        await initializeDefaultSchedules(newBike.id);
        logger.debug('Default maintenance schedules initialized for new bike');
      } catch (scheduleError) {
        // Log but don't fail bike creation if schedule init fails
        logger.warn('Failed to initialize default schedules:', scheduleError);
      }
      
      return newBike;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] });
      apexToast.success('Bike Added');
    },
    onError: (error) => {
      apexToast.error(error instanceof Error ? error.message : 'Failed to add bike');
    },
  });

  // Update a bike
  const updateBike = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Bike, 'id' | 'user_id'>>;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bikes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Bike;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
      apexToast.success('Bike Updated');
    },
    onError: (error) => {
      apexToast.error(error instanceof Error ? error.message : 'Failed to update bike');
    },
  });

  /**
   * Get counts of related data for a bike
   * Used to show warnings before deletion
   */
  const getBikeRelatedDataCounts = async (bikeId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get counts for all related data in parallel
    const [ridesResult, maintenanceResult, fuelResult] = await Promise.all([
      supabase
        .from('rides')
        .select('id', { count: 'exact', head: true })
        .eq('bike_id', bikeId)
        .eq('user_id', user.id),
      supabase
        .from('maintenance_logs')
        .select('id', { count: 'exact', head: true })
        .eq('bike_id', bikeId),
      supabase
        .from('fuel_logs')
        .select('id', { count: 'exact', head: true })
        .eq('bike_id', bikeId),
    ]);

    return {
      rides: ridesResult.count || 0,
      maintenanceLogs: maintenanceResult.count || 0,
      fuelLogs: fuelResult.count || 0,
    };
  };

  // Delete a bike
  const deleteBike = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First, verify the bike exists and belongs to the user
      const { data: bikeCheck, error: checkError } = await supabase
        .from('bikes')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (checkError || !bikeCheck) {
        // Log for debugging, but show user-friendly message
        if (checkError) {
          logger.error('Bike check error:', checkError);
        }
        throw new Error(
          'Bike not found or you do not have permission to access it.'
        );
      }

      // Check for all related records with counts
      const relatedCounts = await getBikeRelatedDataCounts(id);

      // Block deletion if rides exist (critical data with GPS paths)
      if (relatedCounts.rides > 0) {
        throw new Error(
          `Cannot delete bike: It has ${relatedCounts.rides} ride(s) with GPS data. ` +
          `Please delete rides first or contact support if you need to delete everything.`
        );
      }

      // Warn about maintenance/fuel logs but allow deletion
      // (These are less critical and can be recreated)
      if (relatedCounts.maintenanceLogs > 0 || relatedCounts.fuelLogs > 0) {
        logger.info(
          `Deleting bike with related data: ${relatedCounts.maintenanceLogs} maintenance log(s), ${relatedCounts.fuelLogs} fuel log(s)`
        );
      }

      // Attempt deletion
      // Note: If database has CASCADE constraints, related data will be deleted automatically
      // Otherwise, we rely on application-level checks above
      const { data, error } = await supabase
        .from('bikes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        // Log technical details for debugging
        logger.error('Supabase delete error:', error);
        // Provide user-friendly error messages
        if (error.code === '23503') {
          // Foreign key constraint violation
          throw new Error(
            'Cannot delete bike: It has associated data. ' +
            `Rides: ${relatedCounts.rides}, Maintenance: ${relatedCounts.maintenanceLogs}, Fuel: ${relatedCounts.fuelLogs}. ` +
            'Please delete related data first or contact support.'
          );
        }
        if (error.code === 'PGRST301' || error.message?.includes('permission')) {
          throw new Error(
            'Permission denied. Please try again or contact support.'
          );
        }
        throw new Error(error.message || 'Failed to delete bike');
      }

      // Check if any rows were actually deleted
      if (!data || data.length === 0) {
        // Log technical details for debugging
        logger.error('Delete returned no rows. Bike ID:', id, 'User ID:', user.id);
        throw new Error(
          'Failed to delete bike. Please try again or contact support.'
        );
      }

      logger.info(
        `Bike deleted successfully. ID: ${id}, Related data deleted: ` +
        `${relatedCounts.maintenanceLogs} maintenance log(s), ${relatedCounts.fuelLogs} fuel log(s)`
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceLogs'] });
      queryClient.invalidateQueries({ queryKey: ['fuelLogs'] });
      // Success toast is handled in Garage.tsx after mutation completes
    },
    onError: (error) => {
      // Error toast is handled in Garage.tsx
      // Only log for debugging
      logger.error('Error deleting bike:', error);
    },
  });

  return {
    bikes: bikes || [],
    isLoading,
    error,
    createBike,
    updateBike,
    deleteBike,
    getBikeRelatedDataCounts,
  };
}


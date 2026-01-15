import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { apexToast } from '../lib/toast';
import type { Bike } from '../types/database';
import { logger } from '../lib/logger';

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
      return data as Bike;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
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

      // Check for related records that might prevent deletion
      const { data: rides } = await supabase
        .from('rides')
        .select('id')
        .eq('bike_id', id)
        .limit(1);

      // Check maintenance logs (no user_id filter needed - RLS handles it)
      // Note: Maintenance logs don't block deletion, but we check for reference
      await supabase
        .from('maintenance_logs')
        .select('id')
        .eq('bike_id', id)
        .limit(1);

      if (rides && rides.length > 0) {
        throw new Error(
          'Cannot delete bike: It has associated rides. Please delete rides first or contact support.'
        );
      }

      // Maintenance logs don't block deletion - silently proceed

      // Attempt deletion
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
          throw new Error(
            'Cannot delete bike: It has associated rides or maintenance logs.'
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

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
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
  };
}


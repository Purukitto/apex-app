import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Bike } from '../types/database';

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
        console.error('Bike check error:', checkError);
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
      const { data: maintenanceLogs } = await supabase
        .from('maintenance_logs')
        .select('id')
        .eq('bike_id', id)
        .limit(1);

      if (rides && rides.length > 0) {
        throw new Error(
          'Cannot delete bike: It has associated rides. Please delete rides first or contact support.'
        );
      }

      if (maintenanceLogs && maintenanceLogs.length > 0) {
        // Maintenance logs shouldn't block deletion, but we'll note it
        console.warn('Bike has maintenance logs, but proceeding with deletion');
      }

      // Attempt deletion
      const { data, error } = await supabase
        .from('bikes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Supabase delete error:', error);
        // Provide more specific error messages
        if (error.code === '23503') {
          throw new Error(
            'Cannot delete bike: It is referenced by other records (rides or maintenance logs).'
          );
        }
        if (error.code === 'PGRST301' || error.message?.includes('permission')) {
          throw new Error(
            'Permission denied: Check your Row Level Security (RLS) policies in Supabase. Ensure you have a DELETE policy for the bikes table.'
          );
        }
        throw new Error(error.message || 'Failed to delete bike');
      }

      // Check if any rows were actually deleted
      if (!data || data.length === 0) {
        console.error('Delete returned no rows. Bike ID:', id, 'User ID:', user.id);
        throw new Error(
          'Deletion was blocked by Row Level Security (RLS). Please check your Supabase RLS policies. You need a DELETE policy like: CREATE POLICY "Users can delete own bikes" ON bikes FOR DELETE USING (auth.uid() = user_id);'
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
    },
    onError: (error) => {
      console.error('Error deleting bike:', error);
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


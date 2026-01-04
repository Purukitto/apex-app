import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Bike } from '../types/database';

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
    mutationFn: async (bikeData: Omit<Bike, 'id' | 'user_id'>) => {
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

      const { error } = await supabase
        .from('bikes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
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


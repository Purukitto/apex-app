import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  email: string;
  riderName: string | null;
}

export function useUserProfile() {
  const queryClient = useQueryClient();

  // Fetch current user profile
  const { data: user, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error('Not authenticated');
      return user;
    },
  });

  // Update rider name in user metadata
  const updateRiderName = useMutation({
    mutationFn: async (riderName: string) => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...currentUser.user_metadata,
          rider_name: riderName,
        },
      });

      if (error) throw error;
      return data.user as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  // Sign out
  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  });

  const profile: UserProfile | null = user
    ? {
        email: user.email || '',
        riderName: user.user_metadata?.rider_name || null,
      }
    : null;

  return {
    user,
    profile,
    isLoading,
    updateRiderName,
    signOut,
  };
}


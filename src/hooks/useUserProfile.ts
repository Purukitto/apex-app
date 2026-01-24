import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

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

  const updateEmail = useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      return data.user as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  const reauthenticate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.reauthenticate();
      if (error) throw error;
    },
  });

  const updatePasswordWithNonce = useMutation({
    mutationFn: async (input: { password: string; nonce: string }) => {
      const { data, error } = await supabase.auth.updateUser({
        password: input.password,
        nonce: input.nonce,
      });
      if (error) throw error;
      return data.user as User;
    },
  });

  const verifyEmailChangeOtp = useMutation({
    mutationFn: async (input: { email: string; token: string }) => {
      const { data, error } = await supabase.auth.verifyOtp({
        email: input.email,
        token: input.token,
        type: 'email_change',
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  const resendEmailChangeOtp = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resend({
        type: 'email_change',
        email,
      });
      if (error) throw error;
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
    updateEmail,
    reauthenticate,
    updatePasswordWithNonce,
    verifyEmailChangeOtp,
    resendEmailChangeOtp,
    signOut,
  };
}


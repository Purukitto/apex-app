import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { apexToast } from '../lib/toast';
import { logger } from '../lib/logger';

interface DiscordConnection {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

interface DiscordConnectionResponse {
  connected: boolean;
  connection?: DiscordConnection;
}

/**
 * Hook for managing Discord OAuth integration
 */
export function useDiscord() {
  const queryClient = useQueryClient();
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  // Check if Discord is connected
  const { data: connection, isLoading } = useQuery({
    queryKey: ['discordConnection'],
    queryFn: async (): Promise<DiscordConnectionResponse> => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return { connected: false };
      }

      // Check if connection exists in database
      // Note: RLS policy automatically filters by auth.uid(), but we also filter by user_id for defense in depth
      const { data, error } = await supabase
        .from('user_discord_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no row exists

      // If error (other than "not found") or no data, return not connected
      if (error) {
        // PGRST116 means no rows found, which is expected when not connected
        if (error.code === 'PGRST116') {
          return { connected: false };
        }
        // Other errors should be logged but still return not connected
        logger.error('Error checking Discord connection:', error);
        return { connected: false };
      }

      if (!data) {
        return { connected: false };
      }

      return {
        connected: true,
        connection: data as DiscordConnection,
      };
    },
  });

  // Link Discord account via OAuth2
  const linkDiscord = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!SUPABASE_URL) {
        throw new Error('Supabase URL not configured');
      }

      // Get current session token for authorization
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call edge function to get OAuth URL
      // Note: The edge function will generate its own state with user_id encoded
      // We pass redirect_uri for mobile deep linking
      const redirectUri = Capacitor.isNativePlatform() 
        ? 'apex://discord-connected'
        : undefined;
      
      const functionUrl = new URL(`${SUPABASE_URL}/functions/v1/discord-oauth`);
      if (redirectUri) {
        functionUrl.searchParams.set('redirect_uri', redirectUri);
      }
      
      const response = await fetch(functionUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get OAuth URL' }));
        throw new Error(errorData.error || 'Failed to get OAuth URL');
      }

      const data = await response.json();
      
      if (!data?.oauth_url) {
        throw new Error('Invalid response from OAuth endpoint');
      }

      const oauthUrl = data.oauth_url;

      // Open OAuth flow
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Browser for mobile
        await Browser.open({
          url: oauthUrl,
          windowName: '_self',
        });

        // For mobile, the edge function will redirect to a deep link
        // We'll poll for connection status after a delay
        // In production, you'd use App Links / Universal Links for iOS/Android
        return new Promise((resolve, reject) => {
          const checkInterval = setInterval(async () => {
            await queryClient.invalidateQueries({ queryKey: ['discordConnection'] });
            const connection = queryClient.getQueryData<DiscordConnectionResponse>(['discordConnection']);
            if (connection?.connected) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 1000);

          // Timeout after 5 minutes
          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('OAuth flow timed out'));
          }, 5 * 60 * 1000);
        });
      } else {
        // Use window.open for web
        const width = 500;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          oauthUrl,
          'Discord OAuth',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // Poll for callback completion
        return new Promise((resolve, reject) => {
          // Listen for message from popup
          const messageHandler = async (event: MessageEvent) => {
            if (event.data?.type === 'DISCORD_OAUTH_SUCCESS') {
              window.removeEventListener('message', messageHandler);
              clearInterval(checkInterval);
              await queryClient.invalidateQueries({ queryKey: ['discordConnection'] });
              resolve();
            } else if (event.data?.type === 'DISCORD_OAUTH_ERROR') {
              window.removeEventListener('message', messageHandler);
              clearInterval(checkInterval);
              reject(new Error(event.data.error || 'Discord connection was cancelled'));
            }
          };
          window.addEventListener('message', messageHandler);

          const checkInterval = setInterval(async () => {
            if (popup.closed) {
              clearInterval(checkInterval);
              window.removeEventListener('message', messageHandler);
              // Check if connection was successful
              await queryClient.invalidateQueries({ queryKey: ['discordConnection'] });
              const newConnection = queryClient.getQueryData<DiscordConnectionResponse>(['discordConnection']);
              if (newConnection?.connected) {
                resolve();
              } else {
                reject(new Error('Discord connection failed or was cancelled'));
              }
            }
          }, 500);

          // Timeout after 5 minutes
          setTimeout(() => {
            clearInterval(checkInterval);
            if (!popup.closed) {
              popup.close();
            }
            reject(new Error('OAuth flow timed out'));
          }, 5 * 60 * 1000);
        });
      }
    },
    onSuccess: () => {
      apexToast.success('Discord connected successfully');
      queryClient.invalidateQueries({ queryKey: ['discordConnection'] });
    },
    onError: (error: Error) => {
      apexToast.error(error.message || 'Failed to connect Discord');
    },
  });

  // Unlink Discord account
  const unlinkDiscord = useMutation({
    mutationFn: async (): Promise<void> => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Delete connection from database
      const { error } = await supabase
        .from('user_discord_connections')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      apexToast.success('Discord disconnected');
      queryClient.invalidateQueries({ queryKey: ['discordConnection'] });
    },
    onError: (error: Error) => {
      apexToast.error(error.message || 'Failed to disconnect Discord');
    },
  });

  // Update Discord presence (for ride start/end)
  const updatePresence = useMutation({
    mutationFn: async ({
      type,
      bikeName,
      city,
    }: {
      type: 'start' | 'end';
      bikeName?: string;
      city?: string;
    }): Promise<void> => {
      const { data, error } = await supabase.functions.invoke('update-discord-presence', {
        body: {
          type,
          bike_name: bikeName,
          city,
        },
      });

      if (error) throw error;
      if (data?.error) {
        throw new Error(data.error);
      }
    },
    onError: (error: Error) => {
      // Don't show toast for presence updates - they're background operations
      logger.error('Failed to update Discord presence:', error);
    },
  });

  return {
    connection: connection?.connection,
    isConnected: connection?.connected ?? false,
    isLoading,
    linkDiscord,
    unlinkDiscord,
    updatePresence,
  };
}

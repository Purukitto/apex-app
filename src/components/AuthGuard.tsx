import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from './LoadingSpinner';
import type { User } from '@supabase/supabase-js';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Check initial session (with a short retry to avoid race conditions
    // right after sign-in / storage hydration in some browsers/webviews)
    const init = async () => {
      const { data: { session: firstSession } } = await supabase.auth.getSession();
      let session = firstSession;

      if (!session) {
        await new Promise(resolve => setTimeout(resolve, 250));
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        session = retrySession;
      }

      if (!isMounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    };

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    init().catch(() => {
      if (!isMounted) return;
      setUser(null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen text="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}


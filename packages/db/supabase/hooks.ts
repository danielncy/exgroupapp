import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSession, onAuthStateChange } from "./auth";

interface UseSessionReturn {
  session: Session | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * React hook that returns the current Supabase session.
 * Automatically updates when auth state changes.
 */
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const currentSession = await getSession();
      setSession(currentSession);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get session";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const subscription = onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh]);

  return { session, loading, error, refresh };
}

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * React hook that returns the current authenticated user.
 * Derived from the session — automatically updates on auth changes.
 */
export function useUser(): UseUserReturn {
  const { session, loading, error } = useSession();
  return { user: session?.user ?? null, loading, error };
}

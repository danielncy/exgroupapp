import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSession, onAuthStateChange } from "./auth";
import { getCustomerPrimaryBrand } from "./brand";
import type { BrandId } from "@ex-group/shared/types/brand";

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

// ---------------------------------------------------------------------------
// useBrandDetection — detect the active brand
// Priority: (1) URL ?brand= param, (2) customer's primary membership, (3) "ex_style"
// ---------------------------------------------------------------------------

interface UseBrandDetectionReturn {
  brandId: BrandId;
  loading: boolean;
}

export function useBrandDetection(): UseBrandDetectionReturn {
  const [brandId, setBrandId] = useState<BrandId>("ex_style");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detect() {
      try {
        // 1. Check URL param
        if (typeof globalThis !== "undefined" && "location" in globalThis) {
          const params = new URLSearchParams((globalThis as unknown as { location: { search: string } }).location.search);
          const urlBrand = params.get("brand") as BrandId | null;
          if (
            urlBrand &&
            ["ex_style", "ex_beauty", "uhair", "coulisse"].includes(urlBrand)
          ) {
            setBrandId(urlBrand);
            setLoading(false);
            return;
          }
        }

        // 2. Customer's primary brand (highest visits)
        const primary = await getCustomerPrimaryBrand();
        setBrandId(primary);
      } catch {
        // Fallback to ex_style
        setBrandId("ex_style");
      } finally {
        setLoading(false);
      }
    }

    void detect();
  }, []);

  return { brandId, loading };
}

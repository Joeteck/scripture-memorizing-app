// src/hooks/useAuth.ts

import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { setMonitoringUser, logError } from "@/lib/monitoring";
import {
  signIn,
  signUp,
  signOut,
  signInWithGoogle,
  resetPassword,
} from "@/lib/auth";

export function useAuth() {
  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState<Session | null>(null);

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          logError(error, { where: "useAuth: getSession" });
        }

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        setMonitoringUser(session?.user?.id ?? null);
      } catch (e) {
        logError(e, { where: "useAuth.initialize" });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setMonitoringUser(session?.user?.id ?? null);

      // Once Supabase reports any auth state,
      // we know auth initialization is complete.
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    loading,

    session,

    user,

    signedIn: !!session,

    signInWithPassword: signIn,

    signUp,

    signOut,

    signInWithGoogle,

    resetPassword,
  };
}
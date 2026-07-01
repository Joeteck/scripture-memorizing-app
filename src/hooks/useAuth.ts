// src/hooks/useAuth.ts

import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
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
        console.log("🔄 Loading initial session...");

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Initial session error:", error);
        }

        if (!mounted) return;

        console.log(
          "Initial session:",
          session ? "SIGNED IN" : "SIGNED OUT"
        );

        setSession(session);
        setUser(session?.user ?? null);
      } catch (e) {
        console.error("Auth initialization failed:", e);
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
      console.log("────────────────────────");
      console.log("Auth Event:", event);
      console.log("Has Session:", !!session);

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

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
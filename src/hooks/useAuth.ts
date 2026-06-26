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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const { data, error } =
          await supabase.auth.getSession();

        if (error) {
          console.error(error);
        }

        if (!mounted) return;

        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (e) {
        console.error(
          "Auth initialization failed",
          e
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
        }
      );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
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
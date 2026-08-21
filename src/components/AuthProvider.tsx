"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { mergeHighScoreWithCloud, type Profile } from "@/lib/profile";
import { authRedirectUrl, getSupabase } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  highScore: number | null;
  loading: boolean;
  recovering: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<string | null>;
  signOut: () => Promise<void>;
  sendReset: (email: string) => Promise<string | null>;
  resendConfirmation: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  refreshProfile: () => Promise<number | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [highScore, setHighScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  const hydrate = useCallback(async (session: Session | null) => {
    setUser(session?.user ?? null);
    if (!session) {
      setProfile(null);
      setHighScore(null);
      return;
    }
    const merged = await mergeHighScoreWithCloud();
    setHighScore(merged);
    const supabase = getSupabase();
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, high_score")
      .eq("id", session.user.id)
      .maybeSingle();
    setProfile(data);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      hydrate(data.session).finally(() => {
        if (!cancelled) setLoading(false);
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "SIGNED_OUT") setRecovering(false);
      void hydrate(session);
    });

    const onOnline = () => {
      void supabase.auth.getSession().then(({ data }) => {
        if (data.session) void hydrate(data.session);
      });
    };
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
      window.removeEventListener("online", onOnline);
    };
  }, [hydrate]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: authRedirectUrl(),
          data: { display_name: displayName },
        },
      });
      if (error) return error.message;
      if (!data.session) {
        return "Check your email to confirm your account, then sign in.";
      }
      return null;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  const sendReset = useCallback(async (email: string) => {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl(),
    });
    return error?.message ?? null;
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const { error } = await getSupabase().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: authRedirectUrl() },
    });
    return error?.message ?? null;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await getSupabase().auth.updateUser({ password });
    if (error) return error.message;
    setRecovering(false);
    return null;
  }, []);

  const refreshProfile = useCallback(async () => {
    const merged = await mergeHighScoreWithCloud();
    setHighScore(merged);
    return merged;
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      highScore,
      loading,
      recovering,
      signIn,
      signUp,
      signOut,
      sendReset,
      resendConfirmation,
      updatePassword,
      refreshProfile,
    }),
    [
      user,
      profile,
      highScore,
      loading,
      recovering,
      signIn,
      signUp,
      signOut,
      sendReset,
      resendConfirmation,
      updatePassword,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

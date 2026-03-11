import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { getArchetype } from "@/data/companions";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, "id" | "user_id" | "created_at" | "updated_at">>) => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        if (import.meta.env.DEV) console.warn("Failed to fetch profile:", error);
        return;
      }
      setProfile(data);
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Failed to fetch profile:", e);
    }
  }, []);

  // Create companion profile from onboarding data (runs once after first sign-in)
  const ensureCompanionProfile = useCallback(async (userId: string) => {
    try {
      const stored = localStorage.getItem("soulvay-personalization");
      if (!stored) return; // No onboarding data — skip

      const personalization = JSON.parse(stored);
      const archetypeId = personalization.companionId || "mira";
      const arch = getArchetype(archetypeId);
      if (!arch) return;

      // Check if profile already exists
      const { data: existing } = await supabase
        .from("companion_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) return; // Already has a companion

      await supabase
        .from("companion_profiles")
        .insert({
          user_id: userId,
          name: arch.name,
          archetype: arch.id,
          personality_style: arch.personalityStyle,
          tone: arch.tone,
          appearance_prompt: arch.appearancePrompt,
        } as any);
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Auto companion creation failed:", e);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        setSession(session);
        setIsLoading(false);

        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
          // Auto-create companion profile from onboarding selection
          if (_event === "SIGNED_IN") {
            ensureCompanionProfile(session.user.id);
          }
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSession(session);
      setIsLoading(false);

      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });
    if (error) throw error;

    // Send branded welcome email asynchronously (fire-and-forget)
    if (data.session) {
      supabase.functions.invoke('send-transactional-email', {
        body: {
          template: 'welcome',
          data: { displayName: displayName || undefined },
        },
      }).catch((e) => {
        if (import.meta.env.DEV) console.warn('Welcome email failed:', e);
      });
    }

    return data;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Omit<Profile, "id" | "user_id" | "created_at" | "updated_at">>) => {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);
    if (error) throw error;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const refreshProfile = useCallback(() => {
    if (user) fetchProfile(user.id);
  }, [user, fetchProfile]);

  const value: AuthContextValue = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

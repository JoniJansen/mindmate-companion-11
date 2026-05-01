import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
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

/**
 * Demo user object used exclusively for the Apple App Review demo flow.
 * This object is NEVER persisted, NEVER sent to Supabase, and NEVER touches
 * any backend. It exists only so the reviewer can see the paywall + StoreKit
 * purchase flow without needing valid backend credentials.
 *
 * Apple has rejected the app multiple times because their reviewer cannot
 * reach our Supabase /auth/v1/token endpoint. The demo flow is now fully
 * auth-free — see activateDemoMode() below.
 */
export interface DemoUser {
  id: "demo-apple-review";
  email: "apple-review@soulvay.de";
  displayName: "Apple Reviewer";
  subscriptionTier: "free";
  isPremium: false;
  hasActiveSubscription: false;
}

const DEMO_USER: DemoUser = {
  id: "demo-apple-review",
  email: "apple-review@soulvay.de",
  displayName: "Apple Reviewer",
  subscriptionTier: "free",
  isPremium: false,
  hasActiveSubscription: false,
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // ── Demo-mode (Apple App Review) ────────────────────────────────────────
  isDemoMode: boolean;
  demoUser: DemoUser | null;
  activateDemoMode: () => void;
  deactivateDemoMode: () => void;
  // ────────────────────────────────────────────────────────────────────────
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
  // Demo-mode state — in-memory only, never persisted to localStorage.
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);

  // Module-level dedup: prevent double-fetch from onAuthStateChange + getSession racing
  const profileFetchInFlight = useRef<Promise<void> | null>(null);
  const lastProfileUserId = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    // If we already fetched for this user and have data, skip
    if (lastProfileUserId.current === userId && profileFetchInFlight.current) {
      await profileFetchInFlight.current;
      return;
    }
    lastProfileUserId.current = userId;

    const doFetch = async () => {
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
      } finally {
        profileFetchInFlight.current = null;
      }
    };

    profileFetchInFlight.current = doFetch();
    await profileFetchInFlight.current;
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
        .select("id, archetype")
        .eq("user_id", userId)
        .maybeSingle();

      const profileData = {
        name: arch.name,
        archetype: arch.id,
        personality_style: arch.personalityStyle,
        tone: arch.tone,
        appearance_prompt: arch.appearancePrompt,
      };

      if (existing) {
        // If onboarding selected a different companion, update the persisted profile
        if (existing.archetype !== arch.id) {
          await supabase
            .from("companion_profiles")
            .update(profileData as any)
            .eq("user_id", userId);
        }
        return;
      }

      await supabase
        .from("companion_profiles")
        .insert({ user_id: userId, ...profileData } as any);
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

  const activateDemoMode = useCallback(() => {
    setDemoUser(DEMO_USER);
    setIsDemoMode(true);
    // eslint-disable-next-line no-console
    console.log("[DemoMode] activated, routing to paywall");
  }, []);

  const deactivateDemoMode = useCallback(() => {
    setDemoUser(null);
    setIsDemoMode(false);
  }, []);

  const signOut = useCallback(async () => {
    // Clear user-specific caches BEFORE sign-out to prevent cross-account bleed
    try {
      localStorage.removeItem("soulvay-premium-state");
      localStorage.removeItem("soulvay-chat-mode");
    } catch {}
    setProfile(null);
    lastProfileUserId.current = null;
    profileFetchInFlight.current = null;

    // Demo mode: there is NO Supabase session to terminate. Calling
    // supabase.auth.signOut() here would produce a 401 because no JWT exists.
    if (isDemoMode) {
      deactivateDemoMode();
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [isDemoMode, deactivateDemoMode]);

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
    // Demo mode counts as "authenticated" for routing purposes only.
    // No backend calls will succeed because there is no real JWT.
    isAuthenticated: !!user || isDemoMode,
    isDemoMode,
    demoUser,
    activateDemoMode,
    deactivateDemoMode,
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

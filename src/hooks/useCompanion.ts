import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { companionArchetypes, getArchetype, CompanionArchetype } from "@/data/companions";

export interface CompanionProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  appearance_prompt: string | null;
  personality_style: string;
  tone: string;
  archetype: string;
  bond_level: number;
  last_interaction: string | null;
  created_at: string;
}

export function useCompanion() {
  const { user } = useAuth();
  const [companion, setCompanion] = useState<CompanionProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCompanion = useCallback(async () => {
    if (!user) {
      setCompanion(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("companion_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setCompanion(data as CompanionProfile | null);
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Failed to load companion:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCompanion();
  }, [loadCompanion]);

  const selectArchetype = useCallback(async (archetypeId: string) => {
    if (!user) return;
    const arch = getArchetype(archetypeId);
    if (!arch) return;

    const profileData = {
      user_id: user.id,
      name: arch.name,
      archetype: arch.id,
      personality_style: arch.personalityStyle,
      tone: arch.tone,
      appearance_prompt: arch.appearancePrompt,
    };

    try {
      if (companion) {
        const { data, error } = await supabase
          .from("companion_profiles")
          .update(profileData)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        setCompanion(data as CompanionProfile);
      } else {
        const { data, error } = await supabase
          .from("companion_profiles")
          .insert(profileData)
          .select()
          .single();
        if (error) throw error;
        setCompanion(data as CompanionProfile);
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error("Failed to save companion:", e);
      throw e;
    }
  }, [user, companion]);

  const updateName = useCallback(async (name: string) => {
    if (!user || !companion) return;
    try {
      const { data, error } = await supabase
        .from("companion_profiles")
        .update({ name })
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      setCompanion(data as CompanionProfile);
    } catch (e) {
      if (import.meta.env.DEV) console.error("Failed to update name:", e);
      throw e;
    }
  }, [user, companion]);

  const updateAppearance = useCallback(async (appearancePrompt: string) => {
    if (!user || !companion) return;
    try {
      const { data, error } = await supabase
        .from("companion_profiles")
        .update({ appearance_prompt: appearancePrompt })
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      setCompanion(data as CompanionProfile);
    } catch (e) {
      if (import.meta.env.DEV) console.error("Failed to update appearance:", e);
      throw e;
    }
  }, [user, companion]);

  const saveAvatarUrl = useCallback(async (avatarUrl: string) => {
    if (!user || !companion) return;
    try {
      const { data, error } = await supabase
        .from("companion_profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      setCompanion(data as CompanionProfile);
    } catch (e) {
      if (import.meta.env.DEV) console.error("Failed to save avatar:", e);
      throw e;
    }
  }, [user, companion]);

  const incrementBond = useCallback(async () => {
    if (!user || !companion) return;
    try {
      await supabase
        .from("companion_profiles")
        .update({
          bond_level: (companion.bond_level || 0) + 1,
          last_interaction: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      setCompanion((prev) =>
        prev ? { ...prev, bond_level: (prev.bond_level || 0) + 1, last_interaction: new Date().toISOString() } : prev
      );
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Bond increment failed:", e);
    }
  }, [user, companion]);

  const currentArchetype: CompanionArchetype | undefined = companion
    ? getArchetype(companion.archetype)
    : undefined;

  return {
    companion,
    currentArchetype,
    isLoading,
    archetypes: companionArchetypes,
    selectArchetype,
    updateName,
    updateAppearance,
    saveAvatarUrl,
    incrementBond,
    reload: loadCompanion,
  };
}
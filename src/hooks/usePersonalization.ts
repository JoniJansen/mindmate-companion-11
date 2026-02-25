import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { exercises, Exercise } from "@/data/exercises";

interface PersonalizationData {
  focusAreas: string[];
  reflectionFrequency: string;
  personalGoal: string;
}

interface AdaptiveSuggestion {
  type: "exercise" | "topic" | "journal" | "mood";
  title: string;
  titleDe: string;
  description: string;
  descriptionDe: string;
  exercise?: Exercise;
  route?: string;
  urgent?: boolean;
}

// Maps focus areas to exercise categories
const focusToExercise: Record<string, string[]> = {
  stress: ["breathing-60", "grounding-54321"],
  anxiety: ["breathing-60", "grounding-54321"],
  sleep: ["breathing-60"],
  relationships: ["boundary-prep"],
  selfworth: ["values-clarification", "journaling-prompts"],
  motivation: ["values-clarification"],
  grief: ["journaling-prompts"],
  general: ["thought-reframing"],
};

export function usePersonalization() {
  const { user } = useAuth();
  const [recentMoodAvg, setRecentMoodAvg] = useState<number | null>(null);
  const [stressCount, setStressCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Read personalization from localStorage with versioning + safe defaults
  const personalization = useMemo<PersonalizationData>(() => {
    const defaults: PersonalizationData = {
      focusAreas: [],
      reflectionFrequency: "3x_week",
      personalGoal: "",
    };
    try {
      const stored = localStorage.getItem("soulvay-personalization");
      if (!stored) return defaults;
      const parsed = JSON.parse(stored);
      // Migrate old format without schemaVersion
      if (!parsed.schemaVersion) {
        const migrated = {
          ...defaults,
          ...parsed,
          schemaVersion: 1,
        };
        localStorage.setItem("soulvay-personalization", JSON.stringify(migrated));
        return migrated;
      }
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  }, []);

  // Fetch recent mood data
  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    const fetchMoodData = async () => {
      try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { data } = await supabase
          .from("mood_checkins")
          .select("mood_value, feelings")
          .eq("user_id", user.id)
          .gte("created_at", threeDaysAgo.toISOString())
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          const avg = data.reduce((sum, d) => sum + d.mood_value, 0) / data.length;
          setRecentMoodAvg(Math.round(avg * 10) / 10);

          // Count stressed occurrences
          const stressed = data.filter(d => 
            (d.feelings || []).some((f: string) => f === "stressed" || f === "overwhelmed" || f === "anxious")
          ).length;
          setStressCount(stressed);
        }
      } catch (e) {
        console.warn("Failed to fetch mood data for personalization:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoodData();
  }, [user]);

  // Generate adaptive suggestions
  const suggestions = useMemo<AdaptiveSuggestion[]>(() => {
    const result: AdaptiveSuggestion[] = [];

    // Mood-based urgent suggestion
    if (recentMoodAvg !== null && recentMoodAvg < 2.5) {
      result.push({
        type: "exercise",
        title: "You seem tense this week",
        titleDe: "Du wirkst diese Woche angespannt",
        description: "Try 3 minutes of grounding?",
        descriptionDe: "Möchtest du 3 Minuten Erdung ausprobieren?",
        exercise: exercises.find(e => e.id === "grounding-54321"),
        urgent: true,
      });
    }

    if (stressCount >= 3) {
      result.push({
        type: "exercise",
        title: "Stress has been showing up often",
        titleDe: "Stress zeigt sich häufig",
        description: "A quick breathing exercise might help",
        descriptionDe: "Eine kurze Atemübung könnte helfen",
        exercise: exercises.find(e => e.id === "breathing-60"),
        urgent: true,
      });
    }

    // Focus-based suggestions (from onboarding)
    for (const focus of personalization.focusAreas.slice(0, 2)) {
      const exerciseIds = focusToExercise[focus] || [];
      const exercise = exercises.find(e => exerciseIds.includes(e.id));
      if (exercise && !result.some(r => r.exercise?.id === exercise.id)) {
        result.push({
          type: "exercise",
          title: `Recommended for you`,
          titleDe: `Empfohlen für dich`,
          description: exercise.title,
          descriptionDe: exercise.title,
          exercise,
        });
      }
    }

    return result.slice(0, 3);
  }, [recentMoodAvg, stressCount, personalization.focusAreas]);

  // Audio suggestions based on mood/focus/time
  const audioSuggestion = useMemo<{ sessionId: string; reason: "sleep" | "stress" } | null>(() => {
    const hour = new Date().getHours();
    const isNight = hour >= 20 || hour < 6;

    // Sleep suggestion: focus on sleep OR low mood at night
    if (
      (personalization.focusAreas.includes("sleep") && isNight) ||
      (recentMoodAvg !== null && recentMoodAvg < 2.5 && isNight)
    ) {
      return { sessionId: "sleep-wind-down", reason: "sleep" };
    }

    // Stress suggestion: 3+ stressed check-ins
    if (stressCount >= 3) {
      return { sessionId: "stress-release", reason: "stress" };
    }

    return null;
  }, [personalization.focusAreas, recentMoodAvg, stressCount]);

  return {
    personalization,
    recentMoodAvg,
    stressCount,
    suggestions,
    audioSuggestion,
    isLoading,
  };
}

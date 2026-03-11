import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

export type CheckinType = "memory" | "pattern" | "insight" | "initiative" | "identity";

export interface CompanionCheckinData {
  type: CheckinType;
  text: string;
  chatPrompt: string; // The message to inject into chat when "Talk about it" is tapped
}

const DAILY_KEY = "soulvay-checkin-date";

/**
 * Generates rich companion check-ins using memories, patterns, insights.
 * Only one per day. Rotates between different types for variety.
 */
export function useCompanionCheckins(companionName?: string) {
  const [checkin, setCheckin] = useState<CompanionCheckinData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { language } = useTranslation();

  const name = companionName || "Soulvay";

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    // Only show once per day
    const today = new Date().toISOString().split("T")[0];
    const lastShown = localStorage.getItem(DAILY_KEY);
    if (lastShown === today) { setIsLoading(false); return; }

    const load = async () => {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

        const [memoriesRes, patternsRes, insightsRes] = await Promise.all([
          supabase
            .from("user_memories")
            .select("content, memory_type, confidence_score, created_at")
            .eq("user_id", user.id)
            .lt("created_at", sevenDaysAgo)
            .gte("confidence_score", 0.65)
            .order("confidence_score", { ascending: false })
            .limit(5),
          supabase
            .from("emotional_patterns")
            .select("description, confidence, pattern_type")
            .eq("user_id", user.id)
            .gte("confidence", 0.6)
            .order("confidence", { ascending: false })
            .limit(3),
          supabase
            .from("session_insights")
            .select("insight_text, created_at")
            .eq("user_id", user.id)
            .lt("created_at", threeDaysAgo)
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

        const memories = memoriesRes.data || [];
        const patterns = patternsRes.data || [];
        const insights = insightsRes.data || [];

        // Build candidate check-ins
        const candidates: CompanionCheckinData[] = [];

        // Memory-based references
        if (memories.length > 0) {
          const m = memories[Math.floor(Math.random() * memories.length)];
          candidates.push({
            type: "memory",
            text: language === "de"
              ? `Etwas, das du vor einiger Zeit erwähnt hast, hat mich zum Nachdenken gebracht: "${m.content}"`
              : `Something you mentioned a while ago stayed with me: "${m.content}"`,
            chatPrompt: language === "de"
              ? `Ich habe noch einmal über etwas nachgedacht, das ich dir erzählt habe: "${m.content}". Können wir darüber sprechen?`
              : `I've been thinking again about something I shared: "${m.content}". Can we talk about it?`,
          });
        }

        // Pattern-based identity reflections
        if (patterns.length > 0) {
          const p = patterns[Math.floor(Math.random() * patterns.length)];
          candidates.push({
            type: "identity",
            text: language === "de"
              ? `Mir ist aufgefallen: ${p.description}. Das sagt etwas über dich.`
              : `I've noticed something: ${p.description}. That says something about you.`,
            chatPrompt: language === "de"
              ? `Du hast bemerkt, dass ${p.description}. Kannst du mir mehr darüber erzählen?`
              : `You noticed that ${p.description}. Can you tell me more about that?`,
          });
        }

        // Insight-based follow-ups
        if (insights.length > 0) {
          const i = insights[Math.floor(Math.random() * insights.length)];
          candidates.push({
            type: "insight",
            text: language === "de"
              ? `In einem unserer letzten Gespräche kam etwas Interessantes auf: "${i.insight_text}"`
              : `Something interesting came up in one of our recent conversations: "${i.insight_text}"`,
            chatPrompt: language === "de"
              ? `Du hast diese Erkenntnis erwähnt: "${i.insight_text}". Ich möchte darüber reflektieren.`
              : `You mentioned this insight: "${i.insight_text}". I'd like to reflect on it.`,
          });
        }

        // Companion initiative (pattern-based curiosity)
        if (patterns.length >= 2) {
          candidates.push({
            type: "initiative",
            text: language === "de"
              ? `Ich habe über unsere Gespräche nachgedacht. Etwas fällt mir immer wieder auf.`
              : `I've been thinking about our conversations. Something keeps standing out.`,
            chatPrompt: language === "de"
              ? `Du hast gesagt, dir fällt etwas an unseren Gesprächen auf. Was meinst du?`
              : `You said something keeps standing out in our conversations. What do you mean?`,
          });
        }

        // Pick one randomly
        if (candidates.length > 0) {
          setCheckin(candidates[Math.floor(Math.random() * candidates.length)]);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.error("Companion checkin error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user, language, name]);

  const dismiss = () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(DAILY_KEY, today);
    setCheckin(null);
  };

  return { checkin, isLoading, dismiss };
}

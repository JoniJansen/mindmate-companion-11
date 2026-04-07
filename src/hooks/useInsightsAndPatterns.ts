import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SessionInsight {
  id: string;
  insight_text: string;
  created_at: string;
}

interface EmotionalPattern {
  id: string;
  pattern_type: string;
  description: string;
  confidence: number;
}

export function useInsightsAndPatterns() {
  const [latestInsight, setLatestInsight] = useState<SessionInsight | null>(null);
  const [insights, setInsights] = useState<SessionInsight[]>([]);
  const [patterns, setPatterns] = useState<EmotionalPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    const load = async () => {
      try {
        const [insightResult, patternResult] = await Promise.all([
          supabase
            .from("session_insights")
            .select("id, insight_text, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10) as any,
          supabase
            .from("emotional_patterns")
            .select("id, pattern_type, description, confidence")
            .eq("user_id", user.id)
            .order("confidence", { ascending: false })
            .limit(5) as any,
        ]);

        if (insightResult.data?.[0]) {
          setLatestInsight(insightResult.data[0]);
          setInsights(insightResult.data);
        }
        if (patternResult.data) {
          setPatterns(patternResult.data);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error("Load insights error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel("session-insights-home")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "session_insights",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newInsight = payload.new as SessionInsight;
        setLatestInsight(newInsight);
        setInsights(prev => [newInsight, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return {
    latestInsight,
    insights,
    insightCount: insights.length,
    patterns,
    isLoading,
  };
}

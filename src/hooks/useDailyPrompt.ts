import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

interface DailyPrompt {
  id: string;
  text: string;
  category: string;
}

export function useDailyPrompt() {
  const [prompt, setPrompt] = useState<DailyPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { language } = useTranslation();

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    const loadPrompt = async () => {
      try {
        const { data } = await supabase
          .from("daily_prompts")
          .select("id, prompt_text, prompt_text_de, category") as any;

        if (!data || data.length === 0) { setIsLoading(false); return; }

        // Pick a prompt based on day of year + user id hash for variety
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const userHash = user.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const index = (dayOfYear + userHash) % data.length;
        const selected = data[index];

        // Also consider time of day for evening prompts
        const hour = new Date().getHours();
        const eveningPrompt = data.find((p: any) => p.category === "evening");
        const useEvening = hour >= 21 && eveningPrompt;

        const chosen = useEvening ? eveningPrompt : selected;

        setPrompt({
          id: chosen.id,
          text: language === "de" ? chosen.prompt_text_de : chosen.prompt_text,
          category: chosen.category,
        });
      } catch (error) {
        if (import.meta.env.DEV) console.error("Load daily prompt error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrompt();
  }, [user, language]);

  return { prompt, isLoading };
}

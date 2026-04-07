import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MemoryMoment {
  id: string;
  content: string;
  memory_type: string;
  created_at: string;
  confidence_score: number;
}

const SESSION_KEY = "soulvay-memory-moment-shown";

export function useMemoryMoments() {
  const [moment, setMoment] = useState<MemoryMoment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    // Only show once per session
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown) { setIsLoading(false); return; }

    const load = async () => {
      try {
        // Get memories older than 7 days with high confidence
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from("user_memories")
          .select("id, content, memory_type, created_at, confidence_score")
          .eq("user_id", user.id)
          .lt("created_at", sevenDaysAgo)
          .gte("confidence_score", 0.7)
          .order("confidence_score", { ascending: false })
          .limit(5);

        if (data && data.length > 0) {
          // Pick a random one from top 5 for variety
          const picked = data[Math.floor(Math.random() * data.length)];
          setMoment(picked);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.error("Memory moments error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user]);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setMoment(null);
  };

  const startConversation = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
  };

  return { moment, isLoading, dismiss, startConversation };
}

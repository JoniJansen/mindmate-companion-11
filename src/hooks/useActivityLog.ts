import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ActivityType = "mood_checkin" | "journal_entry" | "exercise_completed" | "chat_session";

/**
 * Logs one activity per type per day (upsert via ON CONFLICT).
 * Call this from Mood, Journal, Toolbox, and Chat flows.
 */
export function useActivityLog() {
  const { user } = useAuth();

  const logActivity = useCallback(async (type: ActivityType) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      await supabase
        .from("user_activity_log")
        .upsert(
          {
            user_id: user.id,
            activity_date: today,
            activity_type: type,
          },
          { onConflict: "user_id,activity_date,activity_type" }
        );
    } catch (e) {
      // Silent — streak logging is non-critical
      console.warn("Activity log failed:", e);
    }
  }, [user]);

  return { logActivity };
}

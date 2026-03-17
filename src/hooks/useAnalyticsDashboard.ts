import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FunnelData {
  period_days: number;
  since: string;
  total_users: number;
  unique_sessions: number;
  active_subscriptions: number;
  funnel: Record<string, number>;
}

interface DailyData {
  daily: Record<string, Record<string, number>>;
}

export function useAnalyticsDashboard() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFunnel = useCallback(async (days = 30) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("analytics-dashboard", {
        body: { action: "funnel", days },
      });
      if (fnErr) throw fnErr;
      setFunnelData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDaily = useCallback(async (days = 30) => {
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("analytics-dashboard", {
        body: { action: "daily", days },
      });
      if (fnErr) throw fnErr;
      setDailyData(data);
    } catch { /* silent */ }
  }, []);

  return { funnelData, dailyData, isLoading, error, fetchFunnel, fetchDaily };
}

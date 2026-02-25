import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  isLoading: boolean;
  weeklyStats: {
    activeDays: number;
    moodCheckins: number;
    journalEntries: number;
    exercisesCompleted: number;
    chatSessions: number;
  };
  lastWeekActiveDays: number;
  milestoneReached: number | null; // If a new milestone was just hit
  refresh: () => void;
}

const MILESTONES = [3, 7, 14, 30, 60, 100];

export function useStreak(): StreakData {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [isActiveToday, setIsActiveToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState({
    activeDays: 0,
    moodCheckins: 0,
    journalEntries: 0,
    exercisesCompleted: 0,
    chatSessions: 0,
  });
  const [lastWeekActiveDays, setLastWeekActiveDays] = useState(0);
  const [milestoneReached, setMilestoneReached] = useState<number | null>(null);

  const calculateStreak = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch last 120 days of activity (distinct dates)
      const since = new Date();
      since.setDate(since.getDate() - 120);

      const { data, error } = await supabase
        .from("user_activity_log")
        .select("activity_date, activity_type")
        .eq("user_id", user.id)
        .gte("activity_date", since.toISOString().split("T")[0])
        .order("activity_date", { ascending: false });

      if (error) throw error;

      const rows = data || [];

      // Get unique active dates
      const activeDatesSet = new Set(rows.map(r => r.activity_date));
      const activeDates = Array.from(activeDatesSet).sort().reverse(); // newest first

      // Today check — use local device date
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const todayActive = activeDatesSet.has(today);
      setIsActiveToday(todayActive);

      // Calculate current streak
      let streak = 0;
      const checkDate = new Date();
      // If not active today, start checking from yesterday
      if (!todayActive) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const dateStr = checkDate.toISOString().split("T")[0];
        if (activeDatesSet.has(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      setCurrentStreak(streak);

      // Calculate longest streak
      let longest = 0;
      let tempStreak = 0;
      const sortedDates = Array.from(activeDatesSet).sort();
      
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prev = new Date(sortedDates[i - 1]);
          const curr = new Date(sortedDates[i]);
          const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
          tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
        }
        longest = Math.max(longest, tempStreak);
      }
      setLongestStreak(longest);

      // Check milestone
      const prevStreak = streak - (todayActive ? 1 : 0);
      const newMilestone = MILESTONES.find(m => streak >= m && prevStreak < m);
      setMilestoneReached(newMilestone || null);

      // Weekly stats (this week: last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split("T")[0];

      const thisWeekRows = rows.filter(r => r.activity_date >= weekAgoStr);
      const thisWeekDates = new Set(thisWeekRows.map(r => r.activity_date));

      setWeeklyStats({
        activeDays: thisWeekDates.size,
        moodCheckins: thisWeekRows.filter(r => r.activity_type === "mood_checkin").length,
        journalEntries: thisWeekRows.filter(r => r.activity_type === "journal_entry").length,
        exercisesCompleted: thisWeekRows.filter(r => r.activity_type === "exercise_completed").length,
        chatSessions: thisWeekRows.filter(r => r.activity_type === "chat_session").length,
      });

      // Last week stats (7-14 days ago)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split("T")[0];

      const lastWeekRows = rows.filter(r => r.activity_date >= twoWeeksAgoStr && r.activity_date < weekAgoStr);
      const lastWeekDates = new Set(lastWeekRows.map(r => r.activity_date));
      setLastWeekActiveDays(lastWeekDates.size);

    } catch (e) {
      console.warn("Streak calculation failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    calculateStreak();
  }, [calculateStreak]);

  return {
    currentStreak,
    longestStreak,
    isActiveToday,
    isLoading,
    weeklyStats,
    lastWeekActiveDays,
    milestoneReached,
    refresh: calculateStreak,
  };
}

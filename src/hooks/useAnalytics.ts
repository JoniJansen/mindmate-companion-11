import { useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Event types for tracking
export type AnalyticsEvent =
  | "page_view"
  | "chat_message_sent"
  | "journal_entry_created"
  | "mood_checkin_completed"
  | "exercise_started"
  | "exercise_completed"
  | "topic_started"
  | "weekly_recap_generated"
  | "voice_mode_enabled"
  | "theme_changed"
  | "language_changed"
  | "signup_completed"
  | "login_completed"
  | "upgrade_clicked"
  | "app_installed";

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

// Simple in-memory analytics store (sends to console in dev, could be extended to send to a backend)
class Analytics {
  private events: Array<{ event: AnalyticsEvent; properties: EventProperties; timestamp: Date }> = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem("analytics_session_id");
    if (stored) return stored;
    
    const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("analytics_session_id", newId);
    return newId;
  }

  track(event: AnalyticsEvent, properties: EventProperties = {}) {
    const eventData = {
      event,
      properties: {
        ...properties,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        url: window.location.pathname,
        referrer: document.referrer || undefined,
      },
      timestamp: new Date(),
    };

    this.events.push(eventData);

    // Log in development
    if (import.meta.env.DEV) {
      console.log("📊 Analytics:", event, properties);
    }

    // Store in localStorage for persistence
    this.persistEvents();
  }

  private persistEvents() {
    try {
      const stored = localStorage.getItem("mindmate_analytics") || "[]";
      const existingEvents = JSON.parse(stored);
      
      // Keep last 100 events
      const allEvents = [...existingEvents, ...this.events.slice(-10)].slice(-100);
      localStorage.setItem("mindmate_analytics", JSON.stringify(allEvents));
      
      this.events = [];
    } catch {
      // Ignore storage errors
    }
  }

  getStoredEvents() {
    try {
      return JSON.parse(localStorage.getItem("mindmate_analytics") || "[]");
    } catch {
      return [];
    }
  }

  async getSessionStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const [moodResult, journalResult, recapResult] = await Promise.all([
      supabase.from("mood_checkins").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("journal_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("weekly_recaps").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    return {
      moodCheckins: moodResult.count || 0,
      journalEntries: journalResult.count || 0,
      weeklyRecaps: recapResult.count || 0,
    };
  }
}

// Singleton instance
const analytics = new Analytics();

// React hook for analytics
export function useAnalytics() {
  const location = useLocation();

  // Track page views automatically
  useEffect(() => {
    analytics.track("page_view", {
      path: location.pathname,
    });
  }, [location.pathname]);

  const track = useCallback((event: AnalyticsEvent, properties?: EventProperties) => {
    analytics.track(event, properties || {});
  }, []);

  const getStats = useCallback(async () => {
    return analytics.getSessionStats();
  }, []);

  return { track, getStats };
}

// Export for direct usage
export { analytics };

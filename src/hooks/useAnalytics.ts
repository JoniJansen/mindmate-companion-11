import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Check if analytics is allowed by cookie consent
function isAnalyticsAllowed(): boolean {
  try {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) return false;
    const parsed = JSON.parse(consent);
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

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
  | "upgrade_view"
  | "purchase_completed"
  | "purchase_failed"
  | "restore_completed"
  | "delete_account"
  | "crisis_resource_viewed"
  | "onboarding_completed"
  | "onboarding_started"
  | "onboarding_step_completed"
  | "companion_selected"
  | "chat_error"
  | "app_installed"
  // Demo chat
  | "demo_chat_started"
  | "demo_chat_message_sent"
  | "demo_chat_limit_reached"
  | "demo_chat_converted"
  | "landing_demo_started"
  | "landing_demo_message_sent"
  | "landing_demo_limit_reached"
  | "landing_demo_signup_clicked"
  // Chat
  | "first_chat_sent"
  | "chat_limit_approaching"
  | "chat_limit_reached"
  // Voice
  | "voice_trial_prompt_shown"
  | "voice_trial_entry_clicked"
  | "voice_trial_started"
  | "voice_trial_completed"
  // Premium
  | "premium_cta_viewed"
  | "premium_cta_clicked"
  | "premium_subscribed"
  | "paywall_viewed"
  // Insights
  | "insight_preview_shown"
  | "insight_unlock_clicked"
  // Retention bridges
  | "mood_logged"
  | "mood_to_chat_prompt_shown"
  | "mood_to_chat_clicked"
  | "journal_saved"
  | "journal_to_chat_prompt_shown"
  | "journal_to_chat_clicked"
  | "morning_prompt_viewed"
  | "morning_prompt_clicked"
  | "evening_prompt_viewed"
  | "evening_prompt_clicked"
  | "bond_milestone_seen"
  | "returning_user_detected"
  | "return_state_shown"
  | "chat_saved_to_journal";

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

// Simple in-memory analytics store
class Analytics {
  private events: Array<{ event: AnalyticsEvent; properties: EventProperties; timestamp: Date }> = [];
  private sessionId: string;
  private firedOnce = new Set<string>();

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

  /**
   * Track an event. Safe to call anywhere — fails silently.
   * @param dedupeKey Optional key to prevent duplicate fires (e.g. "voice_trial_prompt_shown")
   */
  track(event: AnalyticsEvent, properties: EventProperties = {}, dedupeKey?: string) {
    try {
      // Deduplication guard
      if (dedupeKey) {
        if (this.firedOnce.has(dedupeKey)) return;
        this.firedOnce.add(dedupeKey);
      }

      // GDPR consent check (page_view always allowed)
      if (!isAnalyticsAllowed() && event !== "page_view") {
        if (import.meta.env.DEV) {
          console.log("[Analytics] blocked (no consent):", event);
        }
        return;
      }

      const eventData = {
        event,
        properties: {
          ...properties,
          session_id: this.sessionId,
          timestamp: new Date().toISOString(),
          url: window.location.pathname,
          referrer: document.referrer || undefined,
          consent_given: isAnalyticsAllowed(),
        },
        timestamp: new Date(),
      };

      this.events.push(eventData);

      if (import.meta.env.DEV) {
        console.log("[Analytics]", event, properties);
      }

      this.persistEvents();
    } catch {
      // Fail silently — never break UI
    }
  }

  /** Reset session dedup keys (e.g. on navigation) */
  resetDedup() {
    this.firedOnce.clear();
  }

  private persistEvents() {
    try {
      const stored = localStorage.getItem("soulvay_analytics") || "[]";
      const existingEvents = JSON.parse(stored);
      const allEvents = [...existingEvents, ...this.events.slice(-10)].slice(-100);
      localStorage.setItem("soulvay_analytics", JSON.stringify(allEvents));
      this.events = [];
    } catch {
      // Ignore storage errors
    }
  }

  getStoredEvents() {
    try {
      return JSON.parse(localStorage.getItem("soulvay_analytics") || "[]");
    } catch {
      return [];
    }
  }

  async getSessionStats() {
    try {
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
    } catch {
      return null;
    }
  }
}

// Singleton instance
const analytics = new Analytics();

// React hook for analytics
export function useAnalytics() {
  const location = useLocation();

  // Track page views automatically & reset dedup on route change
  useEffect(() => {
    analytics.resetDedup();
    analytics.track("page_view", { path: location.pathname });
  }, [location.pathname]);

  const track = useCallback((event: AnalyticsEvent, properties?: EventProperties, dedupeKey?: string) => {
    analytics.track(event, properties || {}, dedupeKey);
  }, []);

  /**
   * Track an event only once per session (uses event name as dedup key).
   */
  const trackOnce = useCallback((event: AnalyticsEvent, properties?: EventProperties) => {
    analytics.track(event, properties || {}, event);
  }, []);

  const getStats = useCallback(async () => {
    return analytics.getSessionStats();
  }, []);

  return { track, trackOnce, getStats };
}

// Export for direct usage (non-hook contexts)
export { analytics };

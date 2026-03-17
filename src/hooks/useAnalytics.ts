import { useCallback, useEffect } from "react";
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
  | "demo_chat_started"
  | "demo_chat_message_sent"
  | "demo_chat_limit_reached"
  | "demo_chat_converted"
  | "landing_demo_started"
  | "landing_demo_message_sent"
  | "landing_demo_limit_reached"
  | "landing_demo_signup_clicked"
  | "first_chat_sent"
  | "chat_limit_approaching"
  | "chat_limit_reached"
  | "voice_trial_prompt_shown"
  | "voice_trial_entry_clicked"
  | "voice_trial_started"
  | "voice_trial_completed"
  | "premium_cta_viewed"
  | "premium_cta_clicked"
  | "premium_subscribed"
  | "paywall_viewed"
  | "insight_preview_shown"
  | "insight_unlock_clicked"
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
  | "chat_saved_to_journal"
  | "demo_chat_google_signup_clicked"
  | "demo_chat_apple_signup_clicked"
  | "demo_conversation_continued";

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

interface QueuedEvent {
  event_name: AnalyticsEvent;
  session_id: string;
  payload: EventProperties;
  ts: number;
}

const FLUSH_INTERVAL_MS = 15_000;
const MAX_BATCH_SIZE = 25;
const MAX_RETRIES = 2;
const QUEUE_KEY = "soulvay_eq";

class Analytics {
  private queue: QueuedEvent[] = [];
  private sessionId: string;
  private firedOnce = new Set<string>();
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.loadQueue();
    this.startFlushTimer();
    this.setupUnloadFlush();
  }

  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem("analytics_session_id");
    if (stored) return stored;
    const newId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("analytics_session_id", newId);
    return newId;
  }

  private loadQueue() {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) {
        this.queue = JSON.parse(raw);
      }
    } catch {
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      // Keep max 200 events in queue to prevent storage bloat
      const trimmed = this.queue.slice(-200);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
    } catch { /* ignore */ }
  }

  track(event: AnalyticsEvent, properties: EventProperties = {}, dedupeKey?: string) {
    try {
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

      const queuedEvent: QueuedEvent = {
        event_name: event,
        session_id: this.sessionId,
        payload: {
          ...properties,
          url: window.location.pathname,
          referrer: document.referrer || undefined,
        },
        ts: Date.now(),
      };

      this.queue.push(queuedEvent);

      if (import.meta.env.DEV) {
        console.log("[Analytics]", event, properties);
      }

      this.saveQueue();

      // Auto-flush if batch is large enough
      if (this.queue.length >= MAX_BATCH_SIZE) {
        this.flush();
      }
    } catch {
      // Fail silently
    }
  }

  resetDedup() {
    this.firedOnce.clear();
  }

  private startFlushTimer() {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  private setupUnloadFlush() {
    if (typeof window === "undefined") return;
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flushSync();
      }
    });
  }

  /** Best-effort sync flush using sendBeacon for page unload */
  private flushSync() {
    if (this.queue.length === 0) return;
    try {
      const batch = this.queue.splice(0, MAX_BATCH_SIZE);
      this.saveQueue();

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-event`;
      const body = JSON.stringify({ events: batch.map(e => ({ event_name: e.event_name, session_id: e.session_id, payload: e.payload })) });

      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      }
    } catch { /* best effort */ }
  }

  async flush(retryCount = 0) {
    if (this.flushing || this.queue.length === 0) return;
    this.flushing = true;

    const batch = this.queue.splice(0, MAX_BATCH_SIZE);
    this.saveQueue();

    try {
      const { error } = await supabase.functions.invoke("track-event", {
        body: {
          events: batch.map(e => ({
            event_name: e.event_name,
            session_id: e.session_id,
            payload: e.payload,
          })),
        },
      });

      if (error && retryCount < MAX_RETRIES) {
        // Put events back and retry
        this.queue.unshift(...batch);
        this.saveQueue();
        this.flushing = false;
        setTimeout(() => this.flush(retryCount + 1), 3000 * (retryCount + 1));
        return;
      }
    } catch {
      if (retryCount < MAX_RETRIES) {
        this.queue.unshift(...batch);
        this.saveQueue();
        this.flushing = false;
        setTimeout(() => this.flush(retryCount + 1), 3000 * (retryCount + 1));
        return;
      }
      // After max retries, events are dropped — acceptable tradeoff
    }

    this.flushing = false;

    // If more events remain, flush again
    if (this.queue.length > 0) {
      setTimeout(() => this.flush(), 500);
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

// Singleton
const analytics = new Analytics();

export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    analytics.resetDedup();
    analytics.track("page_view", { path: location.pathname });
  }, [location.pathname]);

  const track = useCallback((event: AnalyticsEvent, properties?: EventProperties, dedupeKey?: string) => {
    analytics.track(event, properties || {}, dedupeKey);
  }, []);

  const trackOnce = useCallback((event: AnalyticsEvent, properties?: EventProperties) => {
    analytics.track(event, properties || {}, event);
  }, []);

  const getStats = useCallback(async () => {
    return analytics.getSessionStats();
  }, []);

  return { track, trackOnce, getStats };
}

export { analytics };

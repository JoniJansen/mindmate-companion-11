/**
 * Migrates legacy "mindmate-*" localStorage keys to "soulvay-*" equivalents.
 * Reads old keys, copies values to new keys (if new key doesn't already exist),
 * then removes old keys. Safe to call multiple times (idempotent).
 */

const MIGRATION_DONE_KEY = "soulvay_ls_migration_v1";

const KEY_MAP: Record<string, string> = {
  "mindmate-preferences": "soulvay-preferences",
  "mindmate-chat-mode": "soulvay-chat-mode",
  "mindmate-premium-state": "soulvay-premium-state",
  "mindmate-topic-progress": "soulvay-topic-progress",
  "mindmate-topic-notes": "soulvay-topic-notes",
  "mindmate_tour_completed": "soulvay_tour_completed",
  "mindmate_onboarding_completed": "soulvay_onboarding_completed",
  "mindmate_tab_hints_seen": "soulvay_tab_hints_seen",
  "mindmate_tour_auto_triggered": "soulvay_tour_auto_triggered",
  "mindmate_tab_hints_seen": "soulvay_tab_hints_seen",
  "mindmate_notification_settings": "soulvay_notification_settings",
  "mindmate_notification_permission": "soulvay_notification_permission",
  "mindmate_last_notification": "soulvay_last_notification",
  "mindmate_today_active": "soulvay_today_active",
  "mindmate_ios_auto_restored": "soulvay_ios_auto_restored",
  "mindmate-dev-entitlement-sim": "soulvay-dev-entitlement-sim",
  // Additional keys discovered in audit
  "mindmate-voice-settings": "soulvay-voice-settings",
  "mindmate-swipe-hint-shown": "soulvay-swipe-hint-shown",
  "mindmate-last-export": "soulvay-last-export",
  "mindmate-backup-interval": "soulvay-backup-interval",
  "mindmate-moods": "soulvay-moods",
  "mindmate-completed-exercises": "soulvay-completed-exercises",
  "mindmate-chat-messages": "soulvay-chat-messages",
  "mindmate-weekly-recap": "soulvay-weekly-recap",
  "mindmate-theme": "soulvay-theme",
  "mindmate-initial-message": "soulvay-initial-message",
  "mindmate_review_mode": "soulvay_review_mode",
};

export function migrateLegacyKeys(): void {
  try {
    if (localStorage.getItem(MIGRATION_DONE_KEY)) return;

    for (const [oldKey, newKey] of Object.entries(KEY_MAP)) {
      const oldValue = localStorage.getItem(oldKey);
      if (oldValue !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, oldValue);
      }
      // Keep old keys for now — remove in a future version
    }

    localStorage.setItem(MIGRATION_DONE_KEY, "1");
  } catch {
    // Storage unavailable — ignore
  }
}

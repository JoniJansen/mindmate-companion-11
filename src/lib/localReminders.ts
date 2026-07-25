/**
 * Native bridge for scheduled local reminder notifications (iOS/Android).
 *
 * The plugin is imported dynamically so the web bundle never loads it and
 * unit tests (jsdom) never touch native code. Every function is defensive:
 * notifications are a nice-to-have and must never break the app.
 *
 * Android notes:
 * - POST_NOTIFICATIONS / RECEIVE_BOOT_COMPLETED / WAKE_LOCK are merged in
 *   from the plugin's own AndroidManifest — no app-manifest changes needed.
 * - We deliberately do NOT request SCHEDULE_EXACT_ALARM: without it the
 *   plugin falls back to inexact alarms (setAndAllowWhileIdle), which is
 *   plenty for wellness reminders and avoids Play Store review friction.
 */
import type { ScheduleOn } from "@capacitor/local-notifications";
import { ALL_REMINDER_IDS, type ReminderScheduleSpec } from "@/lib/notificationSchedule";

/** Web-Notification-API compatible permission state used by the settings UI. */
export type ReminderPermission = "default" | "granted" | "denied";

async function getPlugin() {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

function mapPermission(state: string | undefined): ReminderPermission {
  if (state === "granted") return "granted";
  if (state === "denied") return "denied";
  return "default";
}

export async function checkNativeNotificationPermission(): Promise<ReminderPermission> {
  try {
    const plugin = await getPlugin();
    const { display } = await plugin.checkPermissions();
    return mapPermission(display);
  } catch {
    return "default";
  }
}

export async function requestNativeNotificationPermission(): Promise<ReminderPermission> {
  try {
    const plugin = await getPlugin();
    const { display } = await plugin.requestPermissions();
    return mapPermission(display);
  } catch {
    return "denied";
  }
}

export async function cancelAllNativeReminders(): Promise<void> {
  try {
    const plugin = await getPlugin();
    await plugin.cancel({ notifications: ALL_REMINDER_IDS.map((id) => ({ id })) });
  } catch {
    // Cancelling notifications that were never scheduled must never throw upstream.
  }
}

export interface NativeReminderItem {
  spec: ReminderScheduleSpec;
  title: string;
  body: string;
}

/**
 * Replaces all Soulvay reminders with the given repeating schedules.
 * Idempotent: fixed IDs mean re-scheduling overwrites previous reminders.
 */
export async function syncNativeReminders(items: NativeReminderItem[]): Promise<void> {
  try {
    const plugin = await getPlugin();
    await plugin.cancel({ notifications: ALL_REMINDER_IDS.map((id) => ({ id })) });

    if (items.length === 0) return;

    await plugin.schedule({
      notifications: items.map(({ spec, title, body }) => ({
        id: spec.id,
        title,
        body,
        schedule: {
          on: spec.on as ScheduleOn,
          // Fires during Doze maintenance windows; still inexact without
          // SCHEDULE_EXACT_ALARM (see module docs) — intentional.
          allowWhileIdle: true,
        },
      })),
    });
  } catch {
    // Reminders are progressive enhancement — never break settings UI.
  }
}

/** Immediately shows a one-off notification (used by the settings test button). */
export async function showNativeNotification(title: string, body: string): Promise<void> {
  try {
    const plugin = await getPlugin();
    await plugin.schedule({
      notifications: [
        {
          // One-off test id outside the reminder range so it never collides.
          id: 90099,
          title,
          body,
          schedule: { at: new Date(Date.now() + 500) },
        },
      ],
    });
  } catch {
    // Never break the app for a test notification.
  }
}

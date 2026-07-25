/**
 * Pure scheduling math for local reminder notifications.
 *
 * No Capacitor imports here on purpose: everything in this module is a pure
 * function of (settings, Date) so it can be unit-tested without native mocks.
 *
 * Timezone semantics: all calculations use LOCAL wall-clock time (Date
 * getters/setters), matching how Capacitor's `schedule.on` triggers fire
 * (UNCalendarNotificationTrigger on iOS, DateMatch on Android — both local).
 * A "20:00" reminder therefore stays at 20:00 local time across DST changes
 * and travel; the OS re-evaluates the match in the device's current timezone.
 */

/** Fixed notification IDs so reminders can be cancelled/replaced idempotently. */
export const REMINDER_IDS = {
  daily: 90001,
  mood: 90002,
  weekly: 90003,
} as const;

export const ALL_REMINDER_IDS: number[] = Object.values(REMINDER_IDS);

/** Existing product behavior: the weekly recap fires at 10:00 local time. */
export const WEEKLY_RECAP_TIME = "10:00";

const DEFAULT_TIME = { hour: 20, minute: 0 };

/** Parses "HH:MM" defensively; falls back to 20:00 on malformed input. */
export function parseTimeString(time: string): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec((time ?? "").trim());
  if (!match) return { ...DEFAULT_TIME };

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) {
    return { ...DEFAULT_TIME };
  }
  return { hour, minute };
}

/**
 * Maps our settings weekday (0 = Sunday … 6 = Saturday, JS `getDay()` order)
 * to Capacitor's `Weekday` enum (1 = Sunday … 7 = Saturday).
 */
export function toCapacitorWeekday(day: number): number {
  const normalized = ((Math.trunc(day) % 7) + 7) % 7;
  return normalized + 1;
}

/** Next occurrence of a daily HH:MM reminder (today if still ahead, else tomorrow). */
export function nextDailyOccurrence(now: Date, time: string): Date {
  const { hour, minute } = parseTimeString(time);
  const next = new Date(now.getTime());
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * Next occurrence of a weekly reminder.
 * @param weekday 0 = Sunday … 6 = Saturday (JS `getDay()` order)
 */
export function nextWeeklyOccurrence(now: Date, weekday: number, time: string): Date {
  const { hour, minute } = parseTimeString(time);
  const target = ((Math.trunc(weekday) % 7) + 7) % 7;

  const next = new Date(now.getTime());
  next.setHours(hour, minute, 0, 0);

  let dayDiff = (target - now.getDay() + 7) % 7;
  if (dayDiff === 0 && next.getTime() <= now.getTime()) {
    dayDiff = 7;
  }
  next.setDate(next.getDate() + dayDiff);
  return next;
}

export type ReminderKind = "daily" | "mood" | "weekly";

export interface ReminderScheduleSpec {
  id: number;
  kind: ReminderKind;
  /** Capacitor `ScheduleOn` match — weekday uses 1 = Sunday … 7 = Saturday. */
  on: { hour: number; minute: number; weekday?: number };
}

export interface ReminderSettingsInput {
  enabled: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string;
  weeklyRecap: boolean;
  weeklyRecapDay: number;
  moodReminder: boolean;
  moodReminderTime: string;
}

/**
 * Builds the repeating native schedules for the current settings.
 * Returns an empty array when notifications are disabled entirely.
 */
export function buildReminderSchedules(settings: ReminderSettingsInput): ReminderScheduleSpec[] {
  if (!settings.enabled) return [];

  const specs: ReminderScheduleSpec[] = [];

  if (settings.dailyReminder) {
    const { hour, minute } = parseTimeString(settings.dailyReminderTime);
    specs.push({ id: REMINDER_IDS.daily, kind: "daily", on: { hour, minute } });
  }

  if (settings.moodReminder) {
    const { hour, minute } = parseTimeString(settings.moodReminderTime);
    specs.push({ id: REMINDER_IDS.mood, kind: "mood", on: { hour, minute } });
  }

  if (settings.weeklyRecap) {
    const { hour, minute } = parseTimeString(WEEKLY_RECAP_TIME);
    specs.push({
      id: REMINDER_IDS.weekly,
      kind: "weekly",
      on: { hour, minute, weekday: toCapacitorWeekday(settings.weeklyRecapDay) },
    });
  }

  return specs;
}

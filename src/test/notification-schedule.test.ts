import { describe, it, expect } from "vitest";
import {
  buildReminderSchedules,
  nextDailyOccurrence,
  nextWeeklyOccurrence,
  parseTimeString,
  toCapacitorWeekday,
  REMINDER_IDS,
  type ReminderSettingsInput,
} from "@/lib/notificationSchedule";

/**
 * All dates are constructed with the local-time Date constructor and asserted
 * via local getters, so the tests are timezone-agnostic (CI vs. dev machine).
 * 2026-07-25 is a Saturday (getDay() === 6).
 */

const allOn: ReminderSettingsInput = {
  enabled: true,
  dailyReminder: true,
  dailyReminderTime: "20:00",
  weeklyRecap: true,
  weeklyRecapDay: 0, // Sunday (JS getDay order)
  moodReminder: true,
  moodReminderTime: "19:00",
};

describe("nextDailyOccurrence", () => {
  it("stays on the same day when the reminder time is still ahead", () => {
    const now = new Date(2026, 6, 25, 9, 0); // Sat 09:00 local
    const next = nextDailyOccurrence(now, "20:00");
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(6);
    expect(next.getDate()).toBe(25);
    expect(next.getHours()).toBe(20);
    expect(next.getMinutes()).toBe(0);
  });

  it("rolls to the next day when the time has already passed (incl. month boundary)", () => {
    const now = new Date(2026, 6, 31, 21, 30); // Fri Jul 31, 21:30 local
    const next = nextDailyOccurrence(now, "20:00");
    expect(next.getMonth()).toBe(7); // August
    expect(next.getDate()).toBe(1);
    expect(next.getHours()).toBe(20);
  });

  it("falls back to 20:00 on malformed time input instead of throwing", () => {
    expect(parseTimeString("not-a-time")).toEqual({ hour: 20, minute: 0 });
    expect(parseTimeString("25:99")).toEqual({ hour: 20, minute: 0 });
    const now = new Date(2026, 6, 25, 9, 0);
    const next = nextDailyOccurrence(now, "garbage");
    expect(next.getHours()).toBe(20);
    expect(next.getDate()).toBe(25);
  });
});

describe("nextWeeklyOccurrence", () => {
  it("finds the next target weekday (Sat now → Sun 10:00 is tomorrow)", () => {
    const now = new Date(2026, 6, 25, 12, 0); // Saturday noon
    const next = nextWeeklyOccurrence(now, 0, "10:00"); // Sunday
    expect(next.getDay()).toBe(0);
    expect(next.getDate()).toBe(26);
    expect(next.getHours()).toBe(10);
  });

  it("rolls a full week when target weekday is today but the time already passed", () => {
    const now = new Date(2026, 6, 25, 12, 0); // Saturday noon
    const next = nextWeeklyOccurrence(now, 6, "10:00"); // Saturday 10:00 → next week
    expect(next.getDay()).toBe(6);
    expect(next.getDate()).toBe(1); // Sat Aug 1
    expect(next.getMonth()).toBe(7);
    expect(next.getHours()).toBe(10);
  });

  it("keeps today when target weekday is today and the time is still ahead", () => {
    const now = new Date(2026, 6, 25, 8, 0); // Saturday 08:00
    const next = nextWeeklyOccurrence(now, 6, "10:00");
    expect(next.getDate()).toBe(25);
    expect(next.getHours()).toBe(10);
  });
});

describe("buildReminderSchedules", () => {
  it("builds all three specs with correct ids, times and Capacitor weekday mapping", () => {
    const specs = buildReminderSchedules(allOn);
    expect(specs).toHaveLength(3);

    const daily = specs.find((s) => s.kind === "daily");
    expect(daily).toEqual({ id: REMINDER_IDS.daily, kind: "daily", on: { hour: 20, minute: 0 } });

    const mood = specs.find((s) => s.kind === "mood");
    expect(mood).toEqual({ id: REMINDER_IDS.mood, kind: "mood", on: { hour: 19, minute: 0 } });

    const weekly = specs.find((s) => s.kind === "weekly");
    // Settings Sunday=0 → Capacitor Weekday Sunday=1; recap fires at 10:00.
    expect(weekly).toEqual({
      id: REMINDER_IDS.weekly,
      kind: "weekly",
      on: { hour: 10, minute: 0, weekday: 1 },
    });
  });

  it("omits disabled reminders and returns nothing when notifications are off", () => {
    expect(buildReminderSchedules({ ...allOn, enabled: false })).toEqual([]);

    const noMood = buildReminderSchedules({ ...allOn, moodReminder: false });
    expect(noMood.map((s) => s.kind).sort()).toEqual(["daily", "weekly"]);

    const onlyWeekly = buildReminderSchedules({
      ...allOn,
      dailyReminder: false,
      moodReminder: false,
      weeklyRecapDay: 6, // Saturday
    });
    expect(onlyWeekly).toHaveLength(1);
    expect(onlyWeekly[0].on.weekday).toBe(7); // Saturday=6 → Capacitor 7
  });

  it("maps all settings weekdays to the Capacitor 1–7 range", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(toCapacitorWeekday)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

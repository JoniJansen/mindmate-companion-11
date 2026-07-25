import { useState, useEffect, useCallback, useRef } from "react";
import { isNativeApp } from "@/lib/nativeDetect";
import { buildReminderSchedules, type ReminderKind } from "@/lib/notificationSchedule";
import {
  cancelAllNativeReminders,
  checkNativeNotificationPermission,
  requestNativeNotificationPermission,
  showNativeNotification,
  syncNativeReminders,
  type NativeReminderItem,
} from "@/lib/localReminders";

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string; // HH:MM format
  weeklyRecap: boolean;
  weeklyRecapDay: number; // 0 = Sunday, 6 = Saturday
  moodReminder: boolean; // Premium feature
  moodReminderTime: string;
}

const NOTIFICATION_SETTINGS_KEY = "soulvay_notification_settings";
const NOTIFICATION_PERMISSION_KEY = "soulvay_notification_permission";
const LAST_NOTIFICATION_KEY = "soulvay_last_notification";

const defaultSettings: NotificationSettings = {
  enabled: false,
  dailyReminder: true,
  dailyReminderTime: "20:00",
  weeklyRecap: true,
  weeklyRecapDay: 0, // Sunday
  moodReminder: false,
  moodReminderTime: "19:00",
};

export function usePushNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const schedulerRef = useRef<NodeJS.Timeout | null>(null);
  const isNative = isNativeApp();

  // Check if notifications are supported
  useEffect(() => {
    if (isNative) {
      // Native (iOS/Android): scheduled local notifications via Capacitor.
      setIsSupported(true);
      let cancelled = false;
      checkNativeNotificationPermission().then((status) => {
        if (!cancelled) setPermissionStatus(status);
      });

      // Load saved settings
      const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(saved) });
        } catch {
          // Use defaults
        }
      }
      return () => {
        cancelled = true;
      };
    }

    const supported = "Notification" in window && "serviceWorker" in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermissionStatus(Notification.permission);
    }

    // Load saved settings
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch {
        // Use defaults
      }
    }
  }, [isNative]);

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Reminder scheduling
  // - Native: repeating OS-level local notifications — they fire even when
  //   the app is closed. Fixed IDs make re-scheduling idempotent.
  // - Web fallback: minute-interval checker while the app is open (unchanged).
  useEffect(() => {
    if (isNative) {
      if (!settings.enabled || permissionStatus !== "granted") {
        cancelAllNativeReminders();
        return;
      }

      const lang = getStoredLanguage();
      const items: NativeReminderItem[] = buildReminderSchedules(settings).map((spec) => ({
        spec,
        ...pickReminderContent(spec.kind, lang),
      }));
      // The streak "at risk" nudge stays web-only: it depends on same-day
      // activity, which a pre-scheduled OS notification cannot know.
      syncNativeReminders(items);
      return;
    }

    if (!settings.enabled || permissionStatus !== "granted") {
      if (schedulerRef.current) {
        clearInterval(schedulerRef.current);
        schedulerRef.current = null;
      }
      return;
    }

    const checkAndSendNotifications = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const today = now.toDateString();
      const lastNotification = localStorage.getItem(LAST_NOTIFICATION_KEY);
      const lastData = lastNotification ? JSON.parse(lastNotification) : {};

      // Mood Reminder (Premium)
      if (settings.moodReminder && currentTime === settings.moodReminderTime) {
        const moodKey = `mood_${today}`;
        if (!lastData[moodKey]) {
          sendMoodReminder();
          lastData[moodKey] = true;
          localStorage.setItem(LAST_NOTIFICATION_KEY, JSON.stringify(lastData));
        }
      }

      // Daily Reminder
      if (settings.dailyReminder && currentTime === settings.dailyReminderTime) {
        const dailyKey = `daily_${today}`;
        if (!lastData[dailyKey]) {
          sendDailyReminder();
          lastData[dailyKey] = true;
          localStorage.setItem(LAST_NOTIFICATION_KEY, JSON.stringify(lastData));
        }
      }

      // Weekly Recap (check day of week)
      if (settings.weeklyRecap && now.getDay() === settings.weeklyRecapDay && currentTime === "10:00") {
        const weeklyKey = `weekly_${today}`;
        if (!lastData[weeklyKey]) {
          sendWeeklyRecapReminder();
          lastData[weeklyKey] = true;
          localStorage.setItem(LAST_NOTIFICATION_KEY, JSON.stringify(lastData));
        }
      }

      // Smart: Streak at risk (evening nudge if not active today)
      if (settings.dailyReminder && currentTime === "21:00") {
        const streakKey = `streak_${today}`;
        if (!lastData[streakKey]) {
          try {
            const activityLog = localStorage.getItem("soulvay_today_active");
            if (!activityLog || activityLog !== today) {
              sendStreakReminder();
              lastData[streakKey] = true;
              localStorage.setItem(LAST_NOTIFICATION_KEY, JSON.stringify(lastData));
            }
          } catch {}
        }
      }
    };

    // Check immediately and then every minute
    checkAndSendNotifications();
    schedulerRef.current = setInterval(checkAndSendNotifications, 60000);

    return () => {
      if (schedulerRef.current) {
        clearInterval(schedulerRef.current);
      }
    };
  }, [settings, permissionStatus, isNative]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (isNative) {
      // Native permission prompt (iOS system dialog / Android 13+ runtime
      // permission). A denial is persisted so the UI shows the blocked state.
      const status = await requestNativeNotificationPermission();
      setPermissionStatus(status);
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, status);

      if (status === "granted") {
        setSettings((prev) => ({ ...prev, enabled: true }));
        return true;
      }
      return false;
    }

    if (!isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);
      
      if (permission === "granted") {
        setSettings((prev) => ({ ...prev, enabled: true }));
        return true;
      }
      return false;
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported, isNative]);

  // Show a local notification
  const showNotification = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if (isNative) {
      if (permissionStatus !== "granted") return;
      showNativeNotification(title, body);
      return;
    }

    if (!isSupported || permissionStatus !== "granted") return;

    try {
      new Notification(title, {
        body,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: "soulvay",
        requireInteraction: false,
        silent: false,
        ...options,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error showing notification:", error);
    }
  }, [isSupported, permissionStatus, isNative]);

  // Get language
  const getLang = useCallback(() => getStoredLanguage(), []);

  // Send mood reminder
  const sendMoodReminder = useCallback(() => {
    const lang = getLang();
    const messages = notificationMessages.moodReminder[lang as "en" | "de"];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    showNotification(randomMessage.title, randomMessage.body, { tag: "soulvay-mood" });
  }, [showNotification, getLang]);

  // Send daily reminder
  const sendDailyReminder = useCallback(() => {
    const lang = getLang();
    const messages = notificationMessages.dailyReminder[lang as "en" | "de"];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    showNotification(randomMessage.title, randomMessage.body, { tag: "soulvay-daily" });
  }, [showNotification, getLang]);

  // Send weekly recap reminder
  const sendWeeklyRecapReminder = useCallback(() => {
    const lang = getLang();
    const message = notificationMessages.weeklyRecap[lang as "en" | "de"];
    showNotification(message.title, message.body, { tag: "soulvay-weekly" });
  }, [showNotification, getLang]);

  // Send streak at-risk reminder
  const sendStreakReminder = useCallback(() => {
    const lang = getLang();
    const messages = notificationMessages.streakReminder[lang as "en" | "de"];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    showNotification(randomMessage.title, randomMessage.body, { tag: "soulvay-streak" });
  }, [showNotification, getLang]);

  // Update settings
  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      if (newSettings.enabled && permissionStatus !== "granted") {
        requestPermission();
      }
      return newSettings;
    });
  }, [permissionStatus, requestPermission]);

  // Test notification
  const sendTestNotification = useCallback(() => {
    const lang = getLang();
    const messages = {
      en: {
        title: "Soulvay Reminder 🌿",
        body: "Take a moment to check in with yourself. How are you feeling?",
      },
      de: {
        title: "Soulvay Erinnerung 🌿",
        body: "Nimm dir einen Moment, um bei dir einzuchecken. Wie fühlst du dich?",
      },
    };
    showNotification(messages[lang as "en" | "de"].title, messages[lang as "en" | "de"].body);
  }, [showNotification, getLang]);

  return {
    settings,
    updateSettings,
    permissionStatus,
    isSupported,
    requestPermission,
    showNotification,
    sendTestNotification,
    sendMoodReminder,
    sendDailyReminder,
  };
}

// Reads the app language from persisted preferences (module-level so both the
// hook and the native scheduling path share one implementation).
function getStoredLanguage(): "en" | "de" {
  try {
    const prefs = localStorage.getItem("soulvay-preferences");
    if (prefs) {
      const lang = JSON.parse(prefs).language;
      if (lang === "de" || lang === "en") return lang;
    }
  } catch {
    // Fall through to default
  }
  return "en";
}

// Picks the title/body for a scheduled reminder at schedule time.
// Random variant selection happens here; the OS repeats that variant until
// the next re-schedule (i.e. the next visit to notification settings).
function pickReminderContent(kind: ReminderKind, lang: "en" | "de"): { title: string; body: string } {
  if (kind === "weekly") return notificationMessages.weeklyRecap[lang];
  const pool = kind === "mood"
    ? notificationMessages.moodReminder[lang]
    : notificationMessages.dailyReminder[lang];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Contextual, reflective notification messages — never generic
export const notificationMessages = {
  moodReminder: {
    en: [
      { title: "A moment for you 🌿", body: "How has this day felt so far? A quick check-in can bring clarity." },
      { title: "Evening reflection 💭", body: "Before the day fades — how are you really feeling?" },
      { title: "Soulvay 🌙", body: "Your emotions carry information. A brief check-in can help you listen." },
    ],
    de: [
      { title: "Ein Moment für dich 🌿", body: "Wie hat sich dieser Tag bisher angefühlt? Ein kurzer Check-in kann Klarheit bringen." },
      { title: "Abendreflexion 💭", body: "Bevor der Tag verblasst — wie fühlst du dich wirklich?" },
      { title: "Soulvay 🌙", body: "Deine Gefühle tragen Informationen. Ein kurzer Check-in hilft dir, zuzuhören." },
    ],
  },
  dailyReminder: {
    en: [
      { title: "Soulvay 🌿", body: "Something you reflected on recently might still deserve space." },
      { title: "A quiet moment 💭", body: "Sometimes a few words to yourself can shift the whole day." },
      { title: "Soulvay ✨", body: "Your thoughts are worth exploring. Even briefly." },
      { title: "Reflection 🌙", body: "What's one thing you noticed about yourself today?" },
    ],
    de: [
      { title: "Soulvay 🌿", body: "Etwas, worüber du kürzlich nachgedacht hast, verdient vielleicht noch Raum." },
      { title: "Ein ruhiger Moment 💭", body: "Manchmal können ein paar Worte an dich selbst den ganzen Tag verändern." },
      { title: "Soulvay ✨", body: "Deine Gedanken sind es wert, erkundet zu werden. Auch nur kurz." },
      { title: "Reflexion 🌙", body: "Was hast du heute an dir selbst bemerkt?" },
    ],
  },
  weeklyRecap: {
    en: { title: "This week with Soulvay 📖", body: "A theme has appeared in your reflections. Take a look." },
    de: { title: "Diese Woche mit Soulvay 📖", body: "Ein Thema ist in deinen Reflexionen aufgetaucht. Schau mal rein." },
  },
  streakReminder: {
    en: [
      { title: "Still time today 🌙", body: "You've been showing up for yourself. Even one thought keeps it going." },
      { title: "Your reflection practice ✨", body: "A brief moment of awareness is all it takes." },
      { title: "Soulvay 🌿", body: "You've built something meaningful. A quick check-in keeps it alive." },
    ],
    de: [
      { title: "Noch Zeit heute 🌙", body: "Du warst für dich da. Auch ein Gedanke reicht, um weiterzumachen." },
      { title: "Deine Reflexionspraxis ✨", body: "Ein kurzer Moment der Aufmerksamkeit ist alles, was es braucht." },
      { title: "Soulvay 🌿", body: "Du hast etwas Bedeutsames aufgebaut. Ein kurzer Check-in hält es lebendig." },
    ],
  },
  // Contextual notifications triggered by specific user data
  patternDiscovered: {
    en: [
      { title: "Soulvay noticed something 🌱", body: "A pattern has appeared in your recent reflections." },
      { title: "A theme is emerging 💡", body: "Something keeps coming up in your conversations. Worth exploring?" },
    ],
    de: [
      { title: "Soulvay hat etwas bemerkt 🌱", body: "Ein Muster ist in deinen letzten Reflexionen aufgetaucht." },
      { title: "Ein Thema zeichnet sich ab 💡", body: "Etwas taucht immer wieder in deinen Gesprächen auf. Wert, erkundet zu werden?" },
    ],
  },
  insightGenerated: {
    en: [
      { title: "A new insight ✨", body: "Your last conversation revealed something worth revisiting." },
    ],
    de: [
      { title: "Eine neue Erkenntnis ✨", body: "Dein letztes Gespräch hat etwas enthüllt, das es wert ist, nochmal angeschaut zu werden." },
    ],
  },
};

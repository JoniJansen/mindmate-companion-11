import { useState, useEffect, useCallback, useRef } from "react";

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string; // HH:MM format
  weeklyRecap: boolean;
  weeklyRecapDay: number; // 0 = Sunday, 6 = Saturday
  moodReminder: boolean; // Premium feature
  moodReminderTime: string;
}

const NOTIFICATION_SETTINGS_KEY = "mindmate_notification_settings";
const NOTIFICATION_PERMISSION_KEY = "mindmate_notification_permission";
const LAST_NOTIFICATION_KEY = "mindmate_last_notification";

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

  // Check if notifications are supported
  useEffect(() => {
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
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Schedule checker - runs every minute to check if it's time for a notification
  useEffect(() => {
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
            const activityLog = localStorage.getItem("mindmate_today_active");
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
  }, [settings, permissionStatus]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
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
  }, [isSupported]);

  // Show a local notification
  const showNotification = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if (!isSupported || permissionStatus !== "granted") return;

    try {
      new Notification(title, {
        body,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: "mindmate",
        requireInteraction: false,
        silent: false,
        ...options,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error showing notification:", error);
    }
  }, [isSupported, permissionStatus]);

  // Get language
  const getLang = useCallback(() => {
    try {
      const prefs = localStorage.getItem("mindmate-preferences");
      if (prefs) {
        return JSON.parse(prefs).language || "en";
      }
    } catch {}
    return "en";
  }, []);

  // Send mood reminder
  const sendMoodReminder = useCallback(() => {
    const lang = getLang();
    const messages = notificationMessages.moodReminder[lang as "en" | "de"];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    showNotification(randomMessage.title, randomMessage.body, { tag: "mindmate-mood" });
  }, [showNotification, getLang]);

  // Send daily reminder
  const sendDailyReminder = useCallback(() => {
    const lang = getLang();
    const messages = notificationMessages.dailyReminder[lang as "en" | "de"];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    showNotification(randomMessage.title, randomMessage.body, { tag: "mindmate-daily" });
  }, [showNotification, getLang]);

  // Send weekly recap reminder
  const sendWeeklyRecapReminder = useCallback(() => {
    const lang = getLang();
    const message = notificationMessages.weeklyRecap[lang as "en" | "de"];
    showNotification(message.title, message.body, { tag: "mindmate-weekly" });
  }, [showNotification, getLang]);

  // Send streak at-risk reminder
  const sendStreakReminder = useCallback(() => {
    const lang = getLang();
    const messages = notificationMessages.streakReminder[lang as "en" | "de"];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    showNotification(randomMessage.title, randomMessage.body, { tag: "mindmate-streak" });
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

// Notification messages for different occasions
export const notificationMessages = {
  moodReminder: {
    en: [
      { title: "How are you feeling? 🌿", body: "Take a moment to check in with your mood." },
      { title: "Mood Check-in Time 💭", body: "A quick check-in helps you track your emotional patterns." },
      { title: "Soulvay Here 🌙", body: "Ready for your evening mood check-in?" },
    ],
    de: [
      { title: "Wie fühlst du dich? 🌿", body: "Nimm dir einen Moment für deinen Stimmungs-Check-in." },
      { title: "Zeit für den Mood-Check 💭", body: "Ein kurzer Check-in hilft dir, deine emotionalen Muster zu erkennen." },
      { title: "Soulvay ist da 🌙", body: "Bereit für deinen Abend-Check-in?" },
    ],
  },
  dailyReminder: {
    en: [
      { title: "Evening Check-in 🌙", body: "How was your day? Take a moment to reflect." },
      { title: "Time for You 💭", body: "A few minutes of journaling can make a difference." },
      { title: "Soulvay is Here 🌿", body: "Ready to listen whenever you want to talk." },
      { title: "Daily Reflection ✨", body: "What's one thing you're grateful for today?" },
    ],
    de: [
      { title: "Abend Check-in 🌙", body: "Wie war dein Tag? Nimm dir einen Moment zum Reflektieren." },
      { title: "Zeit für Dich 💭", body: "Ein paar Minuten Tagebuch können viel bewirken." },
      { title: "Soulvay ist da 🌿", body: "Bereit zuzuhören, wann immer du reden möchtest." },
      { title: "Tägliche Reflexion ✨", body: "Wofür bist du heute dankbar?" },
    ],
  },
  weeklyRecap: {
    en: { title: "Your Weekly Recap is Ready 📊", body: "See patterns and insights from your week." },
    de: { title: "Dein Wochenrückblick ist da 📊", body: "Entdecke Muster und Einblicke aus deiner Woche." },
  },
  streakReminder: {
    en: [
      { title: "Don't break your streak 🔥", body: "A quick check-in keeps your momentum going." },
      { title: "You're on a roll! ✨", body: "Just one minute to keep your streak alive." },
      { title: "Still time today 🌙", body: "A mood check-in or a thought — that's all it takes." },
    ],
    de: [
      { title: "Halte deinen Streak 🔥", body: "Ein kurzer Check-in hält dein Momentum." },
      { title: "Du bist dran! ✨", body: "Nur eine Minute, um deinen Streak zu behalten." },
      { title: "Noch Zeit heute 🌙", body: "Ein Stimmungs-Check-in oder ein Gedanke — mehr braucht es nicht." },
    ],
  },
};

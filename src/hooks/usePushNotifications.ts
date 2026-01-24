import { useState, useEffect, useCallback } from "react";

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string; // HH:MM format
  weeklyRecap: boolean;
  weeklyRecapDay: number; // 0 = Sunday, 6 = Saturday
}

const NOTIFICATION_SETTINGS_KEY = "mindmate_notification_settings";
const NOTIFICATION_PERMISSION_KEY = "mindmate_notification_permission";

const defaultSettings: NotificationSettings = {
  enabled: false,
  dailyReminder: true,
  dailyReminderTime: "20:00",
  weeklyRecap: true,
  weeklyRecapDay: 0, // Sunday
};

export function usePushNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

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
        setSettings(JSON.parse(saved));
      } catch {
        // Use defaults
      }
    }
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);
      
      if (permission === "granted") {
        setSettings((prev) => ({ ...prev, enabled: true }));
        scheduleNotifications();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
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
        ...options,
      });
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }, [isSupported, permissionStatus]);

  // Schedule notifications (uses local scheduling, not push server)
  const scheduleNotifications = useCallback(() => {
    if (!settings.enabled || permissionStatus !== "granted") return;

    // Clear existing scheduled notifications
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CLEAR_SCHEDULED_NOTIFICATIONS",
      });
    }

    // For now, we'll use a simple interval-based approach
    // In production, you'd want to use a service worker with scheduled alarms
    console.log("Notifications scheduled with settings:", settings);
  }, [settings, permissionStatus]);

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
    const messages = {
      en: {
        title: "MindMate Reminder 🌿",
        body: "Take a moment to check in with yourself. How are you feeling?",
      },
      de: {
        title: "MindMate Erinnerung 🌿",
        body: "Nimm dir einen Moment, um bei dir einzuchecken. Wie fühlst du dich?",
      },
    };

    const lang = (localStorage.getItem("mindmate_language") || "en") as "en" | "de";
    showNotification(messages[lang].title, messages[lang].body);
  }, [showNotification]);

  return {
    settings,
    updateSettings,
    permissionStatus,
    isSupported,
    requestPermission,
    showNotification,
    sendTestNotification,
    scheduleNotifications,
  };
}

// Notification messages for different occasions
export const notificationMessages = {
  dailyReminder: {
    en: [
      { title: "Evening Check-in 🌙", body: "How was your day? Take a moment to reflect." },
      { title: "Time for You 💭", body: "A few minutes of journaling can make a difference." },
      { title: "MindMate is Here 🌿", body: "Ready to listen whenever you want to talk." },
      { title: "Daily Reflection ✨", body: "What's one thing you're grateful for today?" },
    ],
    de: [
      { title: "Abend Check-in 🌙", body: "Wie war dein Tag? Nimm dir einen Moment zum Reflektieren." },
      { title: "Zeit für Dich 💭", body: "Ein paar Minuten Tagebuch können viel bewirken." },
      { title: "MindMate ist da 🌿", body: "Bereit zuzuhören, wann immer du reden möchtest." },
      { title: "Tägliche Reflexion ✨", body: "Wofür bist du heute dankbar?" },
    ],
  },
  weeklyRecap: {
    en: { title: "Your Weekly Recap is Ready 📊", body: "See patterns and insights from your week." },
    de: { title: "Dein Wochenrückblick ist da 📊", body: "Entdecke Muster und Einblicke aus deiner Woche." },
  },
};

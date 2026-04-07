/**
 * Plain-string i18n for non-React contexts (notifications, service workers).
 * No hooks — reads language from localStorage directly.
 */

type Lang = "de" | "en";

const strings: Record<string, Record<Lang, string>> = {
  "backup.reminderTitle": {
    de: "Backup-Erinnerung",
    en: "Backup Reminder",
  },
  "backup.neverExported": {
    de: "Du hast noch nie ein Backup erstellt. Sichere deine Daten jetzt!",
    en: "You've never created a backup. Secure your data now!",
  },
  "backup.overdue": {
    de: "Dein letztes Backup ist {days} Tage her. Zeit für ein neues Backup!",
    en: "Your last backup was {days} days ago. Time for a new backup!",
  },
  "backup.overdue1": {
    de: "Dein letztes Backup ist 1 Tag her. Zeit für ein neues Backup!",
    en: "Your last backup was 1 day ago. Time for a new backup!",
  },
  "notification.notSupported": {
    de: "Dein Browser unterstützt keine Benachrichtigungen.",
    en: "Your browser doesn't support notifications.",
  },
  "notification.enabled": {
    de: "Benachrichtigungen aktiviert",
    en: "Notifications enabled",
  },
  "notification.enabledDesc": {
    de: "Du erhältst Backup-Erinnerungen.",
    en: "You'll receive backup reminders.",
  },
  "notification.blocked": {
    de: "Benachrichtigungen blockiert",
    en: "Notifications blocked",
  },
  "notification.blockedDesc": {
    de: "Bitte aktiviere Benachrichtigungen in deinen Browser-Einstellungen.",
    en: "Please enable notifications in your browser settings.",
  },
};

export function getAppLanguage(): Lang {
  try {
    const stored = localStorage.getItem("soulvay-preferences");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.language === "de" || parsed.language === "en") return parsed.language;
    }
  } catch {}
  return "de"; // default
}

export function tp(key: string, params?: Record<string, string | number>): string {
  const lang = getAppLanguage();
  let str = strings[key]?.[lang] ?? strings[key]?.["en"] ?? key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, String(v));
    });
  }
  return str;
}

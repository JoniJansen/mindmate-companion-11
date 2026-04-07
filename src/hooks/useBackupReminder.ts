import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { tp } from "@/lib/i18nPlain";

const BACKUP_REMINDER_KEY = "soulvay-last-export";
const BACKUP_REMINDER_INTERVAL_KEY = "soulvay-backup-interval";
const NOTIFICATION_SHOWN_KEY = "soulvay-backup-notification-shown";

interface BackupReminderState {
  isOverdue: boolean;
  daysSinceBackup: number | null;
  reminderIntervalDays: number;
  lastExportDate: Date | null;
}

export function useBackupReminder() {
  const [state, setState] = useState<BackupReminderState>({
    isOverdue: false,
    daysSinceBackup: null,
    reminderIntervalDays: 30,
    lastExportDate: null,
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const { toast } = useToast();

  // Check backup status on mount
  useEffect(() => {
    const checkBackupStatus = () => {
      const lastExport = localStorage.getItem(BACKUP_REMINDER_KEY);
      const interval = localStorage.getItem(BACKUP_REMINDER_INTERVAL_KEY);
      const reminderDays = interval ? parseInt(interval, 10) : 30;

      let isOverdue = false;
      let daysSinceBackup: number | null = null;
      let lastExportDate: Date | null = null;

      if (lastExport) {
        lastExportDate = new Date(lastExport);
        daysSinceBackup = Math.floor((Date.now() - lastExportDate.getTime()) / (1000 * 60 * 60 * 24));
        isOverdue = daysSinceBackup >= reminderDays;
      } else {
        // Never exported
        isOverdue = true;
      }

      setState({
        isOverdue,
        daysSinceBackup,
        reminderIntervalDays: reminderDays,
        lastExportDate,
      });

      return { isOverdue, daysSinceBackup, reminderDays };
    };

    const { isOverdue, daysSinceBackup, reminderDays } = checkBackupStatus();

    // Check notification permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    // Show notification if overdue and not already shown in this session
    if (isOverdue && "Notification" in window) {
      const sessionNotificationShown = sessionStorage.getItem(NOTIFICATION_SHOWN_KEY);
      
      if (!sessionNotificationShown && Notification.permission === "granted") {
        showBackupNotification(daysSinceBackup, reminderDays);
        sessionStorage.setItem(NOTIFICATION_SHOWN_KEY, "true");
      }
    }
  }, []);

  const showBackupNotification = (daysSince: number | null, intervalDays: number) => {
    const title = tp("backup.reminderTitle");
    const body = daysSince === null
      ? tp("backup.neverExported")
      : daysSince === 1
        ? tp("backup.overdue1")
        : tp("backup.overdue", { days: daysSince });

    try {
      const notification = new Notification(title, {
        body,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: "backup-reminder",
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = "/settings";
        notification.close();
      };
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Could not show notification:", e);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      toast({
        title: tp("notification.notSupported"),
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === "granted") {
        toast({
          title: "Notifications enabled",
          description: "You'll receive backup reminders.",
        });
        return true;
      } else {
        toast({
          title: "Notifications blocked",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
        return false;
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error("Error requesting notification permission:", e);
      return false;
    }
  };

  const showTestNotification = () => {
    if (notificationPermission === "granted") {
      showBackupNotification(state.daysSinceBackup, state.reminderIntervalDays);
    }
  };

  return {
    ...state,
    notificationPermission,
    notificationsSupported: "Notification" in window,
    requestNotificationPermission,
    showTestNotification,
  };
}

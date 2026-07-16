import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Clock, Calendar, TestTube, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { usePremium } from "@/hooks/usePremium";
import { useNavigate } from "react-router-dom";

interface NotificationSettingsProps {
  onClose?: () => void;
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isPremium, canUseReminders } = usePremium();
  const {
    settings,
    updateSettings,
    permissionStatus,
    isSupported,
    requestPermission,
    sendTestNotification,
  } = usePushNotifications();

  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    if (permissionStatus === "granted") {
      updateSettings({ enabled: !settings.enabled });
      return;
    }

    setIsRequesting(true);
    const granted = await requestPermission();
    setIsRequesting(false);

    if (granted) {
      toast({
        title: t("notificationSettings.enabledToast"),
        description: t("notificationSettings.enabledToastDesc"),
      });
    } else {
      toast({
        title: t("notificationSettings.permissionDenied"),
        description: t("notificationSettings.permissionDeniedDesc"),
        variant: "destructive",
      });
    }
  };

  const handleMoodReminderToggle = (checked: boolean) => {
    if (!canUseReminders && checked) {
      navigate("/upgrade");
      return;
    }
    updateSettings({ moodReminder: checked });
  };

  const handleTestNotification = () => {
    sendTestNotification();
    toast({
      title: t("notificationSettings.testSent"),
      description: t("notificationSettings.testSentDesc"),
    });
  };

  const timeOptions = [
    { value: "08:00", label: t("notificationSettings.time0800") },
    { value: "12:00", label: t("notificationSettings.time1200") },
    { value: "18:00", label: t("notificationSettings.time1800") },
    { value: "19:00", label: t("notificationSettings.time1900") },
    { value: "20:00", label: t("notificationSettings.time2000") },
    { value: "21:00", label: t("notificationSettings.time2100") },
  ];

  const dayOptions = [
    { value: 0, label: t("notificationSettings.daySunday") },
    { value: 1, label: t("notificationSettings.dayMonday") },
    { value: 5, label: t("notificationSettings.dayFriday") },
    { value: 6, label: t("notificationSettings.daySaturday") },
  ];

  if (!isSupported) {
    return (
      <div className="p-4 rounded-xl bg-muted/30 text-center">
        <BellOff className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          {t("notificationSettings.notSupported")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {t("notificationSettings.mainLabel")}
            </p>
            <p className="text-xs text-muted-foreground">
              {permissionStatus === "granted"
                ? t("notificationSettings.allowed")
                : permissionStatus === "denied"
                ? t("notificationSettings.blocked")
                : t("notificationSettings.notSetUp")}
            </p>
          </div>
        </div>
        <Switch
          checked={settings.enabled && permissionStatus === "granted"}
          onCheckedChange={handleEnableNotifications}
          disabled={isRequesting || permissionStatus === "denied"}
        />
      </div>

      <AnimatePresence>
        {settings.enabled && permissionStatus === "granted" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Mood Reminder - Premium Feature */}
            <div className={`p-4 rounded-xl border ${canUseReminders ? 'bg-card border-border/40' : 'bg-muted/20 border-primary/20'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${canUseReminders ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium text-foreground">
                    {t("notificationSettings.moodReminder")}
                  </span>
                  {!canUseReminders && (
                    <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" />
                      Plus
                    </span>
                  )}
                </div>
                <Switch
                  checked={settings.moodReminder && canUseReminders}
                  onCheckedChange={handleMoodReminderToggle}
                />
              </div>
              
              <p className="text-xs text-muted-foreground mb-3">
                {t("notificationSettings.moodReminderDesc")}
              </p>

              {settings.moodReminder && canUseReminders && (
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground mb-2 block">
                    {t("notificationSettings.time")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {timeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSettings({ moodReminderTime: option.value })}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          settings.moodReminderTime === option.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Daily Reminder */}
            <div className="p-4 rounded-xl bg-card border border-border/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {t("notificationSettings.dailyReminder")}
                  </span>
                </div>
                <Switch
                  checked={settings.dailyReminder}
                  onCheckedChange={(checked) => updateSettings({ dailyReminder: checked })}
                />
              </div>
              
              {settings.dailyReminder && (
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground mb-2 block">
                    {t("notificationSettings.time")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {timeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSettings({ dailyReminderTime: option.value })}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          settings.dailyReminderTime === option.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Weekly Recap */}
            <div className="p-4 rounded-xl bg-card border border-border/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {t("notificationSettings.weeklyRecap")}
                  </span>
                </div>
                <Switch
                  checked={settings.weeklyRecap}
                  onCheckedChange={(checked) => updateSettings({ weeklyRecap: checked })}
                />
              </div>
              
              {settings.weeklyRecap && (
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground mb-2 block">
                    {t("notificationSettings.day")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {dayOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSettings({ weeklyRecapDay: option.value })}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          settings.weeklyRecapDay === option.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Test Button */}
            <Button
              variant="outline"
              onClick={handleTestNotification}
              className="w-full gap-2"
            >
              <TestTube className="w-4 h-4" />
              {t("notificationSettings.sendTest")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {permissionStatus === "denied" && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">
            {t("notificationSettings.blockedMessage")}
          </p>
        </div>
      )}
    </div>
  );
}

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
  const { language } = useTranslation();
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
        title: language === "de" ? "Benachrichtigungen aktiviert" : "Notifications enabled",
        description: language === "de" 
          ? "Du erhältst jetzt Erinnerungen." 
          : "You'll now receive reminders.",
      });
    } else {
      toast({
        title: language === "de" ? "Berechtigung verweigert" : "Permission denied",
        description: language === "de" 
          ? "Aktiviere Benachrichtigungen in deinen Browser-Einstellungen." 
          : "Enable notifications in your browser settings.",
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
      title: language === "de" ? "Test gesendet" : "Test sent",
      description: language === "de" 
        ? "Schau nach deiner Benachrichtigung!" 
        : "Check for your notification!",
    });
  };

  const timeOptions = [
    { value: "08:00", label: language === "de" ? "08:00 Morgens" : "8:00 AM" },
    { value: "12:00", label: language === "de" ? "12:00 Mittags" : "12:00 PM" },
    { value: "18:00", label: language === "de" ? "18:00 Abends" : "6:00 PM" },
    { value: "19:00", label: language === "de" ? "19:00 Abends" : "7:00 PM" },
    { value: "20:00", label: language === "de" ? "20:00 Abends" : "8:00 PM" },
    { value: "21:00", label: language === "de" ? "21:00 Abends" : "9:00 PM" },
  ];

  const dayOptions = [
    { value: 0, label: language === "de" ? "Sonntag" : "Sunday" },
    { value: 1, label: language === "de" ? "Montag" : "Monday" },
    { value: 5, label: language === "de" ? "Freitag" : "Friday" },
    { value: 6, label: language === "de" ? "Samstag" : "Saturday" },
  ];

  if (!isSupported) {
    return (
      <div className="p-4 rounded-xl bg-muted/30 text-center">
        <BellOff className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          {language === "de" 
            ? "Benachrichtigungen werden in diesem Browser nicht unterstützt."
            : "Notifications are not supported in this browser."}
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
              {language === "de" ? "Benachrichtigungen" : "Notifications"}
            </p>
            <p className="text-xs text-muted-foreground">
              {permissionStatus === "granted" 
                ? (language === "de" ? "Erlaubt" : "Allowed")
                : permissionStatus === "denied"
                ? (language === "de" ? "Blockiert" : "Blocked")
                : (language === "de" ? "Nicht eingerichtet" : "Not set up")}
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
                    {language === "de" ? "Stimmungs-Erinnerung" : "Mood Reminder"}
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
                {language === "de" 
                  ? "Tägliche Erinnerung für deinen Stimmungs-Check-in"
                  : "Daily reminder for your mood check-in"}
              </p>
              
              {settings.moodReminder && canUseReminders && (
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground mb-2 block">
                    {language === "de" ? "Uhrzeit" : "Time"}
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
                    {language === "de" ? "Tägliche Erinnerung" : "Daily Reminder"}
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
                    {language === "de" ? "Uhrzeit" : "Time"}
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
                    {language === "de" ? "Wöchentlicher Rückblick" : "Weekly Recap"}
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
                    {language === "de" ? "Tag" : "Day"}
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
              {language === "de" ? "Test-Benachrichtigung senden" : "Send Test Notification"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {permissionStatus === "denied" && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">
            {language === "de" 
              ? "Benachrichtigungen wurden blockiert. Bitte aktiviere sie in deinen Browser-Einstellungen."
              : "Notifications are blocked. Please enable them in your browser settings."}
          </p>
        </div>
      )}
    </div>
  );
}

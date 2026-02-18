import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Globe, 
  MessageSquare, 
  User, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  HelpCircle,
  RotateCcw,
  ChevronRight,
  Check,
  Sparkles,
  Palette,
  Monitor,
  Volume2,
  Download,
  LogOut,
  Cookie,
  Heart
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme, accentColorOptions, themeModeOptions, ThemeMode, AccentColor } from "@/hooks/useTheme";
import { useVoiceSettings, VoiceType, VoiceSpeed, VoiceLanguage, AvatarStyle } from "@/hooks/useVoiceSettings";
import { Circle, AudioLines, Smile } from "lucide-react";
import { SubscriptionSection } from "@/components/premium/SubscriptionSection";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { openCookieSettings } from "@/components/gdpr/CookieConsent";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";

interface Preferences {
  language: "en" | "de";
  tone: "gentle" | "neutral" | "structured";
  addressForm: "du" | "sie";
  notifications: boolean;
  innerDialogue: boolean;
}

const defaultPreferences: Preferences = {
  language: "en",
  tone: "gentle",
  addressForm: "du",
  notifications: true,
  innerDialogue: false,
};

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const { mode, accentColor, setMode, setAccentColor, isDark } = useTheme();
  const { settings: voiceSettings, updateSetting: updateVoiceSetting } = useVoiceSettings();
  const { checkSubscriptionStatus } = usePremium();
  const { user, profile, signOut } = useAuth();
  const { isAdmin, checkAdminStatus } = useAdmin();

  // Check admin status on mount
  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user, checkAdminStatus]);

  const handleRestartTour = () => {
    // Clear both tour completion flags
    localStorage.removeItem("mindmate_tour_completed");
    localStorage.removeItem("mindmate_tour_auto_triggered");
    // Also clear tab hints so they show again
    localStorage.removeItem("mindmate_tab_hints_seen");
    toast({
      title: language === "de" ? "Tour zurückgesetzt" : "Tour reset",
      description: language === "de" 
        ? "Die App-Einführung startet beim nächsten Chat-Besuch." 
        : "The app tour will start on your next chat visit.",
    });
    navigate("/chat");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast({
        title: language === "de" ? "Erfolgreich abgemeldet" : "Logged out successfully",
      });
      navigate("/auth", { replace: true });
    } catch (error: any) {
      toast({
        title: language === "de" ? "Fehler beim Abmelden" : "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Handle Stripe redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: language === "de" ? "Willkommen bei Soulvay Plus!" : "Welcome to Soulvay Plus!",
        description: language === "de" 
          ? "Dein Upgrade war erfolgreich." 
          : "Your upgrade was successful.",
      });
      checkSubscriptionStatus();
    } else if (searchParams.get("canceled") === "true") {
      toast({
        title: language === "de" ? "Checkout abgebrochen" : "Checkout canceled",
        description: language === "de" 
          ? "Du kannst jederzeit upgraden." 
          : "You can upgrade anytime.",
      });
    }
  }, [searchParams, toast, language, checkSubscriptionStatus]);

  const voiceTypeOptions: { value: VoiceType; label: string; description: string }[] = [
    { value: "female", label: t("voice.female"), description: language === "de" ? "Ruhig & warm" : "Calm & warm" },
    { value: "male", label: t("voice.male"), description: language === "de" ? "Vertrauensvoll & klar" : "Trustworthy & clear" },
    { value: "neutral", label: t("voice.neutral"), description: language === "de" ? "Sanft & ausgeglichen" : "Soft & balanced" },
  ];

  const voiceSpeedOptions: { value: VoiceSpeed; label: string }[] = [
    { value: 0.9, label: t("voice.slow") },
    { value: 1.0, label: t("voice.normal") },
    { value: 1.1, label: t("voice.fast") },
  ];

  const voiceLanguageOptions: { value: VoiceLanguage; label: string }[] = [
    { value: "auto", label: t("voice.auto") },
    { value: "en", label: "English" },
    { value: "de", label: "Deutsch" },
  ];

  const avatarStyleOptions: { value: AvatarStyle; label: string; labelDe: string; icon: React.ReactNode }[] = [
    { value: "orb", label: "Orb", labelDe: "Orb", icon: <Circle className="w-5 h-5" /> },
    { value: "wave", label: "Waveform", labelDe: "Wellenform", icon: <AudioLines className="w-5 h-5" /> },
    { value: "face", label: "Character", labelDe: "Charakter", icon: <Smile className="w-5 h-5" /> },
  ];

  const languageOptions = [
    { value: "en", label: "English", flag: "🇬🇧" },
    { value: "de", label: "Deutsch", flag: "🇩🇪" },
  ];

  const toneOptions = [
    { value: "gentle", label: t("tone.gentle"), description: t("tone.gentleDesc") },
    { value: "neutral", label: t("tone.balanced"), description: t("tone.balancedDesc") },
    { value: "structured", label: t("tone.structured"), description: t("tone.structuredDesc") },
  ];

  const addressOptions = [
    { value: "du", label: t("address.informal"), description: t("address.informalDesc") },
    { value: "sie", label: t("address.formal"), description: t("address.formalDesc") },
  ];

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mindmate-preferences");
      if (stored) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
      }
    } catch {
      // Use defaults
    }
  }, []);

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem("mindmate-preferences", JSON.stringify(updated));
    
    toast({
      title: t("settings.saved"),
      description: t("settings.preferencesUpdated"),
    });
  };

  const handleThemeModeChange = (newMode: ThemeMode) => {
    setMode(newMode);
    toast({
      title: t("settings.saved"),
      description: t("settings.preferencesUpdated"),
    });
  };

  const handleAccentColorChange = (newColor: AccentColor) => {
    setAccentColor(newColor);
    toast({
      title: t("settings.saved"),
      description: t("settings.preferencesUpdated"),
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getModeIcon = () => {
    if (mode === "system") return <Monitor className="w-5 h-5 text-foreground" />;
    if (mode === "dark" || isDark) return <Moon className="w-5 h-5 text-foreground" />;
    return <Sun className="w-5 h-5 text-foreground" />;
  };

  const getModeLabel = () => {
    const option = themeModeOptions.find(o => o.value === mode);
    return language === "de" ? option?.labelDe : option?.label;
  };

  const getAccentLabel = () => {
    const option = accentColorOptions.find(o => o.value === accentColor);
    return language === "de" ? option?.labelDe : option?.label;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader 
        title={t("settings.title")} 
        subtitle={t("settings.subtitle")}
        showBack 
        backTo="/"
      />

      {/* Single scroll container for iOS stability - min-h-0 is critical for flex scroll */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ 
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* pb-32 ensures last items clear BottomNav + safe area */}
        <div className="px-4 py-4 pb-32 max-w-lg mx-auto space-y-6">
        {/* Subscription */}
        <SubscriptionSection onUpgradeClick={() => navigate("/upgrade")} />

        {/* Language */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t("settings.languageRegion")}</h2>
          <CalmCard variant="elevated">
            <button
              onClick={() => toggleSection("language")}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{t("settings.language")}</p>
                  <p className="text-sm text-muted-foreground">
                    {languageOptions.find(l => l.value === preferences.language)?.label}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "language" ? "rotate-90" : ""}`} />
            </button>
            
            {expandedSection === "language" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="mt-4 pt-4 border-t border-border/50 space-y-2"
              >
                {languageOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference("language", option.value as "en" | "de")}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      preferences.language === option.value 
                        ? "bg-primary-soft" 
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{option.flag}</span>
                      <span className="font-medium text-foreground">{option.label}</span>
                    </div>
                    {preferences.language === option.value && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </CalmCard>
        </motion.div>

        {/* Tone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t("settings.conversationStyle")}</h2>
          <CalmCard variant="elevated">
            <button
              onClick={() => toggleSection("tone")}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-calm-soft flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-calm" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{t("settings.conversationTone")}</p>
                  <p className="text-sm text-muted-foreground">
                    {toneOptions.find(t => t.value === preferences.tone)?.label}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "tone" ? "rotate-90" : ""}`} />
            </button>
            
            {expandedSection === "tone" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="mt-4 pt-4 border-t border-border/50 space-y-2"
              >
                {toneOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference("tone", option.value as "gentle" | "neutral" | "structured")}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      preferences.tone === option.value 
                        ? "bg-primary-soft" 
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    {preferences.tone === option.value && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </CalmCard>

          {/* Address Form - Only show for German */}
          {preferences.language === "de" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3"
            >
              <CalmCard variant="elevated">
                <button
                  onClick={() => toggleSection("address")}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gentle-soft flex items-center justify-center">
                      <User className="w-5 h-5 text-gentle" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{t("settings.addressForm")}</p>
                      <p className="text-sm text-muted-foreground">
                        {addressOptions.find(a => a.value === preferences.addressForm)?.label}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "address" ? "rotate-90" : ""}`} />
                </button>
                
                {expandedSection === "address" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-4 pt-4 border-t border-border/50 space-y-2"
                  >
                    {addressOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updatePreference("addressForm", option.value as "du" | "sie")}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                          preferences.addressForm === option.value 
                            ? "bg-primary-soft" 
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="text-left">
                          <p className="font-medium text-foreground">{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                        {preferences.addressForm === option.value && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </CalmCard>
            </motion.div>
          )}
        </motion.div>

        {/* Appearance - Theme & Colors */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t("settings.appearance")}</h2>
          <div className="space-y-3">
            {/* Theme Mode */}
            <CalmCard variant="elevated">
              <button
                onClick={() => toggleSection("themeMode")}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    {getModeIcon()}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{t("settings.darkMode")}</p>
                    <p className="text-sm text-muted-foreground">{getModeLabel()}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "themeMode" ? "rotate-90" : ""}`} />
              </button>
              
              {expandedSection === "themeMode" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-4 pt-4 border-t border-border/50 space-y-2"
                >
                  {themeModeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleThemeModeChange(option.value)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                        mode === option.value 
                          ? "bg-primary-soft" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {option.value === "light" && <Sun className="w-5 h-5 text-foreground" />}
                        {option.value === "dark" && <Moon className="w-5 h-5 text-foreground" />}
                        {option.value === "system" && <Monitor className="w-5 h-5 text-foreground" />}
                        <span className="font-medium text-foreground">
                          {language === "de" ? option.labelDe : option.label}
                        </span>
                      </div>
                      {mode === option.value && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </CalmCard>

            {/* Accent Color */}
            <CalmCard variant="elevated">
              <button
                onClick={() => toggleSection("accentColor")}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                    <Palette className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{t("settings.accentColor")}</p>
                    <p className="text-sm text-muted-foreground">{getAccentLabel()}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "accentColor" ? "rotate-90" : ""}`} />
              </button>
              
              {expandedSection === "accentColor" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-4 pt-4 border-t border-border/50"
                >
                  <div className="grid grid-cols-3 gap-3">
                    {accentColorOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleAccentColorChange(option.value)}
                        className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
                          accentColor === option.value 
                            ? "bg-primary-soft ring-2 ring-primary" 
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${option.color} mb-2`} />
                        <span className="text-xs font-medium text-foreground text-center">
                          {language === "de" ? option.labelDe : option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </CalmCard>

            {/* Notifications */}
            <CalmCard variant="elevated">
              <button
                onClick={() => toggleSection("notifications")}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Bell className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{t("settings.reminders")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings.dailyCheckin")}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "notifications" ? "rotate-90" : ""}`} />
              </button>
              
              {expandedSection === "notifications" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-4 pt-4 border-t border-border/50"
                >
                  <NotificationSettings />
                </motion.div>
              )}
            </CalmCard>

            <CalmCard variant="elevated">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gentle-soft flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-gentle" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("settings.innerDialogue")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings.innerDialogueDesc")}</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.innerDialogue}
                  onCheckedChange={(checked) => updatePreference("innerDialogue", checked)}
                />
              </div>
            </CalmCard>
          </div>
        </motion.div>

        {/* Voice Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t("voice.title")}</h2>
          <div className="space-y-3">
            {/* Voice Type */}
            <CalmCard variant="elevated">
              <button
                onClick={() => toggleSection("voiceType")}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{t("voice.voiceType")}</p>
                    <p className="text-sm text-muted-foreground">
                      {voiceTypeOptions.find(o => o.value === voiceSettings.voiceType)?.label}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "voiceType" ? "rotate-90" : ""}`} />
              </button>
              
              {expandedSection === "voiceType" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-4 pt-4 border-t border-border/50 space-y-2"
                >
                  {voiceTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        updateVoiceSetting("voiceType", option.value);
                        toast({ title: t("settings.saved"), description: t("settings.preferencesUpdated") });
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                        voiceSettings.voiceType === option.value 
                          ? "bg-primary-soft" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-medium text-foreground">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      {voiceSettings.voiceType === option.value && (
                        <Check className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </CalmCard>

            {/* Speaking Speed */}
            <CalmCard variant="elevated">
              <button
                onClick={() => toggleSection("voiceSpeed")}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-calm-soft flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-calm" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{t("voice.speed")}</p>
                    <p className="text-sm text-muted-foreground">
                      {voiceSpeedOptions.find(o => o.value === voiceSettings.speed)?.label}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "voiceSpeed" ? "rotate-90" : ""}`} />
              </button>
              
              {expandedSection === "voiceSpeed" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-4 pt-4 border-t border-border/50 space-y-2"
                >
                  {voiceSpeedOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        updateVoiceSetting("speed", option.value);
                        toast({ title: t("settings.saved"), description: t("settings.preferencesUpdated") });
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                        voiceSettings.speed === option.value 
                          ? "bg-primary-soft" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <span className="font-medium text-foreground">{option.label}</span>
                      {voiceSettings.speed === option.value && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </CalmCard>

            {/* Voice Language */}
            <CalmCard variant="elevated">
              <button
                onClick={() => toggleSection("voiceLanguage")}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gentle-soft flex items-center justify-center">
                    <Globe className="w-5 h-5 text-gentle" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{t("voice.language")}</p>
                    <p className="text-sm text-muted-foreground">
                      {voiceLanguageOptions.find(o => o.value === voiceSettings.language)?.label}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "voiceLanguage" ? "rotate-90" : ""}`} />
              </button>
              
              {expandedSection === "voiceLanguage" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-4 pt-4 border-t border-border/50 space-y-2"
                >
                  {voiceLanguageOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        updateVoiceSetting("language", option.value);
                        toast({ title: t("settings.saved"), description: t("settings.preferencesUpdated") });
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                        voiceSettings.language === option.value 
                          ? "bg-primary-soft" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <span className="font-medium text-foreground">{option.label}</span>
                      {voiceSettings.language === option.value && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </CalmCard>

            {/* Auto-play Replies */}
            <CalmCard variant="elevated">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("voice.autoPlay")}</p>
                    <p className="text-sm text-muted-foreground">{t("voice.autoPlayDesc")}</p>
                  </div>
                </div>
                <Switch
                  checked={voiceSettings.autoPlayReplies}
                  onCheckedChange={(checked) => {
                    updateVoiceSetting("autoPlayReplies", checked);
                    toast({ title: t("settings.saved"), description: t("settings.preferencesUpdated") });
                  }}
                />
              </div>
            </CalmCard>

            {/* Avatar Style */}
            <CalmCard variant="elevated">
              <button
                onClick={() => toggleSection("avatarStyle")}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                    <Smile className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      {language === "de" ? "Avatar-Stil" : "Avatar Style"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "de" 
                        ? avatarStyleOptions.find(o => o.value === voiceSettings.avatarStyle)?.labelDe
                        : avatarStyleOptions.find(o => o.value === voiceSettings.avatarStyle)?.label}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "avatarStyle" ? "rotate-90" : ""}`} />
              </button>
              
              {expandedSection === "avatarStyle" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-4 pt-4 border-t border-border/50 space-y-2"
                >
                  {avatarStyleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        updateVoiceSetting("avatarStyle", option.value);
                        toast({ title: t("settings.saved"), description: t("settings.preferencesUpdated") });
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                        voiceSettings.avatarStyle === option.value 
                          ? "bg-primary-soft" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-primary">{option.icon}</div>
                        <span className="font-medium text-foreground">
                          {language === "de" ? option.labelDe : option.label}
                        </span>
                      </div>
                      {voiceSettings.avatarStyle === option.value && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </CalmCard>
          </div>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t("settings.support")}</h2>
          <div className="space-y-3">
            {/* Safety / Crisis Resources - PROMINENT for Apple Mental Health compliance */}
            <CalmCard 
              variant="default" 
              className="cursor-pointer hover:shadow-card transition-shadow"
              onClick={() => navigate("/safety")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {language === "de" ? "Unterstützung & Ressourcen" : "Support & Resources"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "de" ? "Krisenressourcen immer erreichbar" : "Crisis resources always available"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CalmCard>

            <CalmCard 
              variant="default" 
              className="cursor-pointer hover:shadow-card transition-shadow"
              onClick={() => navigate("/privacy")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("settings.privacyData")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings.manageInfo")}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CalmCard>

            <CalmCard 
              variant="default" 
              className="cursor-pointer hover:shadow-card transition-shadow"
              onClick={() => navigate("/faq")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("settings.helpSupport")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings.faqContact")}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CalmCard>

            {/* Hide Install App on native iOS/Android builds */}
            {!(window as any).Capacitor && (
              <CalmCard 
                variant="default" 
                className="cursor-pointer hover:shadow-card transition-shadow"
                onClick={() => navigate("/install")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {language === "de" ? "App installieren" : "Install App"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === "de" ? "Zum Startbildschirm hinzufügen" : "Add to home screen"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CalmCard>
            )}

            <CalmCard 
              variant="default" 
              className="cursor-pointer hover:shadow-card transition-shadow"
              onClick={handleRestartTour}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {language === "de" ? "Tour neu starten" : "Restart Tour"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "de" ? "App-Einführung wiederholen" : "Repeat app introduction"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CalmCard>

            {/* Admin Panel - Only visible to admins */}
            {isAdmin && (
              <CalmCard 
                variant="default" 
                className="cursor-pointer hover:shadow-card transition-shadow border-primary/30"
                onClick={() => navigate("/admin")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {language === "de" ? "Admin-Bereich" : "Admin Panel"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === "de" ? "Nutzer & Abos verwalten" : "Manage users & subscriptions"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CalmCard>
            )}
          </div>
        </motion.div>

        {/* Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            {language === "de" ? "Konto" : "Account"}
          </h2>
          
          {/* Account Settings Component */}
          <AccountSettings language={preferences.language} />
          
          {/* Logout - separate for visual distinction */}
          <div className="mt-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <CalmCard 
                  variant="default" 
                  className="cursor-pointer hover:shadow-card transition-shadow border-destructive/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <LogOut className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium text-destructive">
                          {language === "de" ? "Abmelden" : "Log out"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === "de" ? "Sitzung beenden" : "End your session"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CalmCard>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {language === "de" ? "Abmelden?" : "Log out?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === "de" 
                      ? "Du kannst dich jederzeit wieder anmelden. Deine Daten bleiben sicher gespeichert." 
                      : "You can log back in anytime. Your data will remain safely stored."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {language === "de" ? "Abbrechen" : "Cancel"}
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isLoggingOut 
                      ? (language === "de" ? "Wird abgemeldet..." : "Logging out...") 
                      : (language === "de" ? "Abmelden" : "Log out")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>

        {/* Legal & Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            {language === "de" ? "Rechtliches & Info" : "Legal & Info"}
          </h2>
          <div className="space-y-2">
            {/* Cookie Settings */}
            <CalmCard 
              className="cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={openCookieSettings}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Cookie className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-foreground">
                    {language === "de" ? "Cookie-Einstellungen" : "Cookie Settings"}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CalmCard>

            {/* Legal Links Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate("/privacy")}
                className="p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {language === "de" ? "Datenschutz" : "Privacy Policy"}
                </span>
              </button>
              <button
                onClick={() => navigate("/terms")}
                className="p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {language === "de" ? "AGB" : "Terms of Use"}
                </span>
              </button>
              <button
                onClick={() => navigate("/impressum")}
                className="p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {language === "de" ? "Impressum" : "Legal Notice"}
                </span>
              </button>
              <button
                onClick={() => navigate("/faq")}
                className="p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">FAQ</span>
              </button>
              <button
                onClick={() => navigate("/cancellation")}
                className="p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {language === "de" ? "Widerruf" : "Withdrawal"}
                </span>
              </button>
              <button
                onClick={() => navigate("/about")}
                className="p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {language === "de" ? "Über uns" : "About"}
                </span>
              </button>
              <button
                onClick={() => navigate("/contact")}
                className="col-span-2 p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {language === "de" ? "Kontakt" : "Contact"}
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center pt-6 pb-4"
        >
          <p className="text-xs text-muted-foreground">Soulvay v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">{t("settings.madeWithCare")}</p>
        </motion.div>
        </div>
      </div>
    </div>
  );
}

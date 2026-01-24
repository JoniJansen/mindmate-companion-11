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
  ChevronRight,
  Check,
  Sparkles,
  Palette,
  Monitor,
  Volume2,
  Download
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme, accentColorOptions, themeModeOptions, ThemeMode, AccentColor } from "@/hooks/useTheme";
import { useVoiceSettings, VoiceType, VoiceSpeed, VoiceLanguage } from "@/hooks/useVoiceSettings";
import { SubscriptionSection } from "@/components/premium/SubscriptionSection";
import { usePremium } from "@/hooks/usePremium";

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
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const { mode, accentColor, setMode, setAccentColor, isDark } = useTheme();
  const { settings: voiceSettings, updateSetting: updateVoiceSetting } = useVoiceSettings();
  const { checkSubscriptionStatus } = usePremium();

  // Handle Stripe redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: language === "de" ? "Willkommen bei MindMate Plus!" : "Welcome to MindMate Plus!",
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

  const voiceTypeOptions: { value: VoiceType; label: string }[] = [
    { value: "female", label: t("voice.female") },
    { value: "male", label: t("voice.male") },
    { value: "neutral", label: t("voice.neutral") },
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
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title={t("settings.title")} 
        subtitle={t("settings.subtitle")}
        showBack 
        backTo="/"
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-6">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Bell className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("settings.reminders")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings.dailyCheckin")}</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.notifications}
                  onCheckedChange={(checked) => updatePreference("notifications", checked)}
                />
              </div>
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
                      <span className="font-medium text-foreground">{option.label}</span>
                      {voiceSettings.voiceType === option.value && (
                        <Check className="w-5 h-5 text-primary" />
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
            <CalmCard variant="default" className="cursor-pointer hover:shadow-card transition-shadow">
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

            <CalmCard variant="default" className="cursor-pointer hover:shadow-card transition-shadow">
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
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center pt-4"
        >
          <p className="text-xs text-muted-foreground">MindMate v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">{t("settings.madeWithCare")}</p>
        </motion.div>
      </div>
    </div>
  );
}

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
  Sparkles
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

interface Preferences {
  language: "en" | "de";
  tone: "gentle" | "neutral" | "structured";
  addressForm: "du" | "sie";
  darkMode: boolean;
  notifications: boolean;
  innerDialogue: boolean;
}

const defaultPreferences: Preferences = {
  language: "en",
  tone: "gentle",
  addressForm: "du",
  darkMode: false,
  notifications: true,
  innerDialogue: false,
};

export default function Settings() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { toast } = useToast();
  const { t, language } = useTranslation();

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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title={t("settings.title")} 
        subtitle={t("settings.subtitle")}
        showBack 
        backTo="/chat"
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-6">
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

        {/* Appearance & Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t("settings.appearance")}</h2>
          <div className="space-y-3">
            <CalmCard variant="elevated">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    {preferences.darkMode ? (
                      <Moon className="w-5 h-5 text-foreground" />
                    ) : (
                      <Sun className="w-5 h-5 text-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("settings.darkMode")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings.useDarkTheme")}</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => updatePreference("darkMode", checked)}
                />
              </div>
            </CalmCard>

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

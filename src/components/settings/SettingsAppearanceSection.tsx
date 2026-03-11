import { motion } from "framer-motion";
import { Moon, Sun, Monitor, Bell, Sparkles, Palette, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CalmCard } from "@/components/shared/CalmCard";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme, accentColorOptions, themeModeOptions, ThemeMode, AccentColor } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";
import { NotificationSettings } from "@/components/settings/NotificationSettings";

interface Preferences {
  language: "en" | "de";
  tone: "gentle" | "neutral" | "structured";
  addressForm: "du" | "sie";
  notifications: boolean;
  innerDialogue: boolean;
}

interface Props {
  preferences: Preferences;
  expandedSection: string | null;
  toggleSection: (s: string) => void;
  updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}

export function SettingsAppearanceSection({ preferences, expandedSection, toggleSection, updatePreference }: Props) {
  const { t, language } = useTranslation();
  const { mode, accentColor, setMode, setAccentColor, isDark } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleThemeModeChange = (newMode: ThemeMode) => {
    setMode(newMode);
    toast({ title: t("settings.saved"), description: t("settings.preferencesUpdated") });
  };

  const handleAccentColorChange = (newColor: AccentColor) => {
    setAccentColor(newColor);
    toast({ title: t("settings.saved"), description: t("settings.preferencesUpdated") });
  };

  return (
    <>
      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t("settings.appearance")}</h2>
        <div className="space-y-3">
          {/* Theme Mode */}
          <CalmCard variant="elevated">
            <button onClick={() => toggleSection("themeMode")} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">{getModeIcon()}</div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{t("settings.darkMode")}</p>
                  <p className="text-sm text-muted-foreground">{getModeLabel()}</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "themeMode" ? "rotate-90" : ""}`} />
            </button>
            {expandedSection === "themeMode" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 pt-4 border-t border-border/50 space-y-2">
                {themeModeOptions.map((option) => (
                  <button key={option.value} onClick={() => handleThemeModeChange(option.value)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${mode === option.value ? "bg-primary-soft" : "hover:bg-muted/50"}`}>
                    <div className="flex items-center gap-3">
                      {option.value === "light" && <Sun className="w-5 h-5 text-foreground" />}
                      {option.value === "dark" && <Moon className="w-5 h-5 text-foreground" />}
                      {option.value === "system" && <Monitor className="w-5 h-5 text-foreground" />}
                      <span className="font-medium text-foreground">{language === "de" ? option.labelDe : option.label}</span>
                    </div>
                    {mode === option.value && <Check className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </motion.div>
            )}
          </CalmCard>

          {/* Accent Color */}
          <CalmCard variant="elevated">
            <button onClick={() => toggleSection("accentColor")} className="w-full flex items-center justify-between">
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
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 pt-4 border-t border-border/50">
                <div className="grid grid-cols-3 gap-3">
                  {accentColorOptions.map((option) => (
                    <button key={option.value} onClick={() => handleAccentColorChange(option.value)} className={`flex flex-col items-center p-3 rounded-xl transition-colors ${accentColor === option.value ? "bg-primary-soft ring-2 ring-primary" : "hover:bg-muted/50"}`}>
                      <div className={`w-8 h-8 rounded-full ${option.color} mb-2`} />
                      <span className="text-xs font-medium text-foreground text-center">{language === "de" ? option.labelDe : option.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </CalmCard>

          {/* Notifications */}
          <CalmCard variant="elevated">
            <button onClick={() => toggleSection("notifications")} className="w-full flex items-center justify-between">
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
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 pt-4 border-t border-border/50">
                <NotificationSettings />
              </motion.div>
            )}
          </CalmCard>

          {/* Inner Dialogue */}
          <CalmCard variant="elevated">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("settings.innerDialogue")}</p>
                  <p className="text-sm text-muted-foreground">{t("settings.innerDialogueDesc")}</p>
                </div>
              </div>
              <Switch checked={preferences.innerDialogue} onCheckedChange={(checked) => updatePreference("innerDialogue", checked)} />
            </div>
          </CalmCard>
        </div>
      </motion.div>
    </>
  );
}

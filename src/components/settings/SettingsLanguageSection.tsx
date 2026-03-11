import { motion } from "framer-motion";
import { Globe, ChevronRight, Check, User, MessageSquare } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";

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

export function SettingsLanguageSection({ preferences, expandedSection, toggleSection, updatePreference }: Props) {
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

  return (
    <>
      {/* Language */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t("settings.languageRegion")}</h2>
        <CalmCard variant="elevated">
          <button onClick={() => toggleSection("language")} className="w-full flex items-center justify-between">
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
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 pt-4 border-t border-border/50 space-y-2">
              {languageOptions.map((option) => (
                <button key={option.value} onClick={() => updatePreference("language", option.value as "en" | "de")} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${preferences.language === option.value ? "bg-primary-soft" : "hover:bg-muted/50"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{option.flag}</span>
                    <span className="font-medium text-foreground">{option.label}</span>
                  </div>
                  {preferences.language === option.value && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </motion.div>
          )}
        </CalmCard>
      </motion.div>

      {/* Tone */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t("settings.conversationStyle")}</h2>
        <CalmCard variant="elevated">
          <button onClick={() => toggleSection("tone")} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
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
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 pt-4 border-t border-border/50 space-y-2">
              {toneOptions.map((option) => (
                <button key={option.value} onClick={() => updatePreference("tone", option.value as "gentle" | "neutral" | "structured")} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${preferences.tone === option.value ? "bg-primary-soft" : "hover:bg-muted/50"}`}>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {preferences.tone === option.value && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </motion.div>
          )}
        </CalmCard>

        {/* Address Form - Only for German */}
        {preferences.language === "de" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
            <CalmCard variant="elevated">
              <button onClick={() => toggleSection("address")} className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
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
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 pt-4 border-t border-border/50 space-y-2">
                  {addressOptions.map((option) => (
                    <button key={option.value} onClick={() => updatePreference("addressForm", option.value as "du" | "sie")} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${preferences.addressForm === option.value ? "bg-primary-soft" : "hover:bg-muted/50"}`}>
                      <div className="text-left">
                        <p className="font-medium text-foreground">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      {preferences.addressForm === option.value && <Check className="w-5 h-5 text-primary" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </CalmCard>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

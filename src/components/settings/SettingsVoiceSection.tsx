import { motion } from "framer-motion";
import { Volume2, Globe, MessageSquare, ChevronRight, Check } from "lucide-react";
import { Circle, AudioLines, Smile } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/useTranslation";
import { useVoiceSettings, VoiceType, VoiceSpeed, VoiceLanguage, AvatarStyle } from "@/hooks/useVoiceSettings";
import { useToast } from "@/hooks/use-toast";

interface Props {
  expandedSection: string | null;
  toggleSection: (s: string) => void;
}

export function SettingsVoiceSection({ expandedSection, toggleSection }: Props) {
  const { t, language } = useTranslation();
  const { settings: voiceSettings, updateSetting: updateVoiceSetting } = useVoiceSettings();
  const { toast } = useToast();

  const voiceTypeOptions: { value: VoiceType; label: string; description: string }[] = [
    { value: "female", label: language === "de" ? "Warm" : "Warm", description: language === "de" ? "Ruhig & vertraut" : "Calm & familiar" },
    { value: "femaleSoft", label: language === "de" ? "Sanft" : "Soft", description: language === "de" ? "Besonders weich & beruhigend" : "Extra soft & soothing" },
    { value: "femaleBright", label: language === "de" ? "Klar" : "Bright", description: language === "de" ? "Leicht & freundlich" : "Light & friendly" },
    { value: "male", label: language === "de" ? "Klar" : "Clear", description: language === "de" ? "Vertrauensvoll & deutlich" : "Trustworthy & clear" },
    { value: "maleDeep", label: language === "de" ? "Tief" : "Deep", description: language === "de" ? "Ruhig & tiefer" : "Lower & grounded" },
    { value: "neutral", label: language === "de" ? "Neutral" : "Neutral", description: language === "de" ? "Sanft & ausgeglichen" : "Soft & balanced" },
    { value: "neutralWarm", label: language === "de" ? "Warm neutral" : "Warm neutral", description: language === "de" ? "Ausgeglichen mit Wärme" : "Balanced with warmth" },
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

  const saved = () => toast({ title: t("settings.saved"), description: t("settings.preferencesUpdated") });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
      <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t("voice.title")}</h2>
      <div className="space-y-3">
        {/* Voice Type */}
        <CalmCard variant="elevated">
          <button onClick={() => toggleSection("voiceType")} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{t("voice.voiceType")}</p>
                <p className="text-sm text-muted-foreground">{voiceTypeOptions.find(o => o.value === voiceSettings.voiceType)?.label}</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "voiceType" ? "rotate-90" : ""}`} />
          </button>
          {expandedSection === "voiceType" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 pt-4 border-t border-border/50 space-y-2">
              {voiceTypeOptions.map((option) => (
                <button key={option.value} onClick={() => { updateVoiceSetting("voiceType", option.value); saved(); }} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${voiceSettings.voiceType === option.value ? "bg-primary-soft" : "hover:bg-muted/50"}`}>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {voiceSettings.voiceType === option.value && <Check className="w-5 h-5 text-primary shrink-0" />}
                </button>
              ))}
            </motion.div>
          )}
        </CalmCard>

        {/* Speaking Speed */}
        <CalmCard variant="elevated">
          <button onClick={() => toggleSection("voiceSpeed")} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{t("voice.speed")}</p>
                <p className="text-sm text-muted-foreground">{voiceSpeedOptions.find(o => o.value === voiceSettings.speed)?.label}</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "voiceSpeed" ? "rotate-90" : ""}`} />
          </button>
          {expandedSection === "voiceSpeed" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 pt-4 border-t border-border/50 space-y-2">
              {voiceSpeedOptions.map((option) => (
                <button key={option.value} onClick={() => { updateVoiceSetting("speed", option.value); saved(); }} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${voiceSettings.speed === option.value ? "bg-primary-soft" : "hover:bg-muted/50"}`}>
                  <span className="font-medium text-foreground">{option.label}</span>
                  {voiceSettings.speed === option.value && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </motion.div>
          )}
        </CalmCard>

        {/* Voice Language */}
        <CalmCard variant="elevated">
          <button onClick={() => toggleSection("voiceLanguage")} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{t("voice.language")}</p>
                <p className="text-sm text-muted-foreground">{voiceLanguageOptions.find(o => o.value === voiceSettings.language)?.label}</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "voiceLanguage" ? "rotate-90" : ""}`} />
          </button>
          {expandedSection === "voiceLanguage" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 pt-4 border-t border-border/50 space-y-2">
              {voiceLanguageOptions.map((option) => (
                <button key={option.value} onClick={() => { updateVoiceSetting("language", option.value); saved(); }} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${voiceSettings.language === option.value ? "bg-primary-soft" : "hover:bg-muted/50"}`}>
                  <span className="font-medium text-foreground">{option.label}</span>
                  {voiceSettings.language === option.value && <Check className="w-5 h-5 text-primary" />}
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
            <Switch checked={voiceSettings.autoPlayReplies} onCheckedChange={(checked) => { updateVoiceSetting("autoPlayReplies", checked); saved(); }} />
          </div>
        </CalmCard>

        {/* Avatar Style */}
        <CalmCard variant="elevated">
          <button onClick={() => toggleSection("avatarStyle")} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                <Smile className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{t("settings.avatarStyle")}</p>
                <p className="text-sm text-muted-foreground">{avatarStyleOptions.find(o => o.value === voiceSettings.avatarStyle)?.[language === "de" ? "labelDe" : "label"]}</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSection === "avatarStyle" ? "rotate-90" : ""}`} />
          </button>
          {expandedSection === "avatarStyle" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 pt-4 border-t border-border/50 space-y-2">
              {avatarStyleOptions.map((option) => (
                <button key={option.value} onClick={() => { updateVoiceSetting("avatarStyle", option.value); saved(); }} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${voiceSettings.avatarStyle === option.value ? "bg-primary-soft" : "hover:bg-muted/50"}`}>
                  <div className="flex items-center gap-3">
                    <div className="text-primary">{option.icon}</div>
                    <span className="font-medium text-foreground">{language === "de" ? option.labelDe : option.label}</span>
                  </div>
                  {voiceSettings.avatarStyle === option.value && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </motion.div>
          )}
        </CalmCard>
      </div>
    </motion.div>
  );
}

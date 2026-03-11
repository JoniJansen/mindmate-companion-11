import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { SubscriptionSection } from "@/components/premium/SubscriptionSection";
import { SettingsLanguageSection } from "@/components/settings/SettingsLanguageSection";
import { SettingsAppearanceSection } from "@/components/settings/SettingsAppearanceSection";
import { SettingsVoiceSection } from "@/components/settings/SettingsVoiceSection";
import { SettingsSupportSection } from "@/components/settings/SettingsSupportSection";
import { SettingsAccountSection } from "@/components/settings/SettingsAccountSection";
import { SettingsLegalSection } from "@/components/settings/SettingsLegalSection";

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

  const { checkSubscriptionStatus } = usePremium();
  const { user } = useAuth();
  const { isAdmin, checkAdminStatus } = useAdmin();

  useEffect(() => {
    if (user) checkAdminStatus();
  }, [user, checkAdminStatus]);

  // Handle Stripe redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: t("settings.welcomePlus"), description: t("settings.upgradeSuccess") });
      checkSubscriptionStatus();
    } else if (searchParams.get("canceled") === "true") {
      toast({ title: t("settings.checkoutCanceled"), description: t("settings.upgradeAnytime") });
    }
  }, [searchParams, toast, language, checkSubscriptionStatus]);

  // Load preferences
  useEffect(() => {
    try {
      const stored = localStorage.getItem("soulvay-preferences") || localStorage.getItem("mindmate-preferences");
      if (stored) setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem("soulvay-preferences", JSON.stringify(updated));
    // Keep legacy key in sync for other consumers during migration
    localStorage.setItem("mindmate-preferences", JSON.stringify(updated));
    
    const targetLang = key === "language" ? (value as string) : language;
    const savedTitle = targetLang === "de" ? "Einstellungen gespeichert" : "Settings saved";
    const savedDesc = targetLang === "de" ? "Deine Einstellungen wurden aktualisiert." : "Your preferences have been updated.";
    toast({ title: savedTitle, description: savedDesc });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} showBack backTo="/" />

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="px-4 py-4 pb-32 max-w-lg mx-auto space-y-6">
          <SubscriptionSection onUpgradeClick={() => navigate("/upgrade")} />
          
          <SettingsLanguageSection
            preferences={preferences}
            expandedSection={expandedSection}
            toggleSection={toggleSection}
            updatePreference={updatePreference}
          />

          <SettingsAppearanceSection
            preferences={preferences}
            expandedSection={expandedSection}
            toggleSection={toggleSection}
            updatePreference={updatePreference}
          />

          <SettingsVoiceSection
            expandedSection={expandedSection}
            toggleSection={toggleSection}
          />

          <SettingsSupportSection isAdmin={isAdmin} />

          <SettingsAccountSection language={preferences.language} />

          <SettingsLegalSection />

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-center pt-6 pb-4">
            <p className="text-xs text-muted-foreground">Soulvay v1.0.0</p>
            <p className="text-xs text-muted-foreground mt-1">{t("settings.madeWithCare")}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { usePreferences } from "@/hooks/usePreferences";
import { SubscriptionSection } from "@/components/premium/SubscriptionSection";
import { SettingsLanguageSection } from "@/components/settings/SettingsLanguageSection";
import { SettingsAppearanceSection } from "@/components/settings/SettingsAppearanceSection";
import { SettingsVoiceSection } from "@/components/settings/SettingsVoiceSection";
import { SettingsSupportSection } from "@/components/settings/SettingsSupportSection";
import { SettingsAccountSection } from "@/components/settings/SettingsAccountSection";
import { SettingsLegalSection } from "@/components/settings/SettingsLegalSection";
import { SettingsCompanionSection } from "@/components/settings/SettingsCompanionSection";

interface Preferences {
  language: "en" | "de";
  tone: "gentle" | "neutral" | "structured";
  addressForm: "du" | "sie";
  notifications: boolean;
  innerDialogue: boolean;
}

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { preferences, updatePreference: updatePref } = usePreferences();
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);
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

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    updatePref(key, value);
    
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
          <SettingsCompanionSection />
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

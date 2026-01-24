import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Settings, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ConsentSettings = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

const defaultSettings: ConsentSettings = {
  essential: true, // Always required
  analytics: false,
  marketing: false,
  timestamp: "",
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ConsentSettings>(defaultSettings);
  const [language, setLanguage] = useState<"en" | "de">("en");

  useEffect(() => {
    const stored = localStorage.getItem("mindmate_language") || "en";
    setLanguage(stored as "en" | "de");

    // Check if consent was already given
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(consent);
        setSettings(parsed);
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  const texts = {
    en: {
      title: "Cookie Settings",
      description: "We use cookies to enhance your experience. You can customize your preferences below.",
      essential: "Essential Cookies",
      essentialDesc: "Required for the app to function properly. Cannot be disabled.",
      analytics: "Analytics Cookies",
      analyticsDesc: "Help us understand how you use the app to improve it.",
      marketing: "Marketing Cookies",
      marketingDesc: "Used to show you relevant content and offers.",
      acceptAll: "Accept All",
      rejectAll: "Reject All",
      customize: "Customize",
      saveSettings: "Save Settings",
      privacyLink: "Privacy Policy",
    },
    de: {
      title: "Cookie-Einstellungen",
      description: "Wir verwenden Cookies, um dein Erlebnis zu verbessern. Du kannst deine Präferenzen unten anpassen.",
      essential: "Essenzielle Cookies",
      essentialDesc: "Erforderlich für die Funktion der App. Kann nicht deaktiviert werden.",
      analytics: "Analyse-Cookies",
      analyticsDesc: "Helfen uns zu verstehen, wie du die App nutzt, um sie zu verbessern.",
      marketing: "Marketing-Cookies",
      marketingDesc: "Werden verwendet, um dir relevante Inhalte und Angebote zu zeigen.",
      acceptAll: "Alle akzeptieren",
      rejectAll: "Alle ablehnen",
      customize: "Anpassen",
      saveSettings: "Einstellungen speichern",
      privacyLink: "Datenschutzrichtlinie",
    },
  };

  const t = texts[language];

  const saveConsent = (newSettings: ConsentSettings) => {
    const finalSettings = {
      ...newSettings,
      essential: true, // Always true
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("cookie_consent", JSON.stringify(finalSettings));
    setSettings(finalSettings);
    setShowBanner(false);
    setShowSettings(false);

    // Dispatch event for analytics to listen to
    window.dispatchEvent(new CustomEvent("cookie_consent_updated", { detail: finalSettings }));
  };

  const handleAcceptAll = () => {
    saveConsent({ ...settings, analytics: true, marketing: true });
  };

  const handleRejectAll = () => {
    saveConsent({ ...settings, analytics: false, marketing: false });
  };

  const handleSaveSettings = () => {
    saveConsent(settings);
  };

  if (!showBanner) return null;

  return (
    <>
      <AnimatePresence>
        {showBanner && !showSettings && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          >
            <div className="mx-auto max-w-4xl">
              <div className="bg-card border border-border rounded-2xl shadow-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Cookie className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">{t.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t.description}{" "}
                      <a href="/privacy" className="text-primary hover:underline">
                        {t.privacyLink}
                      </a>
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={handleAcceptAll} className="gap-2">
                        <Check className="w-4 h-4" />
                        {t.acceptAll}
                      </Button>
                      <Button variant="outline" onClick={handleRejectAll} className="gap-2">
                        <X className="w-4 h-4" />
                        {t.rejectAll}
                      </Button>
                      <Button variant="ghost" onClick={() => setShowSettings(true)} className="gap-2">
                        <Settings className="w-4 h-4" />
                        {t.customize}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              {t.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Essential Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{t.essential}</h4>
                <p className="text-sm text-muted-foreground">{t.essentialDesc}</p>
              </div>
              <Switch checked disabled className="opacity-50" />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{t.analytics}</h4>
                <p className="text-sm text-muted-foreground">{t.analyticsDesc}</p>
              </div>
              <Switch
                checked={settings.analytics}
                onCheckedChange={(checked) => setSettings({ ...settings, analytics: checked })}
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{t.marketing}</h4>
                <p className="text-sm text-muted-foreground">{t.marketingDesc}</p>
              </div>
              <Switch
                checked={settings.marketing}
                onCheckedChange={(checked) => setSettings({ ...settings, marketing: checked })}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              {language === "de" ? "Abbrechen" : "Cancel"}
            </Button>
            <Button onClick={handleSaveSettings}>{t.saveSettings}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper to check if analytics is allowed
export function isAnalyticsAllowed(): boolean {
  try {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) return false;
    const parsed = JSON.parse(consent);
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

// Helper to check if marketing is allowed
export function isMarketingAllowed(): boolean {
  try {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) return false;
    const parsed = JSON.parse(consent);
    return parsed.marketing === true;
  } catch {
    return false;
  }
}

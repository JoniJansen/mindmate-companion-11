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
  essential: true,
  analytics: false,
  marketing: false,
  timestamp: "",
};

// Global event for opening cookie settings
export const COOKIE_SETTINGS_EVENT = "open_cookie_settings";

// Function to trigger opening cookie settings from anywhere
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT));
}

import { isNativeApp } from "@/lib/nativeDetect";

/**
 * Check if running on native app (Capacitor) — skip cookie banner entirely
 */
function isCapacitorNative(): boolean {
  return isNativeApp();
}

/**
 * Detects the user's preferred language from multiple sources:
 * 1. Saved preferences (soulvay-preferences.language)
 * 2. Browser/system language (navigator.language)
 * 3. Fallback to English
 */
function detectLanguage(): "en" | "de" {
  try {
    // First priority: Check saved preferences (from onboarding or settings)
    const prefsRaw = localStorage.getItem("soulvay-preferences") || localStorage.getItem("mindmate-preferences");
    if (prefsRaw) {
      const prefs = JSON.parse(prefsRaw);
      if (prefs.language === "de" || prefs.language === "en") {
        return prefs.language;
      }
    }
    
    // Second priority: Check browser/system language
    const browserLang = navigator.language || (navigator as any).userLanguage || "";
    if (browserLang.toLowerCase().startsWith("de")) {
      return "de";
    }
    
    // Fallback to English
    return "en";
  } catch {
    return "en";
  }
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ConsentSettings>(defaultSettings);
  const [language, setLanguage] = useState<"en" | "de">(() => detectLanguage());

  // Initial setup and listen for preference changes
  useEffect(() => {
    // Re-detect language on mount (in case preferences were just set)
    setLanguage(detectLanguage());

    // IMPORTANT: Do NOT show cookie banner on iOS native app
    // Apple rejected the app for using cookies without AppTrackingTransparency
    // Since Soulvay doesn't actually track users, we simply skip the cookie banner on iOS
    if (isCapacitorNative()) {
      // Auto-accept essential-only on iOS (no tracking, no banner needed)
      const essentialOnly: ConsentSettings = {
        essential: true,
        analytics: false,
        marketing: false,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("cookie_consent", JSON.stringify(essentialOnly));
      setSettings(essentialOnly);
      return;
    }

    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
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
  
  // Listen for preference changes (e.g., when user completes onboarding)
  useEffect(() => {
    const handleStorageChange = () => {
      setLanguage(detectLanguage());
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Also poll for same-tab changes (localStorage events don't fire in same tab)
    const interval = setInterval(() => {
      const newLang = detectLanguage();
      if (newLang !== language) {
        setLanguage(newLang);
      }
    }, 500);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [language]);

  // Listen for external open event
  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettings(true);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, handleOpenSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, handleOpenSettings);
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
      essential: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("cookie_consent", JSON.stringify(finalSettings));
    setSettings(finalSettings);
    setShowBanner(false);
    setShowSettings(false);
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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{t.essential}</h4>
                <p className="text-sm text-muted-foreground">{t.essentialDesc}</p>
              </div>
              <Switch checked disabled className="opacity-50" />
            </div>

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

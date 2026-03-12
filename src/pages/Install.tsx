import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Monitor, CheckCircle2, ArrowLeft } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";
import logoImage from "@/assets/logo.png";
import { isNativeApp } from "@/lib/nativeDetect";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Native builds should never show PWA install page (Apple Guideline 2.3.10)
  if (isNativeApp()) return <Navigate to="/home" replace />;

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const content = {
    de: {
      title: "Soulvay installieren",
      subtitle: "Installiere die App für schnellen Zugriff",
      installed: "App bereits installiert",
      installedDesc: "Soulvay ist bereits auf deinem Gerät installiert.",
      openApp: "App öffnen",
      installButton: "Jetzt installieren",
      iosTitle: "Installation auf iPhone/iPad",
      iosSteps: [
        "Tippe auf das Teilen-Symbol unten",
        "Scrolle nach unten und tippe auf 'Zum Home-Bildschirm'",
        "Tippe auf 'Hinzufügen'"
      ],
      benefits: [
        "Schneller Zugriff vom Startbildschirm",
        "Funktioniert auch offline",
        "Keine App-Store Registrierung nötig",
        "Automatische Updates"
      ],
      benefitsTitle: "Vorteile der Installation"
    },
    en: {
      title: "Install Soulvay",
      subtitle: "Install the app for quick access",
      installed: "App already installed",
      installedDesc: "Soulvay is already installed on your device.",
      openApp: "Open App",
      installButton: "Install Now",
      iosTitle: "Installation on iPhone/iPad",
      iosSteps: [
        "Tap the Share button at the bottom",
        "Scroll down and tap 'Add to Home Screen'",
        "Tap 'Add'"
      ],
      benefits: [
        "Quick access from home screen",
        "Works offline",
        "No app store registration needed",
        "Automatic updates"
      ],
      benefitsTitle: "Benefits of Installing"
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 safe-top">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">{t.title}</h1>
        </div>

        <div className="space-y-6">
          {/* Logo & Intro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
              <img src={logoImage} alt="Soulvay" className="w-full h-full object-cover" />
            </div>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </motion.div>

          {isInstalled ? (
            <CalmCard className="text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-lg font-medium mb-2">{t.installed}</h2>
              <p className="text-muted-foreground mb-4">{t.installedDesc}</p>
              <Button onClick={() => navigate("/chat")} className="w-full">
                {t.openApp}
              </Button>
            </CalmCard>
          ) : isIOS ? (
            <CalmCard>
              <div className="flex items-center gap-3 mb-4">
                <Smartphone className="w-6 h-6 text-primary" />
                <h2 className="text-lg font-medium">{t.iosTitle}</h2>
              </div>
              <ol className="space-y-3">
                {t.iosSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </CalmCard>
          ) : deferredPrompt ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                onClick={handleInstall}
                size="lg"
                className="w-full h-14 text-lg gap-3"
              >
                <Download className="w-5 h-5" />
                {t.installButton}
              </Button>
            </motion.div>
          ) : (
            <CalmCard className="text-center">
              <Monitor className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {language === "de"
                  ? "Öffne diese Seite in deinem mobilen Browser, um die App zu installieren."
                  : "Open this page in your mobile browser to install the app."}
              </p>
            </CalmCard>
          )}

          {/* Benefits */}
          <CalmCard>
            <h3 className="font-medium mb-4">{t.benefitsTitle}</h3>
            <ul className="space-y-3">
              {t.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </CalmCard>
        </div>
      </div>
    </div>
  );
}

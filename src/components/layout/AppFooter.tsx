import { useNavigate } from "react-router-dom";
import { Cookie } from "lucide-react";
import { openCookieSettings } from "@/components/gdpr/CookieConsent";
import { useEffect, useState } from "react";

export function AppFooter() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<"en" | "de">("en");

  useEffect(() => {
    const stored = localStorage.getItem("mindmate_language") || "en";
    setLanguage(stored as "en" | "de");
  }, []);

  const texts = {
    en: {
      privacy: "Privacy",
      terms: "Terms",
      impressum: "Legal Notice",
      faq: "FAQ",
      cancellation: "Withdrawal",
      cookies: "Cookie Settings",
    },
    de: {
      privacy: "Datenschutz",
      terms: "AGB",
      impressum: "Impressum",
      faq: "FAQ",
      cancellation: "Widerruf",
      cookies: "Cookie-Einstellungen",
    },
  };

  const t = texts[language];

  return (
    <footer className="py-4 border-t border-border/40 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <button 
            onClick={() => navigate("/privacy")} 
            className="hover:text-foreground transition-colors"
          >
            {t.privacy}
          </button>
          <span className="text-border">•</span>
          <button 
            onClick={() => navigate("/terms")} 
            className="hover:text-foreground transition-colors"
          >
            {t.terms}
          </button>
          <span className="text-border">•</span>
          <button 
            onClick={() => navigate("/impressum")} 
            className="hover:text-foreground transition-colors"
          >
            {t.impressum}
          </button>
          <span className="text-border">•</span>
          <button 
            onClick={() => navigate("/faq")} 
            className="hover:text-foreground transition-colors"
          >
            {t.faq}
          </button>
          <span className="text-border">•</span>
          <button 
            onClick={() => navigate("/cancellation")} 
            className="hover:text-foreground transition-colors"
          >
            {t.cancellation}
          </button>
          <span className="text-border">•</span>
          <button 
            onClick={openCookieSettings}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Cookie className="w-3 h-3" />
            {t.cookies}
          </button>
        </div>
      </div>
    </footer>
  );
}

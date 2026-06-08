import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { isNativeApp } from "@/lib/nativeDetect";
import {
  nativeCrashConsentDecided,
  setNativeCrashConsent,
} from "@/lib/sentry";

/**
 * Native-only first-launch opt-in for crash reporting (DSGVO Art. 6 (1) a).
 * Default: OFF. User must actively grant consent.
 * After decision (grant or deny), modal is suppressed; preference can later
 * be changed via Settings → Datenschutz.
 */
export function NativeCrashConsentModal() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"de" | "en">("de");

  useEffect(() => {
    if (!isNativeApp()) return;
    if (nativeCrashConsentDecided()) return;

    try {
      const prefsRaw = localStorage.getItem("soulvay-preferences");
      if (prefsRaw) {
        const prefs = JSON.parse(prefsRaw);
        if (prefs.language === "en") setLang("en");
      } else if (navigator.language?.toLowerCase().startsWith("en")) {
        setLang("en");
      }
    } catch {
      /* default de */
    }

    // Slight delay so the modal doesn't compete with first paint.
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const handleGrant = () => {
    setNativeCrashConsent(true);
    setOpen(false);
  };

  const handleDeny = () => {
    setNativeCrashConsent(false);
    setOpen(false);
  };

  const t = lang === "de"
    ? {
        title: "Hilfst du uns, Soulvay stabiler zu machen?",
        body: "Soulvay kann anonymisierte Absturzberichte an Sentry (EU-Hosting) senden, damit wir Fehler erkennen und beheben können. Keine Gesprächsinhalte, keine Tracking-Identifier, keine Weitergabe an Dritte.",
        grant: "Ja, helfen",
        deny: "Nein danke",
        hint: "Du kannst diese Entscheidung jederzeit in den Einstellungen ändern.",
      }
    : {
        title: "Help us keep Soulvay stable?",
        body: "Soulvay can send anonymous crash reports to Sentry (EU-hosted) so we can detect and fix errors. No conversation content, no tracking identifiers, no third-party sharing.",
        grant: "Yes, help",
        deny: "No thanks",
        hint: "You can change this anytime in Settings.",
      };

  if (!isNativeApp()) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDeny(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-left">{t.title}</DialogTitle>
          <DialogDescription className="text-left pt-2 leading-relaxed">
            {t.body}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={handleGrant} className="w-full">{t.grant}</Button>
          <Button onClick={handleDeny} variant="ghost" className="w-full">{t.deny}</Button>
          <p className="text-xs text-muted-foreground text-center pt-2">{t.hint}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

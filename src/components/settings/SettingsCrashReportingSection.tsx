import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isNativeApp } from "@/lib/nativeDetect";
import { isCrashReportingAllowed, setNativeCrashConsent, initSentry } from "@/lib/sentry";
import { usePreferences } from "@/hooks/usePreferences";

/**
 * Native-only Settings toggle for crash reporting consent (DSGVO Art. 7 (3) — Widerruf).
 * Web user toggles crash-reporting via cookie consent dialog (CookieConsent.tsx) instead.
 *
 * Mirrors SettingsAIConsentSection pattern: AlertDialog only on ON→OFF (withdrawal),
 * silent ON activation. Header is intentionally omitted so this card visually groups
 * under the shared "Datenschutz" header rendered by SettingsAIConsentSection.
 */
export function SettingsCrashReportingSection() {
  // Render gate must run in effect to avoid SSR-style mismatches in some webview boots.
  const [mounted, setMounted] = useState(false);
  const [native, setNative] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const { preferences } = usePreferences();
  const lang = preferences.language;

  useEffect(() => {
    setMounted(true);
    setNative(isNativeApp());
    setEnabled(isCrashReportingAllowed());

    const onUpdate = () => setEnabled(isCrashReportingAllowed());
    window.addEventListener("cookie_consent_updated", onUpdate);
    return () => window.removeEventListener("cookie_consent_updated", onUpdate);
  }, []);

  if (!mounted || !native) return null;

  const handleToggle = (checked: boolean) => {
    if (checked) {
      setNativeCrashConsent(true);
      setEnabled(true);
      // Re-init in case Sentry was previously closed via consent withdrawal.
      initSentry();
    } else {
      setConfirmRevoke(true);
    }
  };

  const handleConfirmRevoke = () => {
    setNativeCrashConsent(false);
    setEnabled(false);
    setConfirmRevoke(false);
  };

  const t = lang === "de"
    ? {
        label: "Absturzberichte teilen",
        sub: "Hilft uns, Soulvay stabiler zu machen. Anonymisiert, EU-Hosting.",
        title: "Absturzberichte deaktivieren?",
        desc: "Soulvay sendet dann keine Stabilitätsdaten mehr. Du kannst es jederzeit wieder aktivieren.",
        cancel: "Abbrechen",
        confirm: "Deaktivieren",
      }
    : {
        label: "Share crash reports",
        sub: "Helps us keep Soulvay stable. Anonymized, EU-hosted.",
        title: "Disable crash reports?",
        desc: "Soulvay will stop sending stability data. You can re-enable anytime.",
        cancel: "Cancel",
        confirm: "Disable",
      };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
      <CalmCard>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground">{t.label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{t.sub}</p>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            aria-label={t.label}
            className="mt-1 shrink-0"
          />
        </div>
      </CalmCard>

      <AlertDialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.title}</AlertDialogTitle>
            <AlertDialogDescription>{t.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRevoke}>{t.confirm}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

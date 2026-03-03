import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useVoiceSettings } from "@/hooks/useVoiceSettings";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { usePremium } from "@/hooks/usePremium";
import { CalmCard } from "@/components/shared/CalmCard";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiagEntry {
  label: string;
  value: string;
  status?: "ok" | "warn" | "error";
}

export default function Diagnostics() {
  const { language } = useTranslation();
  const { settings, getVoiceId, getEffectiveLanguage } = useVoiceSettings();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { isPremium } = usePremium();
  const [micStatus, setMicStatus] = useState<string>("checking...");
  const [copied, setCopied] = useState(false);
  const [safeAreas, setSafeAreas] = useState({ top: "0", bottom: "0", left: "0", right: "0" });

  useEffect(() => {
    // Check mic permission
    navigator.permissions?.query({ name: "microphone" as PermissionName })
      .then(result => setMicStatus(result.state))
      .catch(() => setMicStatus("unavailable"));

    // Read safe area insets
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    setSafeAreas({
      top: cs.getPropertyValue("env(safe-area-inset-top)") || "0px",
      bottom: cs.getPropertyValue("env(safe-area-inset-bottom)") || "0px",
      left: cs.getPropertyValue("env(safe-area-inset-left)") || "0px",
      right: cs.getPropertyValue("env(safe-area-inset-right)") || "0px",
    });
  }, []);

  const effectiveLang = getEffectiveLanguage(language as "en" | "de");
  const voiceId = getVoiceId(language as "en" | "de");

  const entries: DiagEntry[] = [
    { label: "App Language", value: language, status: "ok" },
    { label: "Voice Language Setting", value: settings.language },
    { label: "Effective Voice Language", value: effectiveLang, status: effectiveLang === language ? "ok" : "warn" },
    { label: "Voice Type", value: settings.voiceType },
    { label: "Voice ID", value: voiceId },
    { label: "Voice Speed", value: String(settings.speed) },
    { label: "Auto-play Replies", value: settings.autoPlayReplies ? "ON" : "OFF" },
    { label: "Avatar Style", value: settings.avatarStyle },
    { label: "Mic Permission", value: micStatus, status: micStatus === "granted" ? "ok" : micStatus === "denied" ? "error" : "warn" },
    { label: "Network", value: isOnline ? "Online" : "Offline", status: isOnline ? "ok" : "error" },
    { label: "Premium", value: isPremium ? "Active" : "Free", status: isPremium ? "ok" : "warn" },
    { label: "User ID", value: user?.id?.slice(0, 8) + "..." || "not logged in" },
    { label: "Platform", value: navigator.userAgent.includes("iPhone") ? "iOS" : navigator.userAgent.includes("Android") ? "Android" : "Web" },
    { label: "Screen", value: `${window.innerWidth}×${window.innerHeight} (${window.devicePixelRatio}x)` },
    { label: "Safe Area Top", value: safeAreas.top || "0px" },
    { label: "Safe Area Bottom", value: safeAreas.bottom || "0px" },
    { label: "Dark Mode", value: document.documentElement.classList.contains("dark") ? "ON" : "OFF" },
    { label: "Build", value: import.meta.env.DEV ? "Development" : "Production" },
  ];

  const handleCopy = () => {
    const text = entries.map(e => `${e.label}: ${e.value}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusDot = (s?: "ok" | "warn" | "error") => {
    if (!s) return null;
    const colors = { ok: "bg-green-500", warn: "bg-yellow-500", error: "bg-red-500" };
    return <span className={`inline-block w-2 h-2 rounded-full ${colors[s]}`} />;
  };

  return (
    <div className="fixed inset-0 bg-background overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" as any }}>
      <PageHeader title="Diagnostics" subtitle="System status & debugging" showBack backTo="/settings" showSettings={false} />
      
      <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy All"}
          </Button>
        </div>

        <CalmCard>
          <div className="divide-y divide-border/30">
            {entries.map((entry) => (
              <div key={entry.label} className="flex items-center justify-between py-2.5 px-1">
                <span className="text-sm text-muted-foreground">{entry.label}</span>
                <div className="flex items-center gap-2">
                  {statusDot(entry.status)}
                  <span className="text-sm font-medium text-foreground text-right max-w-[200px] truncate">
                    {entry.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CalmCard>

        <CalmCard>
          <h3 className="font-medium text-foreground mb-2">Error Log</h3>
          <p className="text-sm text-muted-foreground">No recent errors captured.</p>
        </CalmCard>
      </div>
    </div>
  );
}
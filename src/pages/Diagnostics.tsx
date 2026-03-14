import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useVoiceSettings } from "@/hooks/useVoiceSettings";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { usePremium } from "@/hooks/usePremium";
import { useNetworkSimulator, type NetworkSimMode } from "@/hooks/useNetworkSimulator";
import { useEntitlementSimulator, type SimulatedEntitlement } from "@/hooks/useEntitlementSimulator";
import { CalmCard } from "@/components/shared/CalmCard";
import { Copy, Check, Mic, MicOff, Wifi, WifiOff, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";

interface DiagEntry {
  label: string;
  value: string;
  status?: "ok" | "warn" | "error";
}

const NETWORK_MODES: { value: NetworkSimMode; label: string; icon: string }[] = [
  { value: "real", label: "Real", icon: "🌐" },
  { value: "offline", label: "Offline", icon: "📴" },
  { value: "slow", label: "Slow", icon: "🐌" },
];

const ENTITLEMENT_MODES: { value: SimulatedEntitlement; label: string; icon: string }[] = [
  { value: "real", label: "Real", icon: "🔄" },
  { value: "free", label: "Free", icon: "🆓" },
  { value: "trial", label: "Trial", icon: "⏳" },
  { value: "active", label: "Active", icon: "✅" },
  { value: "cancelled", label: "Cancelled", icon: "❌" },
  { value: "expired", label: "Expired", icon: "⏰" },
  { value: "grace", label: "Grace", icon: "⚠️" },
];

export default function Diagnostics() {
  const { t, language } = useTranslation();
  const { settings, getVoiceId, getEffectiveLanguage } = useVoiceSettings();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { isPremium, subscriptionStatus, planType } = usePremium();
  const networkSim = useNetworkSimulator();
  const entitlementSim = useEntitlementSimulator();
  const [micStatus, setMicStatus] = useState<string>("checking...");
  const [copied, setCopied] = useState(false);
  const [safeAreas, setSafeAreas] = useState({ top: "0", bottom: "0", left: "0", right: "0" });
  const [micTestState, setMicTestState] = useState<"idle" | "listening" | "done" | "error">("idle");
  const [micTestResult, setMicTestResult] = useState<string>("");

  useEffect(() => {
    navigator.permissions?.query({ name: "microphone" as PermissionName })
      .then(result => setMicStatus(result.state))
      .catch(() => setMicStatus("unavailable"));

    const root = document.documentElement;
    const cs = getComputedStyle(root);
    setSafeAreas({
      top: cs.getPropertyValue("env(safe-area-inset-top)") || "0px",
      bottom: cs.getPropertyValue("env(safe-area-inset-bottom)") || "0px",
      left: cs.getPropertyValue("env(safe-area-inset-left)") || "0px",
      right: cs.getPropertyValue("env(safe-area-inset-right)") || "0px",
    });
  }, []);

  const handleMicTest = useCallback(async () => {
    if (micTestState === "listening") return;
    setMicTestState("listening");
    setMicTestResult("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicTestResult("✅ Microphone accessible");
      setMicStatus("granted");
      stream.getTracks().forEach(track => track.stop());
      setMicTestState("done");
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicTestResult("❌ Permission denied");
        setMicStatus("denied");
      } else {
        setMicTestResult(`❌ Error: ${err.message || err.name}`);
      }
      setMicTestState("error");
    }
  }, [micTestState]);

  // Double guard: redirect in production
  if (!import.meta.env.DEV) {
    return <Navigate to="/chat" replace />;
  }

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
    { label: "Plan Type", value: planType || "none" },
    { label: "Sub Status", value: subscriptionStatus || "none" },
    { label: "User ID", value: user?.id?.slice(0, 8) + "..." || "not logged in" },
    { label: "Platform", value: navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad") ? "iOS" : "Web" },
    { label: "Screen", value: `${window.innerWidth}×${window.innerHeight} (${window.devicePixelRatio}x)` },
    { label: "Safe Area Top", value: safeAreas.top || "0px" },
    { label: "Safe Area Bottom", value: safeAreas.bottom || "0px" },
    { label: "Dark Mode", value: document.documentElement.classList.contains("dark") ? "ON" : "OFF" },
    { label: "Build", value: "Development" },
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
      <PageHeader title={t("diagnostics.title")} subtitle={t("diagnostics.subtitle")} showBack backTo="/settings" showSettings={false} />
      
      <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t("diagnostics.copied") : t("diagnostics.copyAll")}
          </Button>
        </div>

        {/* Network Simulator */}
        {networkSim && (
          <CalmCard>
            <div className="flex items-center gap-2 mb-3">
              {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-destructive" />}
              <h3 className="font-medium text-foreground">Network Simulator</h3>
              <span className="text-xs text-muted-foreground ml-auto">DEV ONLY</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {NETWORK_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => networkSim.setMode(m.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    networkSim.mode === m.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {networkSim.mode === "real" && "Using real network status"}
              {networkSim.mode === "offline" && "⚡ Simulating offline — banner should appear above, chat input disabled"}
              {networkSim.mode === "slow" && "⚡ Simulating slow network — requests may timeout"}
            </p>
          </CalmCard>
        )}

        {/* Entitlement Simulator */}
        {entitlementSim && (
          <CalmCard>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-yellow-500" />
              <h3 className="font-medium text-foreground">Entitlement Simulator</h3>
              <span className="text-xs text-muted-foreground ml-auto">DEV ONLY</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {ENTITLEMENT_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => entitlementSim.setEntitlement(m.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    entitlementSim.entitlement === m.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current: <span className="font-medium">{isPremium ? "Premium" : "Free"}</span>
              {planType && ` · ${planType}`}
              {subscriptionStatus && ` · ${subscriptionStatus}`}
            </p>
          </CalmCard>
        )}

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

        {/* Mic Test */}
        <CalmCard>
          <h3 className="font-medium text-foreground mb-3">Mic Test</h3>
          <div className="flex items-center gap-3">
            <Button 
              variant={micTestState === "listening" ? "destructive" : "outline"} 
              size="sm" 
              onClick={handleMicTest}
              className="gap-2"
              disabled={micTestState === "listening"}
            >
              {micTestState === "listening" ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {micTestState === "listening" ? "Listening..." : "Test Microphone"}
            </Button>
            {micTestResult && (
              <span className="text-sm text-muted-foreground">{micTestResult}</span>
            )}
          </div>
        </CalmCard>

        <CalmCard>
          <h3 className="font-medium text-foreground mb-2">{t("diagnostics.errorLog")}</h3>
          <p className="text-sm text-muted-foreground">{t("diagnostics.noErrors")}</p>
        </CalmCard>
      </div>
    </div>
  );
}

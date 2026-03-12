import { useState, useEffect, useCallback } from "react";
import { Mic, Check, RefreshCw, AlertCircle } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";
import { logInfo, logWarn } from "@/lib/logger";

interface MicrophoneSelectorProps {
  selectedDeviceId: string;
  onSelect: (deviceId: string) => void;
}

interface AudioDevice {
  deviceId: string;
  label: string;
}

export function MicrophoneSelector({ selectedDeviceId, onSelect }: MicrophoneSelectorProps) {
  const { language } = useTranslation();
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied" | "unknown">("unknown");
  const [loading, setLoading] = useState(false);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      // Need permission to get device labels
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setPermissionState("granted");

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices
        .filter(d => d.kind === "audioinput")
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || (language === "de" ? `Mikrofon ${d.deviceId.slice(0, 4)}` : `Microphone ${d.deviceId.slice(0, 4)}`),
        }));

      logInfo("settings", "mic_devices_loaded", { count: audioInputs.length });
      setDevices(audioInputs);
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setPermissionState("denied");
        logWarn("settings", "mic_permission_denied_in_settings");
      } else {
        logWarn("settings", "mic_enumerate_failed", { error: err?.message });
      }
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    // Check permission state without triggering prompt
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then(result => {
        setPermissionState(result.state as "prompt" | "granted" | "denied");
        if (result.state === "granted") loadDevices();
      }).catch(() => {
        // permissions API not available for mic in some browsers
      });
    }
  }, [loadDevices]);

  // Listen for device changes
  useEffect(() => {
    if (permissionState !== "granted") return;
    const handler = () => loadDevices();
    navigator.mediaDevices?.addEventListener("devicechange", handler);
    return () => navigator.mediaDevices?.removeEventListener("devicechange", handler);
  }, [permissionState, loadDevices]);

  const defaultLabel = language === "de" ? "Systemstandard" : "System default";

  if (permissionState === "denied") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
        <span>{language === "de"
          ? "Mikrofonzugriff verweigert. Bitte erlaube den Zugriff in den Browsereinstellungen."
          : "Microphone access denied. Please allow access in browser settings."}</span>
      </div>
    );
  }

  if (permissionState === "prompt" || (permissionState === "unknown" && devices.length === 0)) {
    return (
      <button
        onClick={loadDevices}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium text-primary hover:bg-primary-soft transition-colors"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
        {language === "de" ? "Mikrofone laden" : "Load microphones"}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* System default option */}
      <button
        onClick={() => onSelect("")}
        className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
          selectedDeviceId === "" ? "bg-primary-soft" : "hover:bg-muted/50"
        }`}
      >
        <div className="flex items-center gap-3">
          <Mic className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground text-sm">{defaultLabel}</span>
        </div>
        {selectedDeviceId === "" && <Check className="w-4 h-4 text-primary shrink-0" />}
      </button>

      {devices.map(device => (
        <button
          key={device.deviceId}
          onClick={() => onSelect(device.deviceId)}
          className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
            selectedDeviceId === device.deviceId ? "bg-primary-soft" : "hover:bg-muted/50"
          }`}
        >
          <span className="font-medium text-foreground text-sm truncate mr-2">{device.label}</span>
          {selectedDeviceId === device.deviceId && <Check className="w-4 h-4 text-primary shrink-0" />}
        </button>
      ))}
    </div>
  );
}

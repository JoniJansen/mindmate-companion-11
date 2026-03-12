/**
 * Microphone Diagnostics — Environment detection and input validation utilities.
 * 
 * Detects iframe restrictions, insecure contexts, and browser compatibility.
 * Provides mic signal monitoring for silence detection.
 */

import { logInfo, logWarn, logError } from "@/lib/logger";
import { recordMetric } from "@/lib/diagnostics";

export interface MicEnvironment {
  isSecureContext: boolean;
  isIframe: boolean;
  isLovablePreview: boolean;
  isProductionDomain: boolean;
  userAgent: string;
  browserName: string;
  hasMicSupport: boolean;
  /** Whether the environment may restrict mic access */
  mayRestrictMic: boolean;
}

/** Detect the current runtime environment for mic compatibility */
export function detectMicEnvironment(): MicEnvironment {
  const isSecureContext = typeof window !== "undefined" && window.isSecureContext;
  const isIframe = typeof window !== "undefined" && window !== window.top;
  
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLovablePreview = hostname.includes("lovable.app") || hostname.includes("lovableproject.com");
  const isProductionDomain = hostname.includes("soulvay") || hostname === "localhost";
  
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const browserName = /Firefox/i.test(ua) ? "Firefox" 
    : /Edg/i.test(ua) ? "Edge" 
    : /Chrome/i.test(ua) ? "Chrome" 
    : /Safari/i.test(ua) ? "Safari" 
    : "Unknown";
  
  const hasMicSupport = typeof navigator !== "undefined" 
    && typeof navigator.mediaDevices !== "undefined" 
    && typeof navigator.mediaDevices.getUserMedia === "function";

  const mayRestrictMic = isIframe || !isSecureContext;

  return { isSecureContext, isIframe, isLovablePreview, isProductionDomain, userAgent: ua, browserName, hasMicSupport, mayRestrictMic };
}

/** Check current microphone permission state (does NOT prompt) */
export async function queryMicPermission(): Promise<"granted" | "denied" | "prompt" | "unknown"> {
  try {
    if (!navigator.permissions?.query) return "unknown";
    const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
    return result.state as "granted" | "denied" | "prompt";
  } catch {
    return "unknown";
  }
}

/**
 * Validate a MediaStream's audio tracks.
 * Returns diagnostics about the track state.
 */
export function validateAudioTracks(stream: MediaStream): {
  valid: boolean;
  trackCount: number;
  firstTrackState: string;
  firstTrackEnabled: boolean;
  firstTrackMuted: boolean;
  firstTrackLabel: string;
  deviceId: string;
} {
  const tracks = stream.getAudioTracks();
  const first = tracks[0];
  
  if (!first) {
    return {
      valid: false,
      trackCount: 0,
      firstTrackState: "none",
      firstTrackEnabled: false,
      firstTrackMuted: true,
      firstTrackLabel: "",
      deviceId: "",
    };
  }

  const settings = first.getSettings?.() || {};
  
  return {
    valid: first.readyState === "live" && first.enabled && !first.muted,
    trackCount: tracks.length,
    firstTrackState: first.readyState,
    firstTrackEnabled: first.enabled,
    firstTrackMuted: first.muted,
    firstTrackLabel: first.label || "unknown",
    deviceId: settings.deviceId || "",
  };
}

/**
 * Monitor input volume from the SDK and detect silence.
 * Returns a cleanup function.
 */
export function createSilenceDetector(
  getInputVolume: () => number,
  opts: {
    /** Seconds of silence before firing callback */
    silenceThresholdSec?: number;
    /** Minimum volume level to count as "signal" */
    signalThreshold?: number;
    onSilenceDetected: () => void;
    onSignalDetected: () => void;
  }
): () => void {
  const silenceThresholdSec = opts.silenceThresholdSec ?? 8;
  const signalThreshold = opts.signalThreshold ?? 0.01;
  
  let silentSince = Date.now();
  let hasSignal = false;
  let silenceReported = false;
  let running = true;
  let intervalId: ReturnType<typeof setInterval>;

  const check = () => {
    if (!running) return;
    
    const vol = getInputVolume();
    
    if (vol > signalThreshold) {
      silentSince = Date.now();
      if (!hasSignal) {
        hasSignal = true;
        silenceReported = false;
        logInfo("mic", "signal_detected", { volume: vol.toFixed(3) });
        recordMetric("mic", "signal_detected", { success: true });
        opts.onSignalDetected();
      }
    } else {
      const silentMs = Date.now() - silentSince;
      if (silentMs > silenceThresholdSec * 1000 && !silenceReported) {
        silenceReported = true;
        hasSignal = false;
        logWarn("mic", "silence_detected", { silentMs, threshold: signalThreshold });
        recordMetric("mic", "silence_timeout", { success: false, meta: { silentMs } });
        opts.onSilenceDetected();
      }
    }
  };

  // Check every 500ms
  intervalId = setInterval(check, 500);

  return () => {
    running = false;
    clearInterval(intervalId);
  };
}

/** Log a full mic diagnostic snapshot */
export function logMicDiagnostics(event: string, extra?: Record<string, unknown>) {
  const env = detectMicEnvironment();
  logInfo("mic", event, {
    ...env,
    ...extra,
  });
}

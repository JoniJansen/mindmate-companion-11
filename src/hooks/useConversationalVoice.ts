/**
 * useConversationalVoice — Real-time voice hook using ElevenLabs Conversational AI Agent.
 * 
 * Uses WebSocket via @elevenlabs/react useConversation for
 * full-duplex voice conversations with companion characters.
 * 
 * State machine: idle → connecting → connected → (streaming/listening) → disconnecting → idle
 * All transitions are guarded via statusRef to prevent stale closures.
 * 
 * Microphone hardening:
 * - Environment detection (iframe, preview, secure context)
 * - Permission pre-check with diagnostics
 * - Input silence monitoring after connect
 * - UX warning states for broken mic
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { recordMetric } from "@/lib/diagnostics";
import { logInfo, logError, logWarn } from "@/lib/logger";
import { useVoiceSettings } from "@/hooks/useVoiceSettings";
import {
  detectMicEnvironment,
  queryMicPermission,
  validateAudioTracks,
  createSilenceDetector,
  logMicDiagnostics,
  type MicEnvironment,
} from "@/lib/micDiagnostics";

export type RealtimeVoiceStatus = "disconnected" | "connecting" | "connected" | "disconnecting" | "error";

export type RealtimeVoicePhase = 
  | "idle"
  | "listening" 
  | "agent_speaking"
  | "processing";

/** Microphone warning state surfaced to the UI */
export type MicWarning =
  | null
  | "no_signal"          // mic connected but no audio signal
  | "permission_denied"  // user denied mic
  | "not_found"          // no mic device
  | "env_blocked"        // iframe/preview may block mic
  | "unsupported";       // browser doesn't support getUserMedia

// Valid state transitions
const VALID_TRANSITIONS: Record<RealtimeVoiceStatus, RealtimeVoiceStatus[]> = {
  disconnected: ["connecting"],
  connecting: ["connected", "error", "disconnected"],
  connected: ["disconnecting", "error"],
  disconnecting: ["disconnected", "error"],
  error: ["connecting", "disconnected"],
};

interface UseConversationalVoiceOptions {
  agentId?: string;
  onError?: (error: string) => void;
}

interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
  timestamp: number;
}

export function useConversationalVoice({
  agentId,
  onError,
}: UseConversationalVoiceOptions) {
  const [status, setStatus] = useState<RealtimeVoiceStatus>("disconnected");
  const [phase, setPhase] = useState<RealtimeVoicePhase>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [agentTranscript, setAgentTranscript] = useState("");
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([]);
  const [isSupported, setIsSupported] = useState(true);
  const [micWarning, setMicWarning] = useState<MicWarning>(null);
  const [micEnvironment, setMicEnvironment] = useState<MicEnvironment | null>(null);
  
  const { settings: voiceSettings } = useVoiceSettings();
  
  // Refs for latest values — prevents stale closures in SDK callbacks
  const statusRef = useRef<RealtimeVoiceStatus>("disconnected");
  const retryCountRef = useRef(0);
  const isConnectingRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartRef = useRef<number>(0);
  const conversationRef = useRef<any>(null);
  const unmountedRef = useRef(false);
  const silenceCleanupRef = useRef<(() => void) | null>(null);
  const sessionDbIdRef = useRef<string | null>(null);

  const maxRetries = 2;
  const MAX_SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
  const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes idle
  const SILENCE_DETECTION_DELAY_MS = 3000;
  const MAX_DAILY_SESSIONS = 50; // per-user daily limit
  
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const agentIdRef = useRef(agentId);
  agentIdRef.current = agentId;

  const startSessionInternalRef = useRef<() => Promise<boolean>>();

  // Guarded state transition — prevents illegal jumps
  const transitionTo = useCallback((next: RealtimeVoiceStatus) => {
    const current = statusRef.current;
    if (current === next) return; // no-op
    
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed?.includes(next)) {
      logWarn("voice", "blocked_transition", { from: current, to: next });
      return;
    }
    
    logInfo("voice", "state_transition", { from: current, to: next });
    statusRef.current = next;
    if (!unmountedRef.current) {
      setStatus(next);
    }
  }, []);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
    if (sessionTimerRef.current) { clearTimeout(sessionTimerRef.current); sessionTimerRef.current = null; }
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
    if (silenceCleanupRef.current) { silenceCleanupRef.current(); silenceCleanupRef.current = null; }
  }, []);

  // Reset idle timer — uses ref to avoid stale conversation closure
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    // Only set timer if session is active
    if (statusRef.current !== "connected") return;
    
    idleTimerRef.current = setTimeout(() => {
      // Guard: only fire if still connected and not speaking
      if (statusRef.current !== "connected") return;
      
      logInfo("voice", "idle_timeout", { sessionDurationMs: Date.now() - sessionStartRef.current });
      recordMetric("voice", "idle_disconnect", { success: true });
      
      transitionTo("disconnecting");
      conversationRef.current?.endSession?.().catch(() => {});
      transitionTo("disconnected");
      if (!unmountedRef.current) {
        setPhase("idle");
        setMicWarning(null);
      }
      onErrorRef.current?.("voice_idle_timeout");
    }, IDLE_TIMEOUT_MS);
  }, [transitionTo]);

  // Start silence monitoring after connection
  const startSilenceMonitoring = useCallback(() => {
    // Clean up any existing monitor
    if (silenceCleanupRef.current) {
      silenceCleanupRef.current();
      silenceCleanupRef.current = null;
    }

    // Delay monitoring start to let agent speak first
    const delayTimer = setTimeout(() => {
      if (statusRef.current !== "connected" || unmountedRef.current) return;
      
      const conv = conversationRef.current;
      if (!conv?.getInputVolume) return;

      logInfo("mic", "silence_monitor_started");
      
      silenceCleanupRef.current = createSilenceDetector(
        () => conv.getInputVolume(),
        {
          silenceThresholdSec: 10,
          signalThreshold: 0.005,
          onSilenceDetected: () => {
            if (unmountedRef.current || statusRef.current !== "connected") return;
            logWarn("mic", "no_input_signal", { sessionDurationMs: Date.now() - sessionStartRef.current });
            setMicWarning("no_signal");
          },
          onSignalDetected: () => {
            if (unmountedRef.current) return;
            setMicWarning(prev => prev === "no_signal" ? null : prev);
          },
        }
      );
    }, SILENCE_DETECTION_DELAY_MS);

    // Return combined cleanup
    const prevCleanup = silenceCleanupRef.current;
    silenceCleanupRef.current = () => {
      clearTimeout(delayTimer);
      prevCleanup?.();
    };
  }, []);

  // ── Voice session DB tracking ──
  const createSessionRecord = useCallback(async (currentAgentId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;

      // Check daily limit
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabase
        .from("voice_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .gte("started_at", `${today}T00:00:00Z`);

      if (count !== null && count >= MAX_DAILY_SESSIONS) {
        logWarn("voice", "daily_limit_reached", { count, limit: MAX_DAILY_SESSIONS });
        return "LIMIT_REACHED";
      }

      const { data, error } = await supabase
        .from("voice_sessions")
        .insert({ user_id: session.user.id, agent_id: currentAgentId })
        .select("id")
        .single();

      if (error) { logError("voice", "session_record_failed", { error: error.message }); return null; }
      return data?.id || null;
    } catch { return null; }
  }, []);

  const finalizeSessionRecord = useCallback(async (reason: string) => {
    const dbId = sessionDbIdRef.current;
    if (!dbId) return;
    sessionDbIdRef.current = null;
    const durationSec = Math.round((Date.now() - sessionStartRef.current) / 1000);
    try {
      await supabase
        .from("voice_sessions")
        .update({ ended_at: new Date().toISOString(), duration_seconds: durationSec, disconnect_reason: reason })
        .eq("id", dbId);
      logInfo("voice", "session_record_finalized", { durationSec, reason });
    } catch { /* best effort */ }
  }, []);

  // ElevenLabs useConversation hook
  const conversation = useConversation({
    onConnect: () => {
      if (unmountedRef.current) return;
      
      logInfo("voice", "connected", { agentId: agentIdRef.current });
      sessionStartRef.current = Date.now();
      recordMetric("voice", "session_started", { success: true });
      
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      
      transitionTo("connected");
      setPhase("listening");
      setMicWarning(null);
      retryCountRef.current = 0;
      isConnectingRef.current = false;
      resetIdleTimer();
      
      // Start monitoring mic input for silence
      startSilenceMonitoring();

      // Max session duration timer
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = setTimeout(() => {
        if (statusRef.current !== "connected") return;
        
        logInfo("voice", "max_duration_reached");
        recordMetric("voice", "max_duration_disconnect", { success: true, durationMs: MAX_SESSION_DURATION_MS });
        
        transitionTo("disconnecting");
        conversationRef.current?.endSession?.().catch(() => {});
        transitionTo("disconnected");
        if (!unmountedRef.current) {
          setPhase("idle");
          setMicWarning(null);
        }
        onErrorRef.current?.("voice_max_duration");
      }, MAX_SESSION_DURATION_MS);
    },
    
    onDisconnect: () => {
      const sessionDurationMs = sessionStartRef.current ? Date.now() - sessionStartRef.current : 0;
      logInfo("voice", "sdk_disconnect", { sessionDurationMs, currentStatus: statusRef.current });
      recordMetric("voice", "session_ended", { durationMs: sessionDurationMs, success: true });
      finalizeSessionRecord("sdk_disconnect");
      
      // Clean up silence monitor
      if (silenceCleanupRef.current) { silenceCleanupRef.current(); silenceCleanupRef.current = null; }
      if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
      if (sessionTimerRef.current) { clearTimeout(sessionTimerRef.current); sessionTimerRef.current = null; }
      
      // Don't reset state if we're currently in the middle of a retry
      if (statusRef.current === "connecting" && retryCountRef.current > 0) {
        logInfo("voice", "ignoring_disconnect_during_retry", { retryCount: retryCountRef.current });
        return;
      }
      
      isConnectingRef.current = false;
      
      // Only transition if we haven't already moved to disconnected/error
      if (statusRef.current === "connected" || statusRef.current === "disconnecting") {
        transitionTo("disconnected");
      } else if (statusRef.current === "connecting") {
        transitionTo("disconnected");
      }
      
      if (!unmountedRef.current) {
        setPhase("idle");
        setUserTranscript("");
        setAgentTranscript("");
        setMicWarning(null);
      }
    },
    
    onMessage: (message: any) => {
      if (unmountedRef.current) return;
      
      // Reset idle timer on any message activity
      resetIdleTimer();
      
      const msgType = message?.type;
      if (msgType === "user_transcript") {
        const text = message?.user_transcription_event?.user_transcript || "";
        setUserTranscript(text);
        setTranscriptHistory(prev => [...prev, { role: "user", text, timestamp: Date.now() }]);
        // User transcript proves mic is working — clear any warning
        setMicWarning(prev => prev === "no_signal" ? null : prev);
      }
      if (msgType === "agent_response") {
        const text = message?.agent_response_event?.agent_response || "";
        setAgentTranscript(text);
        setTranscriptHistory(prev => [...prev, { role: "agent", text, timestamp: Date.now() }]);
      }
      if (msgType === "agent_response_correction") {
        const text = message?.agent_response_correction_event?.corrected_agent_response || "";
        setAgentTranscript(text);
      }
    },
    
    onError: (error) => {
      const errorMsg = typeof error === "object" && error !== null ? JSON.stringify(error) : String(error);
      logError("voice", "agent_error", { error: errorMsg, retryCount: retryCountRef.current, currentStatus: statusRef.current });
      recordMetric("voice", "agent_error", { success: false, meta: { error: errorMsg } });
      
      // Clean up silence monitor on error
      if (silenceCleanupRef.current) { silenceCleanupRef.current(); silenceCleanupRef.current = null; }
      
      isConnectingRef.current = false;
      const currentRetry = retryCountRef.current;
      
      if (currentRetry < maxRetries && statusRef.current !== "disconnected") {
        logInfo("voice", "auto_retry", { attempt: currentRetry + 1, maxRetries });
        retryCountRef.current = currentRetry + 1;
        
        // Stay in connecting state for retry
        statusRef.current = "connecting";
        if (!unmountedRef.current) setStatus("connecting");
        
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          if (!unmountedRef.current) {
            startSessionInternalRef.current?.();
          }
        }, 1500);
        return;
      }
      
      transitionTo("error");
      if (!unmountedRef.current) setPhase("idle");
      
      const isAuthError = errorMsg.includes("401") || errorMsg.includes("403") || errorMsg.includes("NotAllowed");
      if (isAuthError) {
        logError("voice", "auth_error", { agentId: agentIdRef.current });
        onErrorRef.current?.("voice_auth_failed");
      } else {
        onErrorRef.current?.("voice_connection_failed");
      }
    },
  });

  // Keep conversation ref in sync
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Derive phase from conversation state
  useEffect(() => {
    if (statusRef.current !== "connected") return;
    if (!unmountedRef.current) {
      setPhase(conversation.isSpeaking ? "agent_speaking" : "listening");
    }
  }, [conversation.isSpeaking]);

  // Internal session start — fetches signed URL and connects SDK
  const startSessionInternal = useCallback(async () => {
    const currentAgentId = agentIdRef.current;
    if (!currentAgentId) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-conversation-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ agentId: currentAgentId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get voice session URL");
      }

      const data = await response.json();
      if (!data.signed_url) {
        throw new Error("No signed URL received");
      }

      // Abort if we've been unmounted or status changed during async work
      if (unmountedRef.current || statusRef.current === "disconnected") {
        logWarn("voice", "session_start_aborted", { reason: "unmounted_or_disconnected" });
        return false;
      }

      logInfo("voice", "starting_websocket", { agentId: currentAgentId });

      await conversation.startSession({
        signedUrl: data.signed_url,
      });

      return true;
    } catch (error: any) {
      logError("voice", "session_start_failed", { error: error?.message });
      
      if (error?.name === "NotAllowedError") {
        transitionTo("error");
        isConnectingRef.current = false;
        if (!unmountedRef.current) {
          setIsSupported(false);
          setMicWarning("permission_denied");
        }
      onErrorRef.current?.("mic_permission_denied");
        return false;
      }
      
      // Don't set error here if retries are still pending — onError handler manages retries
      if (retryCountRef.current >= maxRetries) {
        transitionTo("error");
        isConnectingRef.current = false;
        onErrorRef.current?.("voice_start_failed");
      }
      return false;
    }
  }, [conversation, transitionTo]);

  startSessionInternalRef.current = startSessionInternal;

  // Start a real-time voice session with full mic diagnostics
  const startSession = useCallback(async () => {
    if (!agentIdRef.current || isConnectingRef.current) return false;
    if (statusRef.current === "connecting" || statusRef.current === "connected") return false;

    // ── Environment check ──
    const env = detectMicEnvironment();
    if (!unmountedRef.current) setMicEnvironment(env);
    logMicDiagnostics("session_start_requested");

    if (!env.hasMicSupport) {
      logError("mic", "unsupported_environment", env as unknown as Record<string, unknown>);
      if (!unmountedRef.current) {
        setMicWarning("unsupported");
        setIsSupported(false);
      }
      onErrorRef.current?.("mic_unsupported");
      return false;
    }

    if (!env.isSecureContext) {
      logError("mic", "insecure_context", env as unknown as Record<string, unknown>);
      if (!unmountedRef.current) setMicWarning("env_blocked");
      onErrorRef.current?.("mic_insecure_context");
      return false;
    }

    // ── Permission pre-check ──
    const permBefore = await queryMicPermission();
    logInfo("mic", "permission_state_before", { state: permBefore });

    isConnectingRef.current = true;
    transitionTo("connecting");
    setUserTranscript("");
    setAgentTranscript("");
    setTranscriptHistory([]);
    setMicWarning(null);
    retryCountRef.current = 0;

    // ── Daily session limit check ──
    const limitResult = await createSessionRecord(agentIdRef.current!);
    if (limitResult === "LIMIT_REACHED") {
      transitionTo("error");
      isConnectingRef.current = false;
      onErrorRef.current?.("voice_daily_limit");
      return false;
    }
    if (typeof limitResult === "string") sessionDbIdRef.current = limitResult;

    try {
      // Request microphone permission — then STOP the stream immediately
      // The SDK will create its own audio capture; keeping ours open causes conflicts
      const audioConstraints: MediaStreamConstraints["audio"] = voiceSettings.preferredMicDeviceId
        ? { deviceId: { ideal: voiceSettings.preferredMicDeviceId } }
        : true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      
      // Validate the acquired track before releasing
      const trackInfo = validateAudioTracks(stream);
      logInfo("mic", "stream_acquired", trackInfo);
      recordMetric("mic", "permission_granted", { success: true, meta: trackInfo });

      if (!trackInfo.valid) {
        logWarn("mic", "track_not_live", trackInfo);
      }

      // Release immediately — SDK will capture its own
      stream.getTracks().forEach(track => {
        logInfo("mic", "releasing_probe_track", { label: track.label, state: track.readyState });
        track.stop();
      });

      const permAfter = await queryMicPermission();
      logInfo("mic", "permission_state_after", { state: permAfter });

      // Warn about potentially degraded environments
      if (env.mayRestrictMic) {
        logWarn("mic", "env_may_restrict", { isIframe: env.isIframe, isLovablePreview: env.isLovablePreview });
      }

      return await startSessionInternal();
    } catch (error: any) {
      logError("mic", "acquisition_failed", { 
        error: error?.message, 
        name: error?.name,
        isIframe: env.isIframe,
        isLovablePreview: env.isLovablePreview,
      });
      recordMetric("mic", "acquisition_failed", { success: false, meta: { error: error?.name } });
      
      transitionTo("error");
      isConnectingRef.current = false;
      
      if (error?.name === "NotAllowedError") {
        if (!unmountedRef.current) {
          setMicWarning("permission_denied");
          setIsSupported(false);
        }
        onErrorRef.current?.("mic_permission_denied");
      } else if (error?.name === "NotFoundError") {
        if (!unmountedRef.current) {
          setMicWarning("not_found");
          setIsSupported(false);
        }
        onErrorRef.current?.("mic_not_found");
      } else if (error?.name === "NotReadableError" || error?.name === "AbortError") {
        // Often means another app/tab has the mic, or hardware error
        if (!unmountedRef.current) setMicWarning("env_blocked");
        onErrorRef.current?.("mic_in_use");
      } else {
        onErrorRef.current?.("voice_start_failed");
      }
      return false;
    }
  }, [startSessionInternal, transitionTo]);

  // End the current voice session
  const endSession = useCallback(async () => {
    clearAllTimers();
    
    // Guard: only disconnect if we're in a state that allows it
    const current = statusRef.current;
    if (current === "disconnected" || current === "disconnecting") {
      return;
    }
    
    if (current === "connected") {
      transitionTo("disconnecting");
    }
    
    try {
      await conversation.endSession();
    } catch (e) {
      // Ignore end errors
    }
    
    // Ensure final state
    statusRef.current = "disconnected";
    if (!unmountedRef.current) {
      setStatus("disconnected");
      setPhase("idle");
      setMicWarning(null);
    }
    retryCountRef.current = 0;
    isConnectingRef.current = false;
    
    finalizeSessionRecord("user_ended");
    logInfo("voice", "session_ended_cleanup_complete");
  }, [conversation, clearAllTimers, transitionTo, finalizeSessionRecord]);

  // Cleanup on unmount
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      clearAllTimers();
      conversationRef.current?.endSession?.().catch(() => {});
      logInfo("voice", "unmount_cleanup");
    };
  }, [clearAllTimers]);

  // Reset error state
  const resetError = useCallback(() => {
    clearAllTimers();
    statusRef.current = "disconnected";
    setStatus("disconnected");
    setPhase("idle");
    setMicWarning(null);
    retryCountRef.current = 0;
    isConnectingRef.current = false;
  }, [clearAllTimers]);

  const visualState = phase === "agent_speaking" 
    ? "speaking" as const
    : phase === "listening" 
    ? "listening" as const
    : phase === "processing"
    ? "thinking" as const
    : "idle" as const;

  return {
    startSession,
    endSession,
    resetError,
    status,
    phase,
    isSupported,
    isSpeaking: conversation.isSpeaking,
    isConnected: status === "connected",
    userTranscript,
    agentTranscript,
    transcriptHistory,
    visualState,
    micWarning,
    micEnvironment,
    setVolume: conversation.setVolume,
    getInputVolume: conversation.getInputVolume,
    getOutputVolume: conversation.getOutputVolume,
  };
}

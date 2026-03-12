/**
 * useConversationalVoice — Real-time voice hook using ElevenLabs Conversational AI Agent.
 * 
 * Uses WebSocket via @elevenlabs/react useConversation for
 * full-duplex voice conversations with companion characters.
 * 
 * State machine: idle → connecting → connected → (streaming/listening) → disconnecting → idle
 * All transitions are guarded via statusRef to prevent stale closures.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { recordMetric } from "@/lib/diagnostics";
import { logInfo, logError, logWarn } from "@/lib/logger";

export type RealtimeVoiceStatus = "disconnected" | "connecting" | "connected" | "disconnecting" | "error";

export type RealtimeVoicePhase = 
  | "idle"
  | "listening" 
  | "agent_speaking"
  | "processing";

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

  const maxRetries = 2;
  const MAX_SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
  const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes idle
  
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
      
      // Use ref to get latest conversation handle
      transitionTo("disconnecting");
      conversationRef.current?.endSession?.().catch(() => {});
      transitionTo("disconnected");
      if (!unmountedRef.current) {
        setPhase("idle");
      }
      onErrorRef.current?.("Session ended — no activity detected.");
    }, IDLE_TIMEOUT_MS);
  }, [transitionTo]);

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
      retryCountRef.current = 0;
      isConnectingRef.current = false;
      resetIdleTimer();

      // Max session duration timer
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = setTimeout(() => {
        if (statusRef.current !== "connected") return;
        
        logInfo("voice", "max_duration_reached");
        recordMetric("voice", "max_duration_disconnect", { success: true, durationMs: MAX_SESSION_DURATION_MS });
        
        transitionTo("disconnecting");
        conversationRef.current?.endSession?.().catch(() => {});
        transitionTo("disconnected");
        if (!unmountedRef.current) setPhase("idle");
        onErrorRef.current?.("Session ended — maximum duration reached.");
      }, MAX_SESSION_DURATION_MS);
    },
    
    onDisconnect: () => {
      const sessionDurationMs = sessionStartRef.current ? Date.now() - sessionStartRef.current : 0;
      logInfo("voice", "sdk_disconnect", { sessionDurationMs, currentStatus: statusRef.current });
      recordMetric("voice", "session_ended", { durationMs: sessionDurationMs, success: true });
      
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
        // Connection failed before ever connecting
        transitionTo("disconnected");
      }
      
      if (!unmountedRef.current) {
        setPhase("idle");
        setUserTranscript("");
        setAgentTranscript("");
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
        onErrorRef.current?.("Voice service authentication failed. Please try again later.");
      } else {
        onErrorRef.current?.("Voice connection failed. Please try again.");
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

  // Internal session start
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
        onErrorRef.current?.("Microphone access denied. Please allow microphone access.");
        if (!unmountedRef.current) setIsSupported(false);
        return false;
      }
      
      // Don't set error here if retries are still pending — onError handler manages retries
      if (retryCountRef.current >= maxRetries) {
        transitionTo("error");
        isConnectingRef.current = false;
        onErrorRef.current?.(error?.message || "Failed to start voice session");
      }
      return false;
    }
  }, [conversation, transitionTo]);

  startSessionInternalRef.current = startSessionInternal;

  // Start a real-time voice session
  const startSession = useCallback(async () => {
    if (!agentIdRef.current || isConnectingRef.current) return false;
    if (statusRef.current === "connecting" || statusRef.current === "connected") return false;

    isConnectingRef.current = true;
    transitionTo("connecting");
    setUserTranscript("");
    setAgentTranscript("");
    setTranscriptHistory([]);
    retryCountRef.current = 0;

    try {
      // Request microphone permission — then STOP the stream immediately
      // The SDK will create its own audio capture; keeping ours open causes conflicts
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      logInfo("voice", "mic_permission_granted");

      return await startSessionInternal();
    } catch (error: any) {
      logError("voice", "session_start_failed", { error: error?.message, name: error?.name });
      transitionTo("error");
      isConnectingRef.current = false;
      
      if (error?.name === "NotAllowedError") {
        onErrorRef.current?.("Microphone access denied. Please allow microphone access.");
        if (!unmountedRef.current) setIsSupported(false);
      } else if (error?.name === "NotFoundError") {
        onErrorRef.current?.("No microphone found. Please connect a microphone.");
        if (!unmountedRef.current) setIsSupported(false);
      } else {
        onErrorRef.current?.(error?.message || "Failed to start voice session");
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
    }
    retryCountRef.current = 0;
    isConnectingRef.current = false;
  }, [conversation, clearAllTimers, transitionTo]);

  // Cleanup on unmount
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      clearAllTimers();
      conversationRef.current?.endSession?.().catch(() => {});
    };
  }, [clearAllTimers]);

  // Reset error state
  const resetError = useCallback(() => {
    clearAllTimers();
    statusRef.current = "disconnected";
    setStatus("disconnected");
    setPhase("idle");
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
    setVolume: conversation.setVolume,
    getInputVolume: conversation.getInputVolume,
    getOutputVolume: conversation.getOutputVolume,
  };
}

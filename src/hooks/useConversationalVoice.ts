/**
 * useConversationalVoice — Real-time voice hook using ElevenLabs Conversational AI Agent.
 * 
 * Uses WebSocket via @elevenlabs/react useConversation for
 * full-duplex voice conversations with companion characters.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { recordMetric } from "@/lib/diagnostics";
import { logInfo, logError } from "@/lib/logger";

export type RealtimeVoiceStatus = "disconnected" | "connecting" | "connected" | "error";

export type RealtimeVoicePhase = 
  | "idle"
  | "listening" 
  | "agent_speaking"
  | "processing";

interface UseConversationalVoiceOptions {
  /** ElevenLabs Agent ID */
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
  
  const retryCountRef = useRef(0);
  const isConnectingRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartRef = useRef<number>(0);
  const maxRetries = 2;
  const MAX_SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes max session
  const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes idle → auto-disconnect
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const agentIdRef = useRef(agentId);
  agentIdRef.current = agentId;

  const startSessionInternalRef = useRef<() => Promise<boolean>>();

  // Reset idle timer whenever there's voice activity
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      logInfo("voice", "idle_timeout", { sessionDurationMs: Date.now() - sessionStartRef.current });
      recordMetric("voice", "idle_disconnect", { success: true });
      conversation.endSession().catch(() => {});
      setStatus("disconnected");
      setPhase("idle");
      onErrorRef.current?.("Session ended — no activity detected.");
    }, IDLE_TIMEOUT_MS);
  }, []);

  // ElevenLabs useConversation hook
  const conversation = useConversation({
    onConnect: () => {
      logInfo("voice", "connected", { agentId: agentIdRef.current });
      sessionStartRef.current = Date.now();
      recordMetric("voice", "session_started", { success: true });
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      setStatus("connected");
      setPhase("listening");
      retryCountRef.current = 0;
      isConnectingRef.current = false;
      resetIdleTimer();

      // Start max session duration timer
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = setTimeout(() => {
        logInfo("voice", "max_duration_reached");
        recordMetric("voice", "max_duration_disconnect", { success: true, durationMs: MAX_SESSION_DURATION_MS });
        conversation.endSession().catch(() => {});
        setStatus("disconnected");
        setPhase("idle");
        onErrorRef.current?.("Session ended — maximum duration reached.");
      }, MAX_SESSION_DURATION_MS);
    },
    onDisconnect: (details) => {
      const sessionDurationMs = sessionStartRef.current ? Date.now() - sessionStartRef.current : 0;
      logInfo("voice", "disconnected", { sessionDurationMs });
      recordMetric("voice", "session_ended", { durationMs: sessionDurationMs, success: true });
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      setStatus(prev => {
        if (prev === "connecting") return prev;
        return "disconnected";
      });
      setPhase("idle");
      setUserTranscript("");
      setAgentTranscript("");
      isConnectingRef.current = false;
    },
    onMessage: (message: any) => {
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
    onError: (error, details) => {
      const errorMsg = typeof error === "object" && error !== null ? JSON.stringify(error) : String(error);
      logError("voice", "agent_error", { error: errorMsg, retryCount: retryCountRef.current });
      recordMetric("voice", "agent_error", { success: false, meta: { error: errorMsg } });
      isConnectingRef.current = false;
      
      const currentRetry = retryCountRef.current;
      
      if (currentRetry < maxRetries) {
        logInfo("voice", "auto_retry", { attempt: currentRetry + 1, maxRetries });
        retryCountRef.current = currentRetry + 1;
        setStatus("connecting");
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          startSessionInternalRef.current?.();
        }, 1500);
        return;
      }
      
      setStatus("error");
      setPhase("idle");
      
      const isAuthError = errorMsg.includes("401") || errorMsg.includes("403") || errorMsg.includes("NotAllowed");
      
      if (isAuthError) {
        logError("voice", "auth_error", { agentId: agentIdRef.current });
        onErrorRef.current?.("Voice service authentication failed. Please try again later.");
      } else {
        onErrorRef.current?.("Voice connection failed. Please try again.");
      }
    },
  });

  // Derive phase from conversation state
  useEffect(() => {
    if (status !== "connected") {
      setPhase("idle");
      return;
    }
    setPhase(conversation.isSpeaking ? "agent_speaking" : "listening");
  }, [status, conversation.isSpeaking]);

  // Internal session start
  const startSessionInternal = useCallback(async () => {
    const currentAgentId = agentIdRef.current;
    if (!currentAgentId) return false;

    try {
      // Get signed URL from edge function (WebSocket connection)
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

      console.log("[Voice2.0] Starting WebSocket session for agent:", currentAgentId);

      // Start WebSocket conversation session (avoids LiveKit RTC path issues)
      await conversation.startSession({
        signedUrl: data.signed_url,
      });

      return true;
    } catch (error: any) {
      console.error("[Voice2.0] Session start failed:", error);
      
      if (error?.name === "NotAllowedError") {
        setStatus("error");
        isConnectingRef.current = false;
        onErrorRef.current?.("Microphone access denied. Please allow microphone access.");
        setIsSupported(false);
        return false;
      }
      
      if (retryCountRef.current >= maxRetries) {
        setStatus("error");
        isConnectingRef.current = false;
        onErrorRef.current?.(error?.message || "Failed to start voice session");
      }
      return false;
    }
  }, [conversation]);

  startSessionInternalRef.current = startSessionInternal;

  // Start a real-time voice session
  const startSession = useCallback(async () => {
    if (!agentIdRef.current || isConnectingRef.current) return false;

    isConnectingRef.current = true;
    setStatus("connecting");
    setUserTranscript("");
    setAgentTranscript("");
    setTranscriptHistory([]);
    retryCountRef.current = 0;

    try {
      // Request microphone permission — SDK needs it for audio capture
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return await startSessionInternal();
    } catch (error: any) {
      console.error("[Voice2.0] Session start failed:", error);
      setStatus("error");
      isConnectingRef.current = false;
      
      if (error?.name === "NotAllowedError") {
        onErrorRef.current?.("Microphone access denied. Please allow microphone access.");
        setIsSupported(false);
      } else if (error?.name === "NotFoundError") {
        onErrorRef.current?.("No microphone found. Please connect a microphone.");
        setIsSupported(false);
      } else {
        onErrorRef.current?.(error?.message || "Failed to start voice session");
      }
      return false;
    }
  }, [startSessionInternal]);

  // End the current voice session
  const endSession = useCallback(async () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    try {
      await conversation.endSession();
    } catch (e) {
      // Ignore end errors
    }
    setStatus("disconnected");
    setPhase("idle");
    retryCountRef.current = 0;
    isConnectingRef.current = false;
  }, [conversation]);

  // Cleanup on unmount — prevent ghost sessions
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      // Fire-and-forget cleanup
      conversation.endSession().catch(() => {});
    };
  }, [conversation]);

  // Reset error state
  const resetError = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setStatus("disconnected");
    setPhase("idle");
    retryCountRef.current = 0;
    isConnectingRef.current = false;
  }, []);

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

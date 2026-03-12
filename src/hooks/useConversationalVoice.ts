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
  const maxRetries = 2;
  const MAX_SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes max session
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const agentIdRef = useRef(agentId);
  agentIdRef.current = agentId;

  const startSessionInternalRef = useRef<() => Promise<boolean>>();

  // ElevenLabs useConversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log("[Voice2.0] Connected to agent via WebSocket");
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      setStatus("connected");
      setPhase("listening");
      retryCountRef.current = 0;
      isConnectingRef.current = false;

      // Start max session duration timer
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = setTimeout(() => {
        console.log("[Voice2.0] Max session duration reached, ending session");
        conversation.endSession().catch(() => {});
        setStatus("disconnected");
        setPhase("idle");
        onErrorRef.current?.("Session ended — maximum duration reached.");
      }, MAX_SESSION_DURATION_MS);
    },
    onDisconnect: (details) => {
      console.log("[Voice2.0] Disconnected from agent", details ? JSON.stringify(details) : "");
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
      console.error("[Voice2.0] Agent error:", errorMsg, details ? JSON.stringify(details) : "");
      isConnectingRef.current = false;
      
      const currentRetry = retryCountRef.current;
      
      if (currentRetry < maxRetries) {
        console.log(`[Voice2.0] Auto-retry ${currentRetry + 1}/${maxRetries}, error: ${errorMsg}`);
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
        console.error("[Voice2.0] Auth error — check API key permissions. Agent ID:", agentIdRef.current);
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

/**
 * useConversationalVoice — Real-time voice hook using ElevenLabs Conversational AI Agent.
 * 
 * Uses WebRTC via @elevenlabs/react useConversation for low-latency
 * full-duplex voice conversations with companion characters.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";

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
  const [retryCount, setRetryCount] = useState(0);
  
  const isConnectingRef = useRef(false);
  const maxRetries = 2;

  // ElevenLabs useConversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log("[Voice2.0] Connected to agent via WebRTC");
      setStatus("connected");
      setPhase("listening");
      setRetryCount(0);
      isConnectingRef.current = false;
    },
    onDisconnect: () => {
      console.log("[Voice2.0] Disconnected from agent");
      setStatus("disconnected");
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
    onError: (error) => {
      console.error("[Voice2.0] Agent error:", error);
      isConnectingRef.current = false;
      
      // If we haven't exhausted retries, try again automatically
      if (retryCount < maxRetries) {
        console.log(`[Voice2.0] Auto-retry ${retryCount + 1}/${maxRetries}`);
        setRetryCount(prev => prev + 1);
        setStatus("connecting");
        // Brief delay before retry
        setTimeout(() => {
          startSessionInternal();
        }, 1500);
        return;
      }
      
      setStatus("error");
      setPhase("idle");
      onError?.("Voice connection failed. Please try again.");
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

  // Internal session start (used for retries too)
  const startSessionInternal = useCallback(async () => {
    if (!agentId) return false;

    try {
      // Get conversation token from edge function
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
          body: JSON.stringify({ agentId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get voice session token");
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error("No conversation token received");
      }

      // Start WebRTC conversation session
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });

      return true;
    } catch (error: any) {
      console.error("[Voice2.0] Session start failed:", error);
      
      if (error?.name === "NotAllowedError") {
        setStatus("error");
        isConnectingRef.current = false;
        onError?.("Microphone access denied. Please allow microphone access.");
        setIsSupported(false);
        return false;
      }
      
      // For connection errors, let the onError handler deal with retries
      if (retryCount >= maxRetries) {
        setStatus("error");
        isConnectingRef.current = false;
        onError?.(error?.message || "Failed to start voice session");
      }
      return false;
    }
  }, [agentId, conversation, onError, retryCount]);

  // Start a real-time voice session via WebRTC
  const startSession = useCallback(async () => {
    if (!agentId || isConnectingRef.current) return false;

    isConnectingRef.current = true;
    setStatus("connecting");
    setUserTranscript("");
    setAgentTranscript("");
    setTranscriptHistory([]);
    setRetryCount(0);

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return await startSessionInternal();
    } catch (error: any) {
      console.error("[Voice2.0] Session start failed:", error);
      setStatus("error");
      isConnectingRef.current = false;
      
      if (error?.name === "NotAllowedError") {
        onError?.("Microphone access denied. Please allow microphone access.");
        setIsSupported(false);
      } else {
        onError?.(error?.message || "Failed to start voice session");
      }
      return false;
    }
  }, [agentId, startSessionInternal, onError]);

  // End the current voice session
  const endSession = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (e) {
      // Ignore end errors
    }
    setStatus("disconnected");
    setPhase("idle");
    setRetryCount(0);
    isConnectingRef.current = false;
  }, [conversation]);

  // Reset error state so user can try again
  const resetError = useCallback(() => {
    setStatus("disconnected");
    setPhase("idle");
    setRetryCount(0);
    isConnectingRef.current = false;
  }, []);

  // Visual state for companion avatar
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

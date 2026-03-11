/**
 * useConversationalVoice — Real-time voice hook using ElevenLabs Conversational AI Agent.
 * 
 * This wraps @elevenlabs/react useConversation with Soulvay-specific logic:
 * - Companion identity injection via dynamic overrides
 * - Transcript/subtitle extraction from agent messages
 * - Avatar visual state derivation
 * - Session lifecycle management
 * 
 * Phase 1: Hook scaffold with full API surface.
 * The actual ElevenLabs Agent must be configured in the ElevenLabs dashboard
 * before this hook becomes functional.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { buildCompanionAgentConfig } from "@/data/companionAgentPrompts";
import type { CompanionProfile } from "@/hooks/useCompanion";

export type RealtimeVoiceStatus = "disconnected" | "connecting" | "connected" | "error";

export type RealtimeVoicePhase = 
  | "idle"
  | "listening" 
  | "agent_speaking"
  | "processing";

interface UseConversationalVoiceOptions {
  companion: CompanionProfile | null;
  language: "en" | "de";
  userName?: string;
  memoriesContext?: string;
  /** ElevenLabs Agent ID (configured in ElevenLabs dashboard) */
  agentId?: string;
  onError?: (error: string) => void;
}

interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
  timestamp: number;
}

export function useConversationalVoice({
  companion,
  language,
  userName,
  memoriesContext,
  agentId,
  onError,
}: UseConversationalVoiceOptions) {
  const [status, setStatus] = useState<RealtimeVoiceStatus>("disconnected");
  const [phase, setPhase] = useState<RealtimeVoicePhase>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [agentTranscript, setAgentTranscript] = useState("");
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([]);
  const [isSupported, setIsSupported] = useState(true);
  
  const isConnectingRef = useRef(false);

  // Build agent config from companion
  const agentConfig = companion
    ? buildCompanionAgentConfig(
        companion.archetype,
        companion.bond_level,
        language,
        userName,
        memoriesContext
      )
    : null;

  // ElevenLabs useConversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log("[Voice2.0] Connected to agent");
      setStatus("connected");
      setPhase("listening");
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
      // Handle different message types for transcript display
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
      setStatus("error");
      setPhase("idle");
      isConnectingRef.current = false;
      onError?.("Voice connection failed. Falling back to text mode.");
    },
    // Dynamic overrides for companion identity
    ...(agentConfig ? {
      overrides: {
        agent: {
          prompt: {
            prompt: agentConfig.prompt,
          },
          firstMessage: language === "de" ? agentConfig.firstMessageDe : agentConfig.firstMessage,
          language,
        },
        tts: {
          voiceId: agentConfig.voiceId,
        },
      },
    } : {}),
  });

  // Derive phase from conversation state
  useEffect(() => {
    if (status !== "connected") {
      setPhase("idle");
      return;
    }
    setPhase(conversation.isSpeaking ? "agent_speaking" : "listening");
  }, [status, conversation.isSpeaking]);

  // Start a real-time voice session
  const startSession = useCallback(async () => {
    if (!agentId || isConnectingRef.current) return false;

    isConnectingRef.current = true;
    setStatus("connecting");
    setUserTranscript("");
    setAgentTranscript("");
    setTranscriptHistory([]);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from edge function
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

      const { signed_url } = await response.json();

      if (!signed_url) {
        throw new Error("No signed URL received");
      }

      // Start the conversation with WebSocket
      await conversation.startSession({
        signedUrl: signed_url,
      });

      return true;
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
  }, [agentId, conversation, onError]);

  // End the current voice session
  const endSession = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (e) {
      // Ignore end errors
    }
    setStatus("disconnected");
    setPhase("idle");
  }, [conversation]);

  // Visual state for companion avatar
  const visualState = phase === "agent_speaking" 
    ? "speaking" as const
    : phase === "listening" 
    ? "listening" as const
    : phase === "processing"
    ? "thinking" as const
    : "idle" as const;

  return {
    // Session control
    startSession,
    endSession,
    
    // State
    status,
    phase,
    isSupported,
    isSpeaking: conversation.isSpeaking,
    isConnected: status === "connected",
    
    // Transcripts for subtitle display
    userTranscript,
    agentTranscript,
    transcriptHistory,
    
    // Avatar state
    visualState,
    
    // Volume control
    setVolume: conversation.setVolume,
  };
}

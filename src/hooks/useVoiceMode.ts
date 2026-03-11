/**
 * useVoiceMode — Abstraction layer for face-to-face voice mode.
 * 
 * Decides whether to use:
 * 1. Real-time conversational voice (ElevenLabs Agent SDK) — preferred
 * 2. Turn-based voice (current STT → AI → TTS pipeline) — fallback
 * 
 * This hook provides a unified API surface regardless of which backend
 * is active, allowing the VoiceConversationPanel to work with either.
 * 
 * Phase 1: Always uses turn-based mode. Real-time mode activates
 * when ELEVENLABS_AGENT_ID is configured and the agent is available.
 */

import { useState, useCallback, useEffect, useRef } from "react";

export type VoiceModeType = "realtime" | "turn-based";

interface VoiceModeConfig {
  /** If set, enables real-time mode with this agent ID */
  agentId?: string;
  /** Force a specific mode (for testing) */
  forceMode?: VoiceModeType;
  /** Whether voice features are available (premium gate) */
  canUseVoice: boolean;
}

interface VoiceModeState {
  /** Which voice backend is active */
  activeMode: VoiceModeType;
  /** Whether real-time mode is available */
  realtimeAvailable: boolean;
  /** Whether the user has opted into real-time mode */
  realtimeEnabled: boolean;
  /** Toggle between modes */
  toggleMode: () => void;
  /** Set mode explicitly */
  setMode: (mode: VoiceModeType) => void;
}

const STORAGE_KEY = "soulvay-voice-mode";

/**
 * Determines which voice mode to use and provides switching capability.
 * 
 * Real-time mode requires:
 * 1. An ElevenLabs Agent ID configured
 * 2. Premium access (canUseVoice)
 * 3. WebRTC/WebSocket browser support
 * 4. User opt-in (stored in localStorage)
 */
export function useVoiceMode(config: VoiceModeConfig): VoiceModeState {
  const { agentId, forceMode, canUseVoice } = config;

  // Check if real-time is technically available
  const realtimeAvailable = Boolean(agentId) && canUseVoice;

  // Load user preference
  const [realtimeEnabled, setRealtimeEnabled] = useState(() => {
    if (forceMode) return forceMode === "realtime";
    try {
      return localStorage.getItem(STORAGE_KEY) === "realtime";
    } catch {
      return false;
    }
  });

  // Derive active mode
  const activeMode: VoiceModeType = 
    forceMode || (realtimeAvailable && realtimeEnabled ? "realtime" : "turn-based");

  const setMode = useCallback((mode: VoiceModeType) => {
    setRealtimeEnabled(mode === "realtime");
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(activeMode === "realtime" ? "turn-based" : "realtime");
  }, [activeMode, setMode]);

  return {
    activeMode,
    realtimeAvailable,
    realtimeEnabled,
    toggleMode,
    setMode,
  };
}

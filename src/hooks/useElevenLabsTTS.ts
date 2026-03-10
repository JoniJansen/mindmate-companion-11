import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VoiceSpeed } from "./useVoiceSettings";

interface UseElevenLabsTTSOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`;

// Simple cache for audio URLs to avoid regenerating
const audioCache = new Map<string, string>();

export function useElevenLabsTTS(options: UseElevenLabsTTSOptions = {}) {
  const { onStart, onEnd, onError } = options;
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  // Generation counter to prevent stale fetches from playing
  const generationRef = useRef(0);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setLoadingMessageId(null);
    currentMessageIdRef.current = null;
  }, []);

  const speak = useCallback(async (
    text: string,
    voiceId: string,
    language: "en" | "de",
    speed: VoiceSpeed = 1.0,
    messageId?: string,
    _retryCount = 0
  ) => {
    if (!text.trim()) return;

    // Stop any current playback
    stop();

    // Increment generation so any in-flight fetch from a previous call won't play
    const thisGeneration = ++generationRef.current;

    // Check cache first
    const cacheKey = `${text}-${voiceId}-${language}-${speed}`;
    let audioUrl = audioCache.get(cacheKey);

    if (!audioUrl) {
      setIsLoading(true);
      setLoadingMessageId(messageId || null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        // Timeout: 15s max for TTS request
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text, voiceId, language, speed }),
          signal: controller.signal,
        });
        
        clearTimeout(timeout);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || "TTS request failed";
          throw new Error(errorMsg);
        }

        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        
        // Cache the URL (limit cache size)
        if (audioCache.size > 50) {
          const firstKey = audioCache.keys().next().value;
          if (firstKey) {
            const oldUrl = audioCache.get(firstKey);
            if (oldUrl) URL.revokeObjectURL(oldUrl);
            audioCache.delete(firstKey);
          }
        }
        audioCache.set(cacheKey, audioUrl);
      } catch (error: any) {
        if (import.meta.env.DEV) console.error("TTS error:", error);
        setIsLoading(false);
        setLoadingMessageId(null);
        
        // Retry once on timeout/network errors
        if (_retryCount < 1 && (error.name === "AbortError" || error.message?.includes("fetch"))) {
          if (import.meta.env.DEV) console.info("TTS retry attempt...");
          setTimeout(() => speak(text, voiceId, language, speed, messageId, _retryCount + 1), 1000);
          return;
        }
        
        onError?.(error instanceof Error ? error.message : "TTS failed");
        return;
      }
      
      setIsLoading(false);
      setLoadingMessageId(null);
    }

    // Play the audio
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    currentMessageIdRef.current = messageId || null;

    audio.onplay = () => {
      setIsSpeaking(true);
      onStart?.();
    };

    audio.onended = () => {
      setIsSpeaking(false);
      currentMessageIdRef.current = null;
      onEnd?.();
    };

    audio.onerror = () => {
      setIsSpeaking(false);
      currentMessageIdRef.current = null;
      setLoadingMessageId(null);
      onError?.("Audio playback failed");
    };

    try {
      await audio.play();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Audio play error:", error);
      setIsSpeaking(false);
      setLoadingMessageId(null);
      onError?.("Could not play audio");
    }
  }, [stop, onStart, onEnd, onError]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  }, []);

  const isPlayingMessage = useCallback((messageId: string) => {
    return isSpeaking && currentMessageIdRef.current === messageId;
  }, [isSpeaking]);

  const isLoadingMessage = useCallback((messageId: string) => {
    return isLoading && loadingMessageId === messageId;
  }, [isLoading, loadingMessageId]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isLoading,
    isPlayingMessage,
    isLoadingMessage,
  };
}

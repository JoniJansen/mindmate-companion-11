import { useState, useCallback, useRef } from "react";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    currentMessageIdRef.current = null;
  }, []);

  const speak = useCallback(async (
    text: string,
    voiceId: string,
    language: "en" | "de",
    speed: VoiceSpeed = 1.0,
    messageId?: string
  ) => {
    if (!text.trim()) return;

    // Stop any current playback
    stop();

    // Check cache first
    const cacheKey = `${text}-${voiceId}-${language}-${speed}`;
    let audioUrl = audioCache.get(cacheKey);

    if (!audioUrl) {
      setIsLoading(true);
      
      try {
        const response = await fetch(TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text,
            voiceId,
            language,
            speed,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "TTS request failed");
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
      } catch (error) {
        console.error("TTS error:", error);
        setIsLoading(false);
        onError?.(error instanceof Error ? error.message : "TTS failed");
        return;
      }
      
      setIsLoading(false);
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
      onError?.("Audio playback failed");
    };

    try {
      await audio.play();
    } catch (error) {
      console.error("Audio play error:", error);
      setIsSpeaking(false);
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

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isLoading,
    isPlayingMessage,
  };
}

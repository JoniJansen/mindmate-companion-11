import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VoiceSpeed } from "./useVoiceSettings";

interface UseElevenLabsTTSOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface SpeakRequest {
  text: string;
  voiceId: string;
  language: "en" | "de";
  speed: VoiceSpeed;
  messageId?: string;
  retryCount: number;
  intentId: number;
}

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`;
const audioCache = new Map<string, string>();

export function useElevenLabsTTS(options: UseElevenLabsTTSOptions = {}) {
  const { onStart, onEnd, onError } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingRequestRef = useRef<SpeakRequest | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const fetchInFlightRef = useRef(false);
  const latestIntentRef = useRef(0);
  const isUnmountedRef = useRef(false);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const stopAudioOnly = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    currentMessageIdRef.current = null;
  }, []);

  const playAudio = useCallback(async (audioUrl: string, messageId?: string, intentId?: number, preUnlockedAudio?: HTMLAudioElement) => {
    if (intentId && intentId !== latestIntentRef.current) return;

    // Use pre-unlocked audio element if provided (iOS gesture context preservation)
    const audio = preUnlockedAudio || new Audio(audioUrl);
    if (!preUnlockedAudio) {
      audio.src = audioUrl;
    } else {
      audio.src = audioUrl;
    }
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
  }, [onStart, onEnd, onError]);

  const executeSpeak = useCallback(async (request: SpeakRequest): Promise<void> => {
    if (!request.text.trim()) return;

    const { text, voiceId, language, speed, messageId, retryCount, intentId } = request;
    const cacheKey = `${text}-${voiceId}-${language}-${speed}`;
    const cachedAudioUrl = audioCache.get(cacheKey);

    if (cachedAudioUrl) {
      await playAudio(cachedAudioUrl, messageId, intentId);
      return;
    }

    fetchInFlightRef.current = true;
    setIsLoading(true);
    setLoadingMessageId(messageId || null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeout = window.setTimeout(() => controller.abort(), 15000);

      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, voiceId, language, speed }),
        signal: controller.signal,
      });

      window.clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || "TTS request failed";
        throw new Error(errorMsg);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioCache.size > 50) {
        const firstKey = audioCache.keys().next().value;
        if (firstKey) {
          const oldUrl = audioCache.get(firstKey);
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          audioCache.delete(firstKey);
        }
      }
      audioCache.set(cacheKey, audioUrl);

      if (intentId !== latestIntentRef.current || isUnmountedRef.current || pendingRequestRef.current) {
        return;
      }

      await playAudio(audioUrl, messageId, intentId);
    } catch (error: any) {
      if (import.meta.env.DEV) console.error("TTS error:", error);

      const isAbortError = error?.name === "AbortError";
      const hasPendingRequest = Boolean(pendingRequestRef.current);
      const isRateLimitError = typeof error?.message === "string" && error.message.includes("rate limit");

      if (!isAbortError && !hasPendingRequest && !isRateLimitError && retryCount < 1 && error?.message?.includes("fetch")) {
        clearRetryTimeout();
        retryTimeoutRef.current = window.setTimeout(() => {
          retryTimeoutRef.current = null;
          void executeSpeak({ ...request, retryCount: retryCount + 1 });
        }, 1000);
        return;
      }

      if (!isAbortError && !hasPendingRequest) {
        onError?.(error instanceof Error ? error.message : "TTS failed");
      }
    } finally {
      fetchInFlightRef.current = false;
      abortControllerRef.current = null;
      setIsLoading(false);
      setLoadingMessageId(null);

      const nextRequest = pendingRequestRef.current;
      pendingRequestRef.current = null;

      if (nextRequest && !isUnmountedRef.current) {
        void executeSpeak(nextRequest);
      }
    }
  }, [clearRetryTimeout, onError, playAudio]);

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      clearRetryTimeout();
      pendingRequestRef.current = null;
      abortControllerRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Revoke all cached object URLs to prevent memory leaks
      audioCache.forEach((url) => URL.revokeObjectURL(url));
      audioCache.clear();
    };
  }, [clearRetryTimeout]);

  const stop = useCallback(() => {
    latestIntentRef.current += 1;
    clearRetryTimeout();
    pendingRequestRef.current = null;
    abortControllerRef.current?.abort();
    stopAudioOnly();
    setIsLoading(false);
    setLoadingMessageId(null);
  }, [clearRetryTimeout, stopAudioOnly]);

  const speak = useCallback(async (
    text: string,
    voiceId: string,
    language: "en" | "de",
    speed: VoiceSpeed = 1.0,
    messageId?: string,
    retryCount = 0
  ) => {
    if (!text.trim()) return;

    clearRetryTimeout();
    stopAudioOnly();

    const request: SpeakRequest = {
      text,
      voiceId,
      language,
      speed,
      messageId,
      retryCount,
      intentId: ++latestIntentRef.current,
    };

    if (fetchInFlightRef.current) {
      pendingRequestRef.current = request;
      return;
    }

    await executeSpeak(request);
  }, [clearRetryTimeout, executeSpeak, stopAudioOnly]);

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

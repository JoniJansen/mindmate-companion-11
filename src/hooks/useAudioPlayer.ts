import { useState, useCallback, useRef, useEffect } from "react";
import { useNetworkStatus } from "./useNetworkStatus";

export type AudioPlayerState = "idle" | "loading" | "playing" | "paused" | "error";

interface UseAudioPlayerOptions {
  onEnd?: () => void;
  onError?: (msg: string) => void;
}

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`;
const MAX_CHUNK_LENGTH = 1500;

// Split text into chunks at sentence boundaries
function chunkText(text: string): string[] {
  if (text.length <= MAX_CHUNK_LENGTH) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHUNK_LENGTH) {
      chunks.push(remaining);
      break;
    }

    // Find last sentence boundary within limit
    let splitAt = -1;
    for (const sep of [". ", ".\n", "! ", "? ", ".\u00A0"]) {
      const idx = remaining.lastIndexOf(sep, MAX_CHUNK_LENGTH);
      if (idx > splitAt) splitAt = idx + sep.length;
    }
    if (splitAt <= 0) {
      // Fallback: split at last space
      splitAt = remaining.lastIndexOf(" ", MAX_CHUNK_LENGTH);
      if (splitAt <= 0) splitAt = MAX_CHUNK_LENGTH;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  return chunks.filter(Boolean);
}

// Simple blob cache
const blobCache = new Map<string, string>();
function getCachedUrl(key: string): string | undefined {
  return blobCache.get(key);
}
function setCachedUrl(key: string, url: string) {
  if (blobCache.size > 30) {
    const first = blobCache.keys().next().value;
    if (first) {
      const old = blobCache.get(first);
      if (old) URL.revokeObjectURL(old);
      blobCache.delete(first);
    }
  }
  blobCache.set(key, url);
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const { onEnd, onError } = options;
  const { isOnline } = useNetworkStatus();

  const [state, setState] = useState<AudioPlayerState>("idle");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sleepTimer, setSleepTimer] = useState(0); // seconds remaining

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const chunkQueueRef = useRef<string[]>([]);
  const currentChunkRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const cancelledRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      audioRef.current?.pause();
      clearInterval(timerRef.current);
    };
  }, []);

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimer <= 0) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSleepTimer(prev => {
        if (prev <= 1) {
          stopAll();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [sleepTimer > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchChunkAudio = useCallback(async (
    text: string,
    voiceId: string,
    speed: number,
    signal: AbortSignal
  ): Promise<string> => {
    const cacheKey = `${text}-${voiceId}-${speed}`;
    const cached = getCachedUrl(cacheKey);
    if (cached) return cached;

    const response = await fetch(TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ text, voiceId, speed }),
      signal,
    });

    if (!response.ok) throw new Error("TTS request failed");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    setCachedUrl(cacheKey, url);
    return url;
  }, []);

  const playNextChunk = useCallback(async (
    voiceId: string,
    speed: number,
    signal: AbortSignal
  ) => {
    const chunks = chunkQueueRef.current;
    const idx = currentChunkRef.current;

    if (idx >= chunks.length || cancelledRef.current) {
      setState("idle");
      setActiveSessionId(null);
      onEnd?.();
      return;
    }

    try {
      if (idx === 0) setState("loading");
      
      const url = await fetchChunkAudio(chunks[idx], voiceId, speed, signal);
      
      if (cancelledRef.current) return;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setState("playing");
      audio.onended = () => {
        currentChunkRef.current++;
        playNextChunk(voiceId, speed, signal);
      };
      audio.onerror = () => {
        setState("error");
        onError?.("Audio playback failed");
      };

      await audio.play();
    } catch (err: unknown) {
      if (cancelledRef.current || (err instanceof DOMException && err.name === "AbortError")) return;
      setState("error");
      onError?.(err instanceof Error ? err.message : "TTS failed");
    }
  }, [fetchChunkAudio, onEnd, onError]);

  const play = useCallback(async (
    sessionId: string,
    text: string,
    voiceId: string,
    speed = 0.9
  ) => {
    if (!isOnline) {
      onError?.("offline");
      return;
    }

    // Stop any current playback
    stopAll();

    cancelledRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;

    setActiveSessionId(sessionId);
    chunkQueueRef.current = chunkText(text);
    currentChunkRef.current = 0;

    await playNextChunk(voiceId, speed, controller.signal);
  }, [isOnline, playNextChunk, onError]);

  const stopAll = useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setState("idle");
    setActiveSessionId(null);
    chunkQueueRef.current = [];
    currentChunkRef.current = 0;
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && state === "playing") {
      audioRef.current.pause();
      setState("paused");
    }
  }, [state]);

  const resume = useCallback(() => {
    if (audioRef.current && state === "paused") {
      audioRef.current.play();
      setState("playing");
    }
  }, [state]);

  const togglePlayPause = useCallback((
    sessionId: string,
    text: string,
    voiceId: string,
    speed?: number
  ) => {
    if (activeSessionId === sessionId) {
      if (state === "playing") {
        pause();
      } else if (state === "paused") {
        resume();
      } else {
        play(sessionId, text, voiceId, speed);
      }
    } else {
      play(sessionId, text, voiceId, speed);
    }
  }, [activeSessionId, state, pause, resume, play]);

  const startSleepTimer = useCallback((minutes: number) => {
    setSleepTimer(minutes * 60);
  }, []);

  const cancelSleepTimer = useCallback(() => {
    setSleepTimer(0);
    clearInterval(timerRef.current);
  }, []);

  return {
    state,
    activeSessionId,
    sleepTimer,
    isOnline,
    play,
    pause,
    resume,
    stop: stopAll,
    togglePlayPause,
    startSleepTimer,
    cancelSleepTimer,
  };
}

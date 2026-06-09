/**
 * useSpeech — Platform-Selector-Hook for Speech-Recognition.
 *
 * Switches between:
 *  - Web  → delegates to `useSpeechRecognition` (Web Speech API)
 *  - Native (iOS/Android) → uses `useNativeSpeech` (Capacitor plugin wrapper)
 *
 * Return-Shape is IDENTICAL to `useSpeechRecognition`, so consumers
 * (useChatVoice, Journal, Home) can swap the import 1:1.
 *
 * ============================================================================
 * HOOK-SELECTION STRATEGY (Rules of Hooks)
 * ============================================================================
 * `Capacitor.isNativePlatform()` returns a constant for the entire lifetime
 * of the app — it is determined at bundle-load time and never changes between
 * renders. Therefore conditionally calling one of two hooks based on this
 * value is provably safe: the hook-call order is stable across every render
 * of the same component on the same device.
 *
 * The lint rule `react-hooks/rules-of-hooks` does not know this invariant, so
 * we suppress it with an inline disable + explanatory comment. The alternative
 * (calling both hooks every render and discarding one) would needlessly
 * instantiate a Web `SpeechRecognition` object on native devices (or vice
 * versa), and unnecessarily attach permission listeners that never fire.
 * ============================================================================
 */

import { useEffect, useState, useCallback, useRef } from "react";
import type { PluginListenerHandle } from "@capacitor/core";
import { useSpeechRecognition } from "./useSpeechRecognition";
import {
  isNativeSpeechPlatform,
  nativeAvailable,
  nativeRequestPermissions,
  nativeCheckPermissions,
  nativeStart,
  nativeStop,
  nativeOnPartial,
  nativeOnListening,
  nativeRemoveAllListeners,
} from "@/lib/nativeSpeech";

interface UseSpeechOptions {
  continuous?: boolean;
  onFinalTranscript?: (text: string) => void;
}

export interface UseSpeechResult {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  fullTranscript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
}

// Frozen at module-load — Capacitor platform identity does not change at runtime.
const IS_NATIVE = isNativeSpeechPlatform();

export function useSpeech(
  language: string = "de-DE",
  options: UseSpeechOptions = {}
): UseSpeechResult {
  // See HOOK-SELECTION STRATEGY above for why this conditional hook is safe.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return IS_NATIVE
    ? useNativeSpeech(language, options)
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useSpeechRecognition(language, options);
}

// ============================================================================
// Native implementation (iOS / Android via @capacitor-community/speech-recognition)
// ============================================================================

/**
 * LIMITATION (Native): unlike the web hook, native does not auto-restart
 * when continuous=true and the OS stops listening due to silence/timeout.
 * The user must explicitly call startListening() again. This is acceptable
 * for the initial version. Future: implement auto-restart parity.
 */
function useNativeSpeech(
  language: string,
  options: UseSpeechOptions
): UseSpeechResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [fullTranscript, setFullTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partialListenerRef = useRef<PluginListenerHandle | null>(null);
  const listeningListenerRef = useRef<PluginListenerHandle | null>(null);
  // Latest interim string — committed to `transcript` + `fullTranscript`
  // on listeningState=stopped, then forwarded to onFinalTranscript.
  const accumulatedRef = useRef<string>("");
  // Keep callback ref fresh so we don't tear down/rebuild listeners on every render.
  const onFinalRef = useRef(options.onFinalTranscript);
  useEffect(() => {
    onFinalRef.current = options.onFinalTranscript;
  }, [options.onFinalTranscript]);

  // Probe availability on mount.
  useEffect(() => {
    let mounted = true;
    nativeAvailable()
      .then((available) => {
        if (mounted) setIsSupported(available);
      })
      .catch(() => {
        if (mounted) setIsSupported(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const detachListeners = useCallback(async () => {
    try {
      await nativeRemoveAllListeners();
    } catch {
      /* ignore */
    }
    partialListenerRef.current = null;
    listeningListenerRef.current = null;
  }, []);

  const startListening = useCallback(async () => {
    try {
      // Check permissions first — only request if not already granted,
      // so users aren't re-prompted on every start.
      let status = await nativeCheckPermissions();
      if (status !== "granted") {
        status = await nativeRequestPermissions();
        if (status !== "granted") {
          setError("not-allowed");
          return;
        }
      }

      // Reset state.
      accumulatedRef.current = "";
      setTranscript("");
      setInterimTranscript("");
      setError(null);

      // Attach listeners FIRST, then start. Explicit `await` on addListener
      // is REQUIRED (see Thenable-Trap-Mitigation in nativeSpeech.ts).
      partialListenerRef.current = await nativeOnPartial((data) => {
        const latest = (data.matches && data.matches[0]) || "";
        accumulatedRef.current = latest;
        setInterimTranscript(latest);
      });

      listeningListenerRef.current = await nativeOnListening((data) => {
        const s = data.status;
        if (s === "started" || s === "listening") {
          setIsListening(true);
        } else if (s === "stopped") {
          setIsListening(false);
          const final = accumulatedRef.current.trim();
          if (final) {
            setTranscript(final);
            setFullTranscript((prev) => (prev ? prev + " " + final : final));
            setInterimTranscript("");
            onFinalRef.current?.(final);
          }
        }
      });

      await nativeStart({
        language,
        partialResults: true,
        popup: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "start-failed";
      setError(msg);
      setIsListening(false);
      await detachListeners();
    }
  }, [language, detachListeners]);

  const stopListening = useCallback(async () => {
    try {
      await nativeStop();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "stop-failed";
      setError(msg);
    } finally {
      await detachListeners();
      setIsListening(false);
    }
  }, [detachListeners]);

  // Unmount cleanup — fire-and-forget.
  useEffect(() => {
    return () => {
      nativeRemoveAllListeners().catch(() => {
        /* ignore */
      });
      partialListenerRef.current = null;
      listeningListenerRef.current = null;
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      void stopListening();
    } else {
      void startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setFullTranscript("");
    accumulatedRef.current = "";
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    // Mirror web hook: fullTranscript is "committed + currently-interim", trimmed.
    fullTranscript: (fullTranscript + " " + interimTranscript).trim(),
    isSupported,
    error,
    startListening: () => void startListening(),
    stopListening: () => void stopListening(),
    toggleListening,
    resetTranscript,
  };
}

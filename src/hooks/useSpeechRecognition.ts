import { useState, useEffect, useCallback, useRef } from "react";
import { isNativeApp } from "@/lib/nativeDetect";

// ── Types for Web Speech API fallback ──

interface WebSpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface WebSpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface WebSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => WebSpeechRecognition;
    webkitSpeechRecognition: new () => WebSpeechRecognition;
  }
}

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  onFinalTranscript?: (transcript: string) => void;
}

// ── Capacitor native speech recognition adapter ──

let _nativeAvailable: boolean | null = null;
let _SpeechRecognitionPlugin: any = null;

async function loadNativePlugin() {
  if (_nativeAvailable !== null) return _nativeAvailable;
  try {
    const mod = await import("@capacitor-community/speech-recognition");
    _SpeechRecognitionPlugin = mod.SpeechRecognition;
    // Check if the plugin is actually available on this platform
    const { available } = await _SpeechRecognitionPlugin.available();
    _nativeAvailable = available;
    return available;
  } catch {
    _nativeAvailable = false;
    return false;
  }
}

export function useSpeechRecognition(
  language: string = "de-DE",
  options: UseSpeechRecognitionOptions = {}
) {
  const { continuous = true, onFinalTranscript } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<WebSpeechRecognition | null>(null);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const shouldRestartRef = useRef(false);
  const useNativeRef = useRef(false);
  const nativeListenerRef = useRef<any>(null);

  // Keep callback ref updated
  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // Initialize: prefer native on Capacitor, fall back to Web Speech API
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Try native first if running in Capacitor
      if (isNativeApp()) {
        const nativeOk = await loadNativePlugin();
        if (!cancelled && nativeOk) {
          useNativeRef.current = true;
          setIsSupported(true);

          // Request permission
          try {
            const { permission } = await _SpeechRecognitionPlugin.requestPermissions();
            if (permission === "denied") {
              setError("not-allowed");
              setIsSupported(false);
            }
          } catch {
            // Permission API may not exist on all versions
          }
          return;
        }
      }

      // Fall back to Web Speech API
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!cancelled) setIsSupported(!!SR);

      if (SR && !cancelled) {
        const recognition = new SR();
        recognitionRef.current = recognition;
        recognition.continuous = continuous;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event: WebSpeechRecognitionEvent) => {
          let finalText = "";
          let interimText = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalText += result[0].transcript;
            } else {
              interimText += result[0].transcript;
            }
          }

          if (finalText) {
            setTranscript(prev => (prev + " " + finalText).trim());
            setInterimTranscript("");
            if (onFinalTranscriptRef.current) {
              onFinalTranscriptRef.current(finalText);
            }
          } else {
            setInterimTranscript(interimText);
          }
        };

        recognition.onerror = (event: WebSpeechRecognitionErrorEvent) => {
          if (event.error === "no-speech" || event.error === "aborted") return;
          if (import.meta.env.DEV) console.error("Speech recognition error:", event.error);
          setError(event.error);
          setIsListening(false);
          shouldRestartRef.current = false;
        };

        recognition.onend = () => {
          if (shouldRestartRef.current && continuous) {
            try {
              recognitionRef.current?.start();
            } catch {
              setIsListening(false);
              shouldRestartRef.current = false;
            }
          } else {
            setIsListening(false);
          }
        };

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };
      }
    }

    init();

    return () => {
      cancelled = true;
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      // Clean up native listener
      if (nativeListenerRef.current) {
        try { nativeListenerRef.current.remove(); } catch {}
        nativeListenerRef.current = null;
      }
    };
  }, [language, continuous]);

  // Update language when it changes (web only)
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const startListening = useCallback(async () => {
    if (isListening) return;
    setTranscript("");
    setInterimTranscript("");
    setError(null);

    if (useNativeRef.current && _SpeechRecognitionPlugin) {
      try {
        // Set up partial results listener
        nativeListenerRef.current = await _SpeechRecognitionPlugin.addListener(
          "partialResults",
          (data: { matches: string[] }) => {
            if (data.matches?.length > 0) {
              setInterimTranscript(data.matches[0]);
            }
          }
        );

        await _SpeechRecognitionPlugin.start({
          language: language,
          maxResults: 5,
          partialResults: true,
          popup: false,
        });

        setIsListening(true);

        // Listen for final results (the plugin resolves when speech ends)
        // We handle this via a polling/event approach
        _SpeechRecognitionPlugin.addListener(
          "listeningState",
          (state: { status: string }) => {
            if (state.status === "stopped") {
              setIsListening(false);
            }
          }
        );
      } catch (e: any) {
        if (import.meta.env.DEV) console.warn("[Native STT] Start error:", e);
        setError("not-available");
      }
      return;
    }

    // Web fallback
    if (!recognitionRef.current) return;
    shouldRestartRef.current = true;
    try {
      recognitionRef.current.start();
    } catch {
      if (import.meta.env.DEV) console.warn("Speech recognition unavailable in this environment");
      setError("not-available");
      shouldRestartRef.current = false;
    }
  }, [isListening, language]);

  const stopListening = useCallback(async () => {
    if (useNativeRef.current && _SpeechRecognitionPlugin) {
      try {
        const result = await _SpeechRecognitionPlugin.stop();
        // Process final results
        if (result?.matches?.length > 0) {
          const finalText = result.matches[0];
          setTranscript(prev => (prev + " " + finalText).trim());
          setInterimTranscript("");
          if (onFinalTranscriptRef.current) {
            onFinalTranscriptRef.current(finalText);
          }
        }
      } catch {}
      // Clean up listener
      if (nativeListenerRef.current) {
        try { nativeListenerRef.current.remove(); } catch {}
        nativeListenerRef.current = null;
      }
      setIsListening(false);
      return;
    }

    // Web fallback
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript: (transcript + " " + interimTranscript).trim(),
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}

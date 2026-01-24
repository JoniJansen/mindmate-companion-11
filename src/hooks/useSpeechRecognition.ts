import { useState, useEffect, useCallback, useRef } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  onFinalTranscript?: (transcript: string) => void;
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const shouldRestartRef = useRef(false);
  
  // Keep callback ref updated
  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
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
          // Trigger callback for final transcript
          if (onFinalTranscriptRef.current) {
            onFinalTranscriptRef.current(finalText);
          }
        } else {
          setInterimTranscript(interimText);
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Ignore "no-speech" and "aborted" errors as they're normal
        if (event.error === "no-speech" || event.error === "aborted") {
          return;
        }
        console.error("Speech recognition error:", event.error);
        setError(event.error);
        setIsListening(false);
        shouldRestartRef.current = false;
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if continuous mode and should be listening
        if (shouldRestartRef.current && continuous) {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            setIsListening(false);
            shouldRestartRef.current = false;
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };
    }

    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors on cleanup
        }
      }
    };
  }, [language, continuous]);

  // Update language when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      setInterimTranscript("");
      setError(null);
      shouldRestartRef.current = true;
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        setError("Failed to start");
        shouldRestartRef.current = false;
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }
    // Ensure UI state is reset even if recognition fails
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
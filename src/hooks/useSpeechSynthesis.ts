import { useState, useEffect, useCallback, useRef } from "react";

interface UseSpeechSynthesisOptions {
  lang?: string;
  pitch?: number;
  rate?: number;
  voiceType?: "female" | "male";
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const {
    lang = "de-DE",
    pitch = 1,
    rate = 0.9,
    voiceType = "female",
    onStart,
    onEnd,
    onError,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const getPreferredVoice = useCallback(() => {
    // Filter voices by language
    const langVoices = voices.filter((v) => v.lang.startsWith(lang.split("-")[0]));
    
    if (langVoices.length === 0) {
      return voices[0] || null;
    }

    // Try to find a voice matching the preferred type
    const preferredNames = voiceType === "female" 
      ? ["Google Deutsch", "Anna", "Helena", "Petra", "female", "Frau", "Microsoft Katja", "Vicki"]
      : ["Google Deutsch", "Hans", "Stefan", "male", "Herr", "Microsoft Stefan", "Markus"];

    for (const name of preferredNames) {
      const found = langVoices.find((v) => 
        v.name.toLowerCase().includes(name.toLowerCase())
      );
      if (found) return found;
    }

    // Fallback to first available voice for the language
    return langVoices[0];
  }, [voices, lang, voiceType]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text for better speech - remove markdown, URLs, etc.
    const cleanedText = text
      .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
      .replace(/\*([^*]+)\*/g, "$1") // Remove italic
      .replace(/`([^`]+)`/g, "$1") // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links: keep text
      .replace(/https?:\/\/[^\s]+/g, "") // Remove URLs
      .replace(/[#>-]/g, "") // Remove markdown symbols
      .trim();

    if (!cleanedText) return;

    // Split long text into chunks for more natural speech
    const maxChunkLength = 200;
    const sentences = cleanedText.match(/[^.!?]+[.!?]+/g) || [cleanedText];
    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkLength && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // Speak each chunk sequentially
    let chunkIndex = 0;
    
    const speakNextChunk = () => {
      if (chunkIndex >= chunks.length) {
        setIsSpeaking(false);
        onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
      utteranceRef.current = utterance;

      const voice = getPreferredVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.lang = lang;
      utterance.pitch = pitch;
      utterance.rate = rate;

      utterance.onstart = () => {
        if (chunkIndex === 0) {
          setIsSpeaking(true);
          onStart?.();
        }
      };

      utterance.onend = () => {
        chunkIndex++;
        speakNextChunk();
      };

      utterance.onerror = (event) => {
        if (event.error !== "canceled") {
          setIsSpeaking(false);
          onError?.(event.error);
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextChunk();
  }, [isSupported, lang, pitch, rate, getPreferredVoice, onStart, onEnd, onError]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.pause();
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices,
  };
}

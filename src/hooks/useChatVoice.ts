import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSpeech } from "@/hooks/useSpeech";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { analytics } from "@/hooks/useAnalytics";
import { useVoiceSettings, voiceIds } from "@/hooks/useVoiceSettings";
import { usePremium } from "@/hooks/usePremium";
import { useToast } from "@/hooks/use-toast";
import { getCompanionVoiceProfile } from "@/data/companionVoiceProfiles";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isError?: boolean;
}

export function useChatVoice(companionArchetypeId?: string, isComposerBusy = false) {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { canUseVoice } = usePremium();
  const { settings: voiceSettings, getVoiceId, getEffectiveLanguage, updateSetting } = useVoiceSettings();

  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [showTranscriptConfirm, setShowTranscriptConfirm] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState("");
  const [inputValue, setInputValue] = useState("");

  // Config value (Web Speech API BCP-47 locale) — not user-facing text
  const speechLang = language === "en" ? "en-US" : "de-DE";

  // Guard: prevent auto-restart for a brief window after sending
  const justSentRef = useRef(false);

  const { speak: speakTTS, stop: stopTTS, isSpeaking, isLoading: isTTSLoading, isPlayingMessage, isLoadingMessage } = useElevenLabsTTS({
    onError: (error) => {
      if (import.meta.env.DEV) console.warn("[Voice] TTS error:", error);
      toast({ title: t("chat.voiceFailed"), description: error, variant: "destructive" });
    },
  });

  const { isListening, fullTranscript, isSupported: isSpeechSupported, startListening, stopListening, resetTranscript, error: sttError } = useSpeech(speechLang, {
    continuous: true,
    onFinalTranscript: (transcript) => {
      if (transcript.trim()) {
        // Build 60 #1A: STT is FREE for all users; pendingTranscript flow is shared.
        setPendingTranscript(prev => (prev + " " + transcript).trim());
        analytics.track("mic_transcription_success", {
          tier: canUseVoice ? "premium" : "free",
          charCount: transcript.trim().length,
        });
      }
    },
  });

  // Handle STT errors + permission telemetry
  const hasShownMicErrorRef = useRef(false);
  const hasTrackedDeniedRef = useRef(false);
  useEffect(() => {
    if (sttError === "not-allowed") {
      if (!hasTrackedDeniedRef.current) {
        hasTrackedDeniedRef.current = true;
        analytics.track("mic_permission_denied", { tier: canUseVoice ? "premium" : "free" });
      }
      if (!hasShownMicErrorRef.current && !voiceModeEnabled) {
        hasShownMicErrorRef.current = true;
        toast({ title: t("voice.micPermissionDenied"), description: t("voice.enableMic"), variant: "destructive" });
      }
    } else if (sttError && sttError !== "not-allowed") {
      analytics.track("mic_transcription_failure", {
        tier: canUseVoice ? "premium" : "free",
        errorCode: sttError,
      });
    } else if (!sttError) {
      hasShownMicErrorRef.current = false;
      hasTrackedDeniedRef.current = false;
    }
  }, [sttError, t, toast, voiceModeEnabled, canUseVoice]);

  // Track first successful mic-listen as permission_granted
  const hasTrackedGrantedRef = useRef(false);
  useEffect(() => {
    if (isListening && !hasTrackedGrantedRef.current) {
      hasTrackedGrantedRef.current = true;
      analytics.track("mic_permission_granted", { tier: canUseVoice ? "premium" : "free" });
    }
  }, [isListening, canUseVoice]);

  // Track cooldown phase: brief pause after speaking ends before re-enabling mic
  const [isCooldown, setIsCooldown] = useState(false);
  const cooldownRef = useRef<number | null>(null);

  useEffect(() => {
    if (isSpeaking) {
      if (cooldownRef.current) { window.clearTimeout(cooldownRef.current); cooldownRef.current = null; }
      setIsCooldown(false);
    } else if (!isSpeaking && voiceModeEnabled && !isComposerBusy && !isTTSLoading) {
      setIsCooldown(true);
      cooldownRef.current = window.setTimeout(() => {
        cooldownRef.current = null;
        setIsCooldown(false);
      }, 800);
    }
    return () => { if (cooldownRef.current) { window.clearTimeout(cooldownRef.current); cooldownRef.current = null; } };
  }, [isSpeaking, voiceModeEnabled, isComposerBusy, isTTSLoading]);

  // Auto-restart listening after cooldown ends
  // Added justSentRef guard to prevent restart during the brief TTS initialization window
  useEffect(() => {
    if (justSentRef.current) return;
    if (!isSpeaking && !isTTSLoading && !isCooldown && voiceModeEnabled && isSpeechSupported && !isListening && !showTranscriptConfirm && canUseVoice && !sttError && !isComposerBusy) {
      resetTranscript(); setPendingTranscript(""); startListening();
    }
  }, [isSpeaking, isTTSLoading, isCooldown, voiceModeEnabled, isSpeechSupported, isListening, showTranscriptConfirm, resetTranscript, startListening, canUseVoice, sttError, isComposerBusy]);

  // Stop listening when speaking
  useEffect(() => { if (isSpeaking && isListening) stopListening(); }, [isSpeaking, isListening, stopListening]);

  // Auto-send in voice mode: after user stops recording, auto-send after brief pause
  const autoSendTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (autoSendTimeoutRef.current) {
      window.clearTimeout(autoSendTimeoutRef.current);
      autoSendTimeoutRef.current = null;
    }

    if (pendingTranscript && !isListening && voiceModeEnabled) {
      autoSendTimeoutRef.current = window.setTimeout(() => {
        autoSendTimeoutRef.current = null;
        if (pendingTranscript.trim()) {
          // Set justSent guard to prevent auto-restart during TTS init
          justSentRef.current = true;
          window.dispatchEvent(new CustomEvent("voice-send", { detail: pendingTranscript.trim() }));
          setPendingTranscript("");
          setInputValue("");
          setShowTranscriptConfirm(false);
          // Clear guard after React has time to process isComposerBusy
          window.setTimeout(() => { justSentRef.current = false; }, 300);
        }
      }, 1200);
    }

    return () => {
      if (autoSendTimeoutRef.current) {
        window.clearTimeout(autoSendTimeoutRef.current);
      }
    };
  }, [pendingTranscript, isListening, voiceModeEnabled]);

  // Show transcript confirm after stop (only when NOT in voice mode)
  useEffect(() => {
    if (pendingTranscript && !isListening && !voiceModeEnabled) {
      const timeoutId = setTimeout(() => {
        if (pendingTranscript.trim()) { setShowTranscriptConfirm(true); setInputValue(pendingTranscript); }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [pendingTranscript, isListening, voiceModeEnabled]);

  // Update input from live transcript
  useEffect(() => {
    if (fullTranscript && isListening) { setInputValue((pendingTranscript + " " + fullTranscript).trim()); }
  }, [fullTranscript, isListening, pendingTranscript]);

  const toggleVoiceMode = useCallback(() => {
    if (isSpeaking) stopTTS();
    if (isListening) stopListening();
    setVoiceModeEnabled(!voiceModeEnabled);
    setShowTranscriptConfirm(false); setPendingTranscript(""); setInputValue("");
    justSentRef.current = false;
  }, [voiceModeEnabled, isSpeaking, isListening, stopTTS, stopListening]);

  const toggleRecording = useCallback(() => {
    if (isListening) { stopListening(); } else {
      if (isSpeaking) stopTTS();
      resetTranscript(); setPendingTranscript(""); setInputValue(""); setShowTranscriptConfirm(false); startListening();
    }
  }, [isListening, isSpeaking, stopListening, stopTTS, resetTranscript, startListening]);

  const handleTranscriptSend = useCallback((onSend: (content: string) => void) => {
    if (inputValue.trim()) onSend(inputValue.trim());
  }, [inputValue]);

  const handleTranscriptEdit = useCallback(() => { setShowTranscriptConfirm(false); }, []);

  const handleTranscriptCancel = useCallback(() => {
    setShowTranscriptConfirm(false); setInputValue(""); setPendingTranscript(""); resetTranscript();
  }, [resetTranscript]);

  // Resolve voice ID: companion profile overrides global setting
  // Now supports directVoiceId and per-companion speed override
  const resolveVoiceId = useCallback((): string => {
    const effectiveLang = getEffectiveLanguage(language as "en" | "de");
    if (companionArchetypeId) {
      const profile = getCompanionVoiceProfile(companionArchetypeId);
      // Use direct voice ID if specified (unique per companion)
      if (profile.directVoiceId) return profile.directVoiceId;
      return voiceIds[effectiveLang][profile.voiceType];
    }
    return getVoiceId(language as "en" | "de");
  }, [companionArchetypeId, getVoiceId, getEffectiveLanguage, language]);

  // Resolve speed: companion override > global setting
  const resolveSpeed = useCallback((): number => {
    if (companionArchetypeId) {
      const profile = getCompanionVoiceProfile(companionArchetypeId);
      if (profile.speedOverride) return profile.speedOverride;
    }
    return voiceSettings.speed;
  }, [companionArchetypeId, voiceSettings.speed]);

  const playMessage = useCallback((message: Message) => {
    const voiceId = resolveVoiceId();
    const effectiveLang = getEffectiveLanguage(language as "en" | "de");
    speakTTS(message.content, voiceId, effectiveLang, resolveSpeed() as any, message.id);
  }, [resolveVoiceId, resolveSpeed, getEffectiveLanguage, language, speakTTS]);

  const speakResponse = useCallback((content: string, messageId: string) => {
    if (!canUseVoice || (!voiceModeEnabled && !voiceSettings.autoPlayReplies)) {
      if (import.meta.env.DEV && voiceModeEnabled) {
        console.warn("[Voice] speakResponse skipped: canUseVoice=", canUseVoice);
      }
      return;
    }
    // In voice mode, stop listening first so TTS can play
    if (isListening && voiceModeEnabled) {
      stopListening();
    } else if (isListening) {
      return; // Non-voice-mode: don't interrupt active recording
    }
    const voiceId = resolveVoiceId();
    const effectiveLang = getEffectiveLanguage(language as "en" | "de");
    if (import.meta.env.DEV) {
      console.log(`[Voice] Speaking response: voice=${voiceId}, lang=${effectiveLang}, speed=${resolveSpeed()}, chars=${content.length}`);
    }
    speakTTS(content, voiceId, effectiveLang, resolveSpeed() as any, messageId);
  }, [canUseVoice, voiceModeEnabled, voiceSettings.autoPlayReplies, isListening, stopListening, resolveVoiceId, resolveSpeed, getEffectiveLanguage, language, speakTTS]);

  return {
    // State
    voiceModeEnabled,
    showTranscriptConfirm,
    pendingTranscript,
    voiceInputValue: inputValue,
    setVoiceInputValue: setInputValue,
    
    // TTS state
    isSpeaking,
    isTTSLoading,
    isPlayingMessage,
    isLoadingMessage,
    stopTTS,
    
    // STT state
    isListening,
    isSpeechSupported,
    sttError,
    
    // Cooldown
    isCooldown,

    // Voice settings
    voiceSettings,
    updateSetting,
    canUseVoice,

    // Actions
    toggleVoiceMode,
    toggleRecording,
    handleTranscriptSend,
    handleTranscriptEdit,
    handleTranscriptCancel,
    playMessage,
    speakResponse,
    setPendingTranscript,
    setShowTranscriptConfirm,
  };
}

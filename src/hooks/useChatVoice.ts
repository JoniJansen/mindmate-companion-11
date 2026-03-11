import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
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

  const speechLang = language === "de" ? "de-DE" : "en-US";

  const { speak: speakTTS, stop: stopTTS, isSpeaking, isLoading: isTTSLoading, isPlayingMessage, isLoadingMessage } = useElevenLabsTTS({
    onError: (error) => {
      toast({ title: t("chat.voiceFailed"), description: error, variant: "destructive" });
    },
  });

  const { isListening, fullTranscript, isSupported: isSpeechSupported, startListening, stopListening, resetTranscript, error: sttError } = useSpeechRecognition(speechLang, {
    continuous: true,
    onFinalTranscript: (transcript) => {
      if (transcript.trim() && canUseVoice) {
        setPendingTranscript(prev => (prev + " " + transcript).trim());
      }
    },
  });

  // Handle STT errors
  const hasShownMicErrorRef = useRef(false);
  useEffect(() => {
    if (sttError === "not-allowed" && !hasShownMicErrorRef.current) {
      hasShownMicErrorRef.current = true;
      toast({ title: t("voice.micPermissionDenied"), description: t("voice.enableMic"), variant: "destructive" });
    } else if (!sttError) {
      hasShownMicErrorRef.current = false;
    }
  }, [sttError, t, toast]);

  // Track cooldown phase: brief pause after speaking ends before re-enabling mic
  const [isCooldown, setIsCooldown] = useState(false);
  const cooldownRef = useRef<number | null>(null);

  useEffect(() => {
    if (isSpeaking) {
      // Clear any pending cooldown if speaking restarts
      if (cooldownRef.current) { window.clearTimeout(cooldownRef.current); cooldownRef.current = null; }
      setIsCooldown(false);
    } else if (!isSpeaking && voiceModeEnabled && !isComposerBusy && !isTTSLoading) {
      // Speaking just ended → enter cooldown
      setIsCooldown(true);
      cooldownRef.current = window.setTimeout(() => {
        cooldownRef.current = null;
        setIsCooldown(false);
      }, 800);
    }
    return () => { if (cooldownRef.current) { window.clearTimeout(cooldownRef.current); cooldownRef.current = null; } };
  }, [isSpeaking, voiceModeEnabled, isComposerBusy, isTTSLoading]);

  // Auto-restart listening after cooldown ends (only if no STT error, composer not busy, and TTS not loading)
  useEffect(() => {
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
          // Fire auto-send event for fluid voice conversation
          window.dispatchEvent(new CustomEvent("voice-send", { detail: pendingTranscript.trim() }));
          setPendingTranscript("");
          setInputValue("");
          setShowTranscriptConfirm(false);
        }
      }, 1200); // 1.2s pause before auto-send for natural feel
    }

    return () => {
      if (autoSendTimeoutRef.current) {
        window.clearTimeout(autoSendTimeoutRef.current);
      }
    };
  }, [pendingTranscript, isListening, voiceModeEnabled]);

  // Show transcript confirm after stop (only when NOT in voice mode — fallback for non-panel use)
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
  const resolveVoiceId = useCallback((): string => {
    const effectiveLang = getEffectiveLanguage(language as "en" | "de");
    if (companionArchetypeId) {
      const profile = getCompanionVoiceProfile(companionArchetypeId);
      return voiceIds[effectiveLang][profile.voiceType];
    }
    return getVoiceId(language as "en" | "de");
  }, [companionArchetypeId, getVoiceId, getEffectiveLanguage, language]);

  const playMessage = useCallback((message: Message) => {
    const voiceId = resolveVoiceId();
    const effectiveLang = getEffectiveLanguage(language as "en" | "de");
    speakTTS(message.content, voiceId, effectiveLang, voiceSettings.speed, message.id);
  }, [resolveVoiceId, getEffectiveLanguage, language, speakTTS, voiceSettings.speed]);

  const speakResponse = useCallback((content: string, messageId: string) => {
    if (!canUseVoice || (!voiceModeEnabled && !voiceSettings.autoPlayReplies)) return;
    // In voice mode, stop listening first so TTS can play (don't bail)
    if (isListening && voiceModeEnabled) {
      stopListening();
    } else if (isListening) {
      return; // Non-voice-mode: don't interrupt active recording
    }
    const voiceId = resolveVoiceId();
    const effectiveLang = getEffectiveLanguage(language as "en" | "de");
    speakTTS(content, voiceId, effectiveLang, voiceSettings.speed, messageId);
  }, [canUseVoice, voiceModeEnabled, voiceSettings.autoPlayReplies, voiceSettings.speed, isListening, stopListening, resolveVoiceId, getEffectiveLanguage, language, speakTTS]);

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
    
    // Voice settings
    voiceSettings,
    updateSetting,
    canUseVoice,
    
    // STT state
    sttError,

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

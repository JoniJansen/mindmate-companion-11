import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Phone, FileText, AlertTriangle, Volume2, VolumeX, Wind, Anchor } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useVoiceSettings } from "@/hooks/useVoiceSettings";
import { VoiceAvatar } from "@/components/chat/VoiceAvatar";
import { AudioWaveform } from "@/components/chat/AudioWaveform";
import { VoiceTranscriptConfirm } from "@/components/chat/VoiceTranscriptConfirm";
import { MessagePlayButton } from "@/components/chat/MessagePlayButton";
import { ChatModeSelector, ChatMode, getModeSystemPrompt } from "@/components/chat/ChatModeSelector";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface Preferences {
  language: "en" | "de";
  tone: "gentle" | "neutral" | "structured";
  addressForm: "du" | "sie";
  innerDialogue: boolean;
}

const getPreferences = (): Preferences => {
  try {
    const stored = localStorage.getItem("mindmate-preferences");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { language: "en", tone: "gentle", addressForm: "du", innerDialogue: false };
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function Chat() {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [showTranscriptConfirm, setShowTranscriptConfirm] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState("");
  const [chatMode, setChatMode] = useState<ChatMode>(() => {
    const stored = localStorage.getItem("mindmate-chat-mode");
    return (stored as ChatMode) || "talk";
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const preferences = useRef<Preferences>(getPreferences());

  // Voice settings
  const { 
    settings: voiceSettings, 
    getVoiceId, 
    getEffectiveLanguage 
  } = useVoiceSettings();

  const speechLang = language === "de" ? "de-DE" : "en-US";

  // ElevenLabs TTS
  const { 
    speak: speakTTS, 
    stop: stopTTS, 
    isSpeaking, 
    isLoading: isTTSLoading,
    isPlayingMessage 
  } = useElevenLabsTTS({
    onError: (error) => {
      toast({ 
        title: language === "de" ? "Sprachausgabe fehlgeschlagen" : "Voice playback failed", 
        description: error, 
        variant: "destructive" 
      });
    },
  });

  // Speech recognition (STT)
  const { 
    isListening, 
    fullTranscript, 
    isSupported: isSpeechSupported, 
    startListening, 
    stopListening, 
    resetTranscript,
    error: sttError 
  } = useSpeechRecognition(speechLang, {
    continuous: true,
    onFinalTranscript: (transcript) => {
      if (transcript.trim()) {
        setPendingTranscript(prev => (prev + " " + transcript).trim());
      }
    },
  });

  // Handle STT errors
  useEffect(() => {
    if (sttError === "not-allowed") {
      toast({
        title: t("voice.micPermissionDenied"),
        description: t("voice.enableMic"),
        variant: "destructive",
      });
    }
  }, [sttError, t, toast]);

  // Persist chat mode
  useEffect(() => {
    localStorage.setItem("mindmate-chat-mode", chatMode);
  }, [chatMode]);

  // Auto-restart listening after AI finishes speaking in voice mode
  useEffect(() => {
    if (!isSpeaking && voiceModeEnabled && isSpeechSupported && !isListening && !showTranscriptConfirm) {
      const timeoutId = setTimeout(() => {
        resetTranscript();
        setPendingTranscript("");
        startListening();
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [isSpeaking, voiceModeEnabled, isSpeechSupported, isListening, showTranscriptConfirm, resetTranscript, startListening]);

  // Stop listening when AI speaks
  useEffect(() => {
    if (isSpeaking && isListening) stopListening();
  }, [isSpeaking, isListening, stopListening]);

  // Show transcript confirmation when user stops speaking
  useEffect(() => {
    if (pendingTranscript && !isListening && voiceModeEnabled) {
      const timeoutId = setTimeout(() => {
        if (pendingTranscript.trim()) {
          setShowTranscriptConfirm(true);
          setInputValue(pendingTranscript);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [pendingTranscript, isListening, voiceModeEnabled]);

  // Update input from transcript while listening
  useEffect(() => {
    if (fullTranscript && isListening) {
      setInputValue((pendingTranscript + " " + fullTranscript).trim());
    }
  }, [fullTranscript, isListening, pendingTranscript]);

  // Mode-specific quick replies
  const getQuickReplies = (): string[] => {
    const replies: Record<ChatMode, { en: string[]; de: string[] }> = {
      talk: {
        en: ["I need someone to listen", "Something's been on my mind"],
        de: ["Ich brauche jemanden zum Zuhören", "Mich beschäftigt etwas"],
      },
      clarify: {
        en: ["Help me organize my thoughts", "I'm feeling confused about something"],
        de: ["Hilf mir meine Gedanken zu ordnen", "Ich bin verwirrt über etwas"],
      },
      calm: {
        en: ["I'm feeling anxious", "Help me relax"],
        de: ["Ich fühle mich ängstlich", "Hilf mir zu entspannen"],
      },
      patterns: {
        en: ["What patterns do you see in me?", "Help me understand myself better"],
        de: ["Welche Muster siehst du bei mir?", "Hilf mir mich besser zu verstehen"],
      },
    };
    return replies[chatMode][language as "en" | "de"] || replies[chatMode].en;
  };

  // Calm mode quick exercises - IDs must match exercise data
  const calmExercises = [
    { id: "breathing-60", label: language === "de" ? "60s Atmung" : "60s Breathing", icon: Wind },
    { id: "grounding-54321", label: language === "de" ? "5-4-3-2-1 Erdung" : "5-4-3-2-1 Grounding", icon: Anchor },
  ];

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Initial greeting or message from navigation
  useEffect(() => {
    const initialMessage = localStorage.getItem('mindmate-initial-message') || location.state?.initialMessage;
    
    const init = async () => {
      if (initialMessage) {
        localStorage.removeItem('mindmate-initial-message');
        handleSend(initialMessage);
      } else {
        setIsLoading(true);
        const greetingPrompt = language === "de"
          ? "Der Nutzer hat den Chat geöffnet. Begrüße ihn kurz und warm in 1-2 Sätzen."
          : "The user opened the chat. Greet them briefly and warmly in 1-2 sentences.";
        await streamChat({
          messages: [{ role: "user", content: greetingPrompt }],
          onDelta: (chunk) => upsertAssistant(chunk),
          onDone: (fullResponse) => {
            setIsLoading(false);
            // Auto-play greeting if enabled
            if (voiceSettings.autoPlayReplies && fullResponse) {
              const voiceId = getVoiceId(language as "en" | "de");
              const effectiveLang = getEffectiveLanguage(language as "en" | "de");
              speakTTS(fullResponse, voiceId, effectiveLang, voiceSettings.speed, "greeting");
            }
          },
          onError: handleError,
        });
      }
    };
    init();
  }, []);

  const handleError = (error: string) => {
    toast({ title: t("chat.connectionIssue"), description: error, variant: "destructive" });
    setIsLoading(false);
  };

  const upsertAssistant = useCallback((nextChunk: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") {
        return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: m.content + nextChunk } : m);
      }
      return [...prev, { id: Date.now().toString(), content: nextChunk, role: "assistant", timestamp: new Date() }];
    });
  }, []);

  const streamChat = async ({ messages, onDelta, onDone, onError }: {
    messages: { role: "user" | "assistant"; content: string }[];
    onDelta: (chunk: string) => void;
    onDone: (fullResponse: string) => void;
    onError: (error: string) => void;
  }) => {
    try {
      const modePrompt = getModeSystemPrompt(chatMode, language as "en" | "de");
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages,
          preferences: { ...preferences.current, modePrompt },
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        onError(errorData.error || "Connection failed.");
        return;
      }

      if (!resp.body) { onError("No response."); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onDelta(content);
              fullResponse += content;
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      onDone(fullResponse);
    } catch (error) {
      console.error("Stream error:", error);
      onError("Something went wrong.");
    }
  };

  const handleSend = useCallback(async (content: string, isSystemAction = false) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), content: content.trim(), role: "user", timestamp: new Date() };
    if (!isSystemAction) setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setPendingTranscript("");
    setShowTranscriptConfirm(false);
    setShowActions(false);
    setIsLoading(true);

    const chatMessages = [...messages, ...(isSystemAction ? [] : [userMessage])].map((m) => ({ role: m.role, content: m.content }));
    const messagesForAI = isSystemAction ? [...chatMessages, { role: "user" as const, content }] : chatMessages;

    const newMessageId = (Date.now() + 1).toString();
    
    await streamChat({
      messages: messagesForAI,
      onDelta: (chunk) => { upsertAssistant(chunk); },
      onDone: (fullResponse) => {
        setIsLoading(false);
        // Auto-play or play in voice mode
        if ((voiceModeEnabled || voiceSettings.autoPlayReplies) && fullResponse) {
          const voiceId = getVoiceId(language as "en" | "de");
          const effectiveLang = getEffectiveLanguage(language as "en" | "de");
          speakTTS(fullResponse, voiceId, effectiveLang, voiceSettings.speed, newMessageId);
        }
      },
      onError: handleError,
    });
  }, [isLoading, messages, voiceModeEnabled, voiceSettings, getVoiceId, getEffectiveLanguage, language, speakTTS, upsertAssistant]);

  // Handle voice transcript confirmation
  const handleTranscriptSend = () => {
    if (inputValue.trim()) {
      handleSend(inputValue.trim());
    }
  };

  const handleTranscriptEdit = () => {
    setShowTranscriptConfirm(false);
    // Keep input value for editing
  };

  const handleTranscriptCancel = () => {
    setShowTranscriptConfirm(false);
    setInputValue("");
    setPendingTranscript("");
    resetTranscript();
  };

  // Play message audio
  const playMessage = (message: Message) => {
    const voiceId = getVoiceId(language as "en" | "de");
    const effectiveLang = getEffectiveLanguage(language as "en" | "de");
    speakTTS(message.content, voiceId, effectiveLang, voiceSettings.speed, message.id);
  };

  // Toggle voice mode
  const toggleVoiceMode = () => {
    if (isSpeaking) stopTTS();
    if (isListening) stopListening();
    setVoiceModeEnabled(!voiceModeEnabled);
    setShowTranscriptConfirm(false);
    setPendingTranscript("");
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setPendingTranscript("");
      setInputValue("");
      setShowTranscriptConfirm(false);
      startListening();
    }
  };

  // Voice-send event listener
  useEffect(() => {
    const handler = (e: CustomEvent) => { if (e.detail) handleSend(e.detail); };
    window.addEventListener('voice-send', handler as EventListener);
    return () => window.removeEventListener('voice-send', handler as EventListener);
  }, [handleSend]);

  const handleSummary = () => {
    localStorage.setItem("mindmate-chat-messages", JSON.stringify(messages.map(m => ({ role: m.role, content: m.content }))));
    navigate("/summary", { state: { messages: messages.map(m => ({ role: m.role, content: m.content })) } });
  };

  const handleCalmExercise = (exerciseId: string) => {
    navigate("/toolbox", { state: { startExercise: exerciseId } });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <PageHeader
        title={t("chat.title")}
        subtitle={t("chat.subtitle")}
        rightElement={
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleVoiceMode} 
              className={voiceModeEnabled ? "text-primary" : "text-muted-foreground"}
            >
              {voiceModeEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/safety")} className="text-destructive">
              <Phone className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      {/* Mode Selector */}
      <div className="px-4 py-2 border-b border-border/30">
        <ChatModeSelector activeMode={chatMode} onModeChange={setChatMode} />
      </div>

      {/* Voice Avatar */}
      <AnimatePresence>
        {voiceModeEnabled && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }} 
            exit={{ opacity: 0, height: 0 }} 
            className="border-b border-border/30 overflow-hidden"
          >
            <div className="flex flex-col items-center py-6 gap-4">
              <VoiceAvatar isSpeaking={isSpeaking} size="lg" />
              {isListening && (
                <AudioWaveform isListening={isListening} size="sm" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div 
                key={message.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`relative max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-br-md" 
                    : "bg-card border border-border/50 text-foreground rounded-bl-md shadow-soft"
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Play button for assistant messages */}
                  {message.role === "assistant" && (
                    <MessagePlayButton
                      isPlaying={isPlayingMessage(message.id)}
                      isLoading={isTTSLoading && !isSpeaking}
                      onPlay={() => playMessage(message)}
                      onStop={stopTTS}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-bl-md shadow-soft flex gap-1">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div key={i} className="w-2 h-2 bg-muted-foreground rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay }} />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Calm Mode Quick Exercises */}
      {chatMode === "calm" && messages.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-2">
          <div className="max-w-lg mx-auto flex gap-2">
            {calmExercises.map((ex) => (
              <Button key={ex.id} variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleCalmExercise(ex.id)}>
                <ex.icon className="w-4 h-4" />
                {ex.label}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Replies */}
      {messages.length <= 2 && !isLoading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-2">
          <div className="max-w-lg mx-auto flex flex-wrap gap-2">
            {getQuickReplies().map((reply) => (
              <Button key={reply} variant="outline" size="sm" onClick={() => handleSend(reply)} className="text-xs">
                {reply}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      {messages.length > 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-2">
          <div className="max-w-lg mx-auto flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleSummary}>
              <FileText className="w-4 h-4" />
              {language === "de" ? "Zusammenfassung" : "Summary"}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => navigate("/safety")}>
              <AlertTriangle className="w-4 h-4" />
              {language === "de" ? "Krisenhilfe" : "Crisis Help"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Voice Transcript Confirmation */}
      <AnimatePresence>
        {showTranscriptConfirm && pendingTranscript && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }}
            className="px-4 pb-2"
          >
            <div className="max-w-lg mx-auto">
              <VoiceTranscriptConfirm
                transcript={inputValue}
                onSend={handleTranscriptSend}
                onEdit={handleTranscriptEdit}
                onCancel={handleTranscriptCancel}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-lg mx-auto flex items-end gap-2">
          {isSpeechSupported && (
            <Button 
              variant={isListening ? "destructive" : "outline"} 
              size="icon" 
              className="shrink-0 rounded-full relative" 
              onClick={toggleRecording}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isListening && (
                <motion.span 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </Button>
          )}
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === "Enter" && !e.shiftKey) { 
                  e.preventDefault(); 
                  handleSend(inputValue); 
                } 
              }}
              placeholder={isListening ? t("voice.listening") : (language === "de" ? "Schreib etwas..." : "Type something...")}
              className="w-full bg-background border border-border/50 rounded-2xl px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 max-h-32"
              rows={1}
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              className="absolute right-1 bottom-1 rounded-full w-9 h-9" 
              onClick={() => handleSend(inputValue)} 
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

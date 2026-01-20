import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Phone, Sparkles, FileText, ListChecks, BookOpen, Dumbbell, AlertTriangle, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { VoiceAvatar } from "@/components/chat/VoiceAvatar";
import { AudioWaveform } from "@/components/chat/AudioWaveform";

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
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { language: "en", tone: "gentle", addressForm: "du", innerDialogue: false };
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const preferences = useRef<Preferences>(getPreferences());
  
  // Speech recognition and synthesis setup
  const speechLang = language === "de" ? "de-DE" : "en-US";
  const [pendingSend, setPendingSend] = useState<string | null>(null);
  
  // Speech synthesis for voice mode - defined first since speech recognition uses isSpeaking
  const { 
    speak, 
    stop: stopSpeaking, 
    isSpeaking, 
    isSupported: isTTSSupported 
  } = useSpeechSynthesis({
    lang: speechLang,
    voiceType: "female",
    rate: 0.92,
    pitch: 1.05,
  });

  // Speech recognition with continuous mode
  const { 
    isListening, 
    fullTranscript, 
    isSupported: isSpeechSupported, 
    startListening,
    stopListening,
    toggleListening,
    resetTranscript 
  } = useSpeechRecognition(speechLang, { 
    continuous: true,
    onFinalTranscript: (transcript) => {
      // Queue the transcript to be sent after a delay
      setPendingSend(transcript);
    }
  });

  // After AI finishes speaking, restart listening in voice mode
  useEffect(() => {
    if (!isSpeaking && voiceModeEnabled && isSpeechSupported && !isListening) {
      const timeoutId = setTimeout(() => {
        resetTranscript();
        startListening();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isSpeaking, voiceModeEnabled, isSpeechSupported, isListening, resetTranscript, startListening]);

  // Handle pending send with delay (allows user to continue speaking)
  const pendingSendRef = useRef<string | null>(null);
  pendingSendRef.current = pendingSend;
  
  useEffect(() => {
    if (pendingSend && !isLoading && !isSpeaking) {
      const timeoutId = setTimeout(() => {
        const currentInput = inputValue.trim();
        if (currentInput) {
          // Trigger send via form submission pattern
          const sendEvent = new CustomEvent('voice-send', { detail: currentInput });
          window.dispatchEvent(sendEvent);
          setInputValue("");
          resetTranscript();
        }
        setPendingSend(null);
      }, 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [pendingSend, isLoading, isSpeaking, inputValue, resetTranscript]);

  // Stop listening when AI starts speaking
  useEffect(() => {
    if (isSpeaking && isListening) {
      stopListening();
    }
  }, [isSpeaking, isListening, stopListening]);

  // Update input when speech transcript changes
  useEffect(() => {
    if (fullTranscript) {
      setInputValue(fullTranscript);
    }
  }, [fullTranscript]);

  // Simplified - only 2 quick replies, less overwhelming
  const quickReplies = [
    t("chat.quickReply3"), // "I need someone to talk to"
    t("chat.quickReply4"), // "Help me relax"
  ];

  // Reduced action buttons - only essential ones
  const actionButtons = [
    { id: "endsession", label: t("chat.endSummarize"), icon: FileText, action: "summary" as const },
    { id: "crisis", label: t("chat.crisisHelp"), icon: AlertTriangle, action: "safety" as const },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for initial message from Home screen or send greeting
  useEffect(() => {
    const initialMessage = localStorage.getItem('mindmate-initial-message');
    
    const sendInitialMessage = async () => {
      if (initialMessage) {
        localStorage.removeItem('mindmate-initial-message');
        // User came with a thought from Home - process it
        handleSend(initialMessage);
      } else {
        // No initial message - send simple greeting
        setIsLoading(true);
        const greetingPrompt = language === "de" 
          ? "Der Nutzer hat gerade den Chat geöffnet. Begrüße ihn kurz und warm in 1-2 Sätzen. Frage sanft, wie es ihm geht."
          : "The user just opened the chat. Greet them briefly and warmly in 1-2 sentences. Gently ask how they're doing.";
        
        await streamChat({
          messages: [{ role: "user" as const, content: greetingPrompt }],
          onDelta: (chunk) => upsertAssistant(chunk),
          onDone: () => setIsLoading(false),
          onError: handleError,
        });
      }
    };
    sendInitialMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleError = (error: string) => {
    toast({
      title: t("chat.connectionIssue"),
      description: error,
      variant: "destructive",
    });
    setIsLoading(false);
  };

  const upsertAssistant = useCallback((nextChunk: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") {
        return prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, content: m.content + nextChunk }
            : m
        );
      }
      return [
        ...prev,
        {
          id: Date.now().toString(),
          content: nextChunk,
          role: "assistant",
          timestamp: new Date(),
        },
      ];
    });
  }, []);

  const streamChat = async ({
    messages,
    onDelta,
    onDone,
    onError,
  }: {
    messages: { role: "user" | "assistant"; content: string }[];
    onDelta: (chunk: string) => void;
    onDone: () => void;
    onError: (error: string) => void;
  }) => {
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages,
          preferences: preferences.current,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        onError(errorData.error || "Failed to connect. Please try again.");
        return;
      }

      if (!resp.body) {
        onError("No response received.");
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch {
            /* ignore */
          }
        }
      }

      onDone();
    } catch (error) {
      console.error("Stream error:", error);
      onError("Something went wrong. Please try again.");
    }
  };

  const handleSend = useCallback(async (content: string, isSystemAction = false) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      role: "user",
      timestamp: new Date(),
    };

    // For system actions, we don't show the prompt in the UI
    if (!isSystemAction) {
      setMessages((prev) => [...prev, userMessage]);
    }
    setInputValue("");
    setShowActions(false);
    setIsLoading(true);

    const chatMessages = [...messages, ...(isSystemAction ? [] : [userMessage])].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add the action prompt to the messages sent to AI
    const messagesForAI = isSystemAction 
      ? [...chatMessages, { role: "user" as const, content: content.trim() }]
      : chatMessages;

    let fullResponse = "";
    await streamChat({
      messages: messagesForAI,
      onDelta: (chunk) => {
        upsertAssistant(chunk);
        fullResponse += chunk;
      },
      onDone: () => {
        setIsLoading(false);
        // If voice mode is enabled, speak the response
        if (voiceModeEnabled && fullResponse) {
          speak(fullResponse);
        }
      },
      onError: handleError,
    });
  }, [isLoading, messages, voiceModeEnabled, speak, upsertAssistant, handleError]);

  // Listen for voice-send events
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail) {
        handleSend(e.detail);
      }
    };
    window.addEventListener('voice-send', handler as EventListener);
    return () => window.removeEventListener('voice-send', handler as EventListener);
  }, [handleSend]);

  const handleActionButton = (action: { id: string; label: string; icon: React.ComponentType; action?: string; prompt?: string }) => {
    if (action.action) {
      if (action.action === "summary") {
        // Save messages and navigate to summary
        localStorage.setItem("mindmate-chat-messages", JSON.stringify(
          messages.map(m => ({ role: m.role, content: m.content }))
        ));
        navigate("/summary", { state: { messages: messages.map(m => ({ role: m.role, content: m.content })) } });
      } else {
        navigate(`/${action.action}`);
      }
    } else if (action.prompt) {
      handleSend(action.prompt, true);
    }
    setShowActions(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <PageHeader
        title={t("chat.title")}
        subtitle={t("chat.subtitle")}
        rightElement={
          <div className="flex items-center gap-1">
            {/* Voice Mode Toggle */}
            {isTTSSupported && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  }
                  setVoiceModeEnabled(!voiceModeEnabled);
                  toast({
                    title: voiceModeEnabled 
                      ? (language === "de" ? "Sprachmodus deaktiviert" : "Voice mode disabled")
                      : (language === "de" ? "Sprachmodus aktiviert" : "Voice mode enabled"),
                    description: voiceModeEnabled
                      ? (language === "de" ? "Antworten werden nur als Text angezeigt" : "Responses will be text only")
                      : (language === "de" ? "Antworten werden vorgelesen" : "Responses will be spoken"),
                  });
                }}
                className={voiceModeEnabled ? "text-primary" : "text-muted-foreground"}
              >
                {voiceModeEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/safety")}
              className="text-destructive"
            >
              <Phone className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      {/* Voice Avatar - shown when voice mode is enabled */}
      <AnimatePresence>
        {voiceModeEnabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex justify-center py-6 border-b border-border/30"
          >
            <VoiceAvatar isSpeaking={isSpeaking} size="lg" />
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
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border/50 text-foreground rounded-bl-md shadow-soft"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-bl-md shadow-soft">
                <div className="flex gap-1">
                  <motion.div
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Action buttons */}
      <AnimatePresence>
        {showActions && messages.length > 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 pb-2"
          >
            <div className="max-w-lg mx-auto flex flex-wrap gap-2">
              {actionButtons.map((action) => {
                const Icon = action.icon;
                const isDestructive = action.id === "crisis";
                return (
                  <Button
                    key={action.id}
                    variant={isDestructive ? "destructive" : "gentle"}
                    size="sm"
                    onClick={() => handleActionButton(action)}
                    disabled={isLoading}
                    className="text-xs gap-1.5"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick replies */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-4 pb-2">
          <div className="max-w-lg mx-auto flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <Button
                key={reply}
                variant="gentle"
                size="sm"
                onClick={() => handleSend(reply)}
                className="text-xs"
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Audio Waveform Indicator - shows when listening */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 pb-3"
          >
            <div className="max-w-lg mx-auto flex justify-center">
              <div className="bg-card/90 backdrop-blur border border-primary/20 rounded-2xl px-5 py-3 shadow-lg">
                <AudioWaveform isListening={isListening} barCount={7} size="md" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="border-t border-border/50 bg-card/80 backdrop-blur-lg p-4 mb-20">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={`shrink-0 transition-colors ${showActions ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => setShowActions(!showActions)}
            disabled={messages.length <= 2}
          >
            <Sparkles className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(inputValue)}
              placeholder={t("chat.inputPlaceholder")}
              disabled={isLoading}
              className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 disabled:opacity-50"
            />
          </div>

          {isSpeechSupported ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className={`shrink-0 transition-colors ${isListening ? "text-destructive bg-destructive/10" : "text-muted-foreground"}`}
              onClick={() => {
                toggleListening();
                if (!isListening) {
                  toast({
                    title: language === "de" ? "Sprachaufnahme aktiv" : "Voice recording active",
                    description: language === "de" ? "Sprich jetzt..." : "Speak now...",
                  });
                }
              }}
              disabled={isLoading}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 text-muted-foreground/50 cursor-not-allowed"
              onClick={() => {
                toast({
                  title: language === "de" ? "Nicht unterstützt" : "Not supported",
                  description: language === "de" 
                    ? "Spracherkennung wird von diesem Browser nicht unterstützt." 
                    : "Speech recognition is not supported in this browser.",
                  variant: "destructive",
                });
              }}
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}

          <Button
            size="icon"
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

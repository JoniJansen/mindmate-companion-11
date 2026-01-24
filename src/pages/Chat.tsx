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
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { VoiceAvatar } from "@/components/chat/VoiceAvatar";
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
  const [chatMode, setChatMode] = useState<ChatMode>(() => {
    const stored = localStorage.getItem("mindmate-chat-mode");
    return (stored as ChatMode) || "talk";
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const preferences = useRef<Preferences>(getPreferences());

  const speechLang = language === "de" ? "de-DE" : "en-US";
  const [pendingSend, setPendingSend] = useState<string | null>(null);

  const { speak, stop: stopSpeaking, isSpeaking, isSupported: isTTSSupported } = useSpeechSynthesis({
    lang: speechLang,
    voiceType: "female",
    rate: 0.92,
    pitch: 1.05,
  });

  const { isListening, fullTranscript, isSupported: isSpeechSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition(speechLang, {
    continuous: true,
    onFinalTranscript: (transcript) => setPendingSend(transcript),
  });

  // Persist chat mode
  useEffect(() => {
    localStorage.setItem("mindmate-chat-mode", chatMode);
  }, [chatMode]);

  // Auto-restart listening after AI finishes speaking in voice mode
  useEffect(() => {
    if (!isSpeaking && voiceModeEnabled && isSpeechSupported && !isListening) {
      const timeoutId = setTimeout(() => {
        resetTranscript();
        startListening();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isSpeaking, voiceModeEnabled, isSpeechSupported, isListening, resetTranscript, startListening]);

  // Handle pending send with delay
  useEffect(() => {
    if (pendingSend && !isLoading && !isSpeaking) {
      const timeoutId = setTimeout(() => {
        if (inputValue.trim()) {
          handleSend(inputValue.trim());
          setInputValue("");
          resetTranscript();
        }
        setPendingSend(null);
      }, 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [pendingSend, isLoading, isSpeaking, inputValue, resetTranscript]);

  // Stop listening when AI speaks
  useEffect(() => {
    if (isSpeaking && isListening) stopListening();
  }, [isSpeaking, isListening, stopListening]);

  // Update input from transcript
  useEffect(() => {
    if (fullTranscript) setInputValue(fullTranscript);
  }, [fullTranscript]);

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

  // Calm mode quick exercises
  const calmExercises = [
    { id: "breathing", label: language === "de" ? "60s Atmung" : "60s Breathing", icon: Wind },
    { id: "grounding", label: language === "de" ? "5-4-3-2-1 Erdung" : "5-4-3-2-1 Grounding", icon: Anchor },
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
          onDone: () => setIsLoading(false),
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
    onDone: () => void;
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
            if (content) onDelta(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      onDone();
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
    setShowActions(false);
    setIsLoading(true);

    const chatMessages = [...messages, ...(isSystemAction ? [] : [userMessage])].map((m) => ({ role: m.role, content: m.content }));
    const messagesForAI = isSystemAction ? [...chatMessages, { role: "user" as const, content }] : chatMessages;

    let fullResponse = "";
    await streamChat({
      messages: messagesForAI,
      onDelta: (chunk) => { upsertAssistant(chunk); fullResponse += chunk; },
      onDone: () => {
        setIsLoading(false);
        if (voiceModeEnabled && fullResponse) speak(fullResponse);
      },
      onError: handleError,
    });
  }, [isLoading, messages, voiceModeEnabled, speak, upsertAssistant]);

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
            {isTTSSupported && (
              <Button variant="ghost" size="icon" onClick={() => { if (isSpeaking) stopSpeaking(); setVoiceModeEnabled(!voiceModeEnabled); }} className={voiceModeEnabled ? "text-primary" : "text-muted-foreground"}>
                {voiceModeEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
            )}
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
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex justify-center py-6 border-b border-border/30">
            <VoiceAvatar isSpeaking={isSpeaking} size="lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${message.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border/50 text-foreground rounded-bl-md shadow-soft"}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
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

      {/* Input Area */}
      <div className="p-4 border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-lg mx-auto flex items-end gap-2">
          {isSpeechSupported && (
            <Button variant={isListening ? "destructive" : "outline"} size="icon" className="shrink-0 rounded-full" onClick={() => isListening ? (stopListening(), resetTranscript()) : (resetTranscript(), startListening())}>
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          )}
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(inputValue); } }}
              placeholder={language === "de" ? "Schreib etwas..." : "Type something..."}
              className="w-full bg-background border border-border/50 rounded-2xl px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 max-h-32"
              rows={1}
              disabled={isLoading}
            />
            <Button size="icon" className="absolute right-1 bottom-1 rounded-full w-9 h-9" onClick={() => handleSend(inputValue)} disabled={!inputValue.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

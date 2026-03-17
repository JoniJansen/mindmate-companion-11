import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CompanionAvatarAnimated } from "@/components/companion/CompanionAvatarAnimated";
import { analytics } from "@/hooks/useAnalytics";

interface DemoChatProps {
  language: "en" | "de";
}

interface DemoMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const DEMO_LIMIT = 3;

const DEMO_GREETING = {
  en: "Hello. I'm Mira — a space for your thoughts.\n\nWhat's on your mind right now?",
  de: "Hallo. Ich bin Mira — ein Raum für deine Gedanken.\n\nWas beschäftigt dich gerade?",
};

const SIGNUP_CTA = {
  en: {
    title: "Want to keep talking?",
    subtitle: "Create your free account and continue with your personal companion.",
    cta: "Continue — it's free",
  },
  de: {
    title: "Möchtest du weiterschreiben?",
    subtitle: "Erstelle dein kostenloses Konto und sprich weiter mit deinem Begleiter.",
    cta: "Weiter — kostenlos",
  },
};

export function DemoChat({ language }: DemoChatProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<DemoMessage[]>([
    { id: "greeting", role: "assistant", content: DEMO_GREETING[language] },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [showLimit, setShowLimit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const demoStartedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    // Track demo started on first message
    if (!demoStartedRef.current) {
      demoStartedRef.current = true;
      analytics.track("demo_chat_started", { language }, "demo_chat_started");
    }

    if (userMessageCount >= DEMO_LIMIT) {
      setShowLimit(true);
      return;
    }

    const userMsg: DemoMessage = { id: `user-${Date.now()}`, role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setUserMessageCount(prev => prev + 1);
    const newCount = userMessageCount + 1;

    // Track each message
    analytics.track("demo_chat_message_sent", { message_number: newCount, language });

    setIsStreaming(true);
    const assistantId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      abortRef.current = new AbortController();
      const history = messages.filter(m => m.id !== "greeting").map(m => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: "user", content: text });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: history,
            preferences: {
              language,
              tone: "gentle",
              addressForm: "du",
              innerDialogue: false,
              companionName: "Mira",
              companionPersonality: "warm and empathetic",
              companionTone: "gentle",
              companionBondLevel: 0,
            },
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!response.ok) throw new Error("Chat failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setMessages(prev =>
                    prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m)
                  );
                }
              } catch {
                fullContent += data;
                setMessages(prev =>
                  prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m)
                );
              }
            }
          }
        }
      }

      if (!fullContent) {
        const data = await response.clone().json().catch(() => null);
        if (data?.content) {
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, content: data.content } : m)
          );
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        const fallback = language === "de"
          ? "Ich bin gerade nicht erreichbar. Erstelle ein Konto, um jederzeit mit mir zu sprechen."
          : "I'm not available right now. Create an account to talk with me anytime.";
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: fallback } : m)
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      if (newCount >= DEMO_LIMIT) {
        analytics.track("demo_chat_limit_reached", { language }, "demo_limit");
        setTimeout(() => setShowLimit(true), 1500);
      }
    }
  }, [input, isStreaming, userMessageCount, messages, language]);

  const handleSignupClick = useCallback(() => {
    analytics.track("demo_chat_converted", { messages_sent: userMessageCount, language });
    navigate("/welcome");
  }, [navigate, userMessageCount, language]);

  const cta = SIGNUP_CTA[language];

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-card rounded-3xl border border-border/50 shadow-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/30 bg-background/50">
          <CompanionAvatarAnimated
            archetype="mira"
            name="Mira"
            size="sm"
            state={isStreaming ? "speaking" : "idle"}
          />
          <div>
            <p className="text-sm font-semibold text-foreground">Mira</p>
            <p className="text-[11px] text-muted-foreground">
              {language === "de" ? "Dein Begleiter" : "Your companion"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="px-4 py-4 space-y-3 max-h-[320px] overflow-y-auto" style={{ minHeight: 180 }}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14.5px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-lg"
                  : "bg-muted/50 border border-border/30 text-foreground rounded-bl-lg"
              }`}>
                {msg.content.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.content.split("\n").length - 1 && <br />}
                  </span>
                ))}
                {isStreaming && msg.role === "assistant" && msg === messages[messages.length - 1] && (
                  <span className="inline-block w-[3px] h-[16px] bg-primary/60 rounded-full align-text-bottom ml-0.5" style={{ animation: "cursor-blink 0.8s ease-in-out infinite" }} />
                )}
              </div>
            </motion.div>
          ))}

          {/* Thinking indicator */}
          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex justify-start">
              <div className="bg-muted/50 border border-border/30 px-4 py-3 rounded-2xl rounded-bl-lg">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-muted-foreground/70 italic">
                    Mira {language === "de" ? "reflektiert" : "is reflecting"}...
                  </span>
                  <span className="inline-flex gap-0.5">
                    <span className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
                    <span className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: "400ms" }} />
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Limit reached CTA */}
        <AnimatePresence>
          {showLimit && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-5 py-5 border-t border-border/30 bg-primary/5"
            >
              <p className="text-sm font-semibold text-foreground mb-1">{cta.title}</p>
              <p className="text-xs text-muted-foreground mb-4">{cta.subtitle}</p>
              <Button onClick={handleSignupClick} className="w-full gap-2">
                {cta.cta}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        {!showLimit && (
          <div className="px-4 py-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={language === "de" ? "Schreib etwas..." : "Type something..."}
                className="flex-1 h-10 bg-muted/30 border border-border/40 rounded-full px-4 text-[14px] focus:outline-none focus:border-primary/40 transition-colors"
                disabled={isStreaming}
              />
              <Button
                size="icon"
                className="rounded-full h-9 w-9 shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
              {language === "de"
                ? `${DEMO_LIMIT - userMessageCount} ${DEMO_LIMIT - userMessageCount === 1 ? "Nachricht" : "Nachrichten"} verbleibend`
                : `${DEMO_LIMIT - userMessageCount} ${DEMO_LIMIT - userMessageCount === 1 ? "message" : "messages"} remaining`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

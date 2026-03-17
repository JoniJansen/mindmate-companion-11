import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowRight, Mail, Lock, User, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { CompanionAvatarAnimated } from "@/components/companion/CompanionAvatarAnimated";
import { analytics } from "@/hooks/useAnalytics";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  en: "Hey… it's nice that you're here.\n\nWhat's on your mind right now?",
  de: "Hey… schön, dass du hier bist.\n\nWas beschäftigt dich gerade?",
};

const INPUT_PLACEHOLDER = {
  en: "What's really on your mind?",
  de: "Was geht dir nicht aus dem Kopf?",
};

const CONTINUATION_MSG = {
  en: "I'm here for you.\n\nIf you'd like, you can simply keep talking.",
  de: "Ich bin hier für dich.\n\nWenn du möchtest, kannst du einfach weiterschreiben.",
};

const TEXTS = {
  en: {
    cta: "Continue talking",
    orLogin: "Already have an account?",
    loginLink: "Sign in",
    namePlaceholder: "Your name (optional)",
    emailPlaceholder: "Your email",
    passwordPlaceholder: "Choose a password",
    signup: "Continue talking",
    secure: "Private & encrypted",
    error: "Something went wrong",
  },
  de: {
    cta: "Gespräch fortsetzen",
    orLogin: "Schon ein Konto?",
    loginLink: "Anmelden",
    namePlaceholder: "Dein Name (optional)",
    emailPlaceholder: "Deine E-Mail",
    passwordPlaceholder: "Wähle ein Passwort",
    signup: "Gespräch fortsetzen",
    secure: "Privat & verschlüsselt",
    error: "Etwas ist schiefgelaufen",
  },
};

export function DemoChat({ language }: DemoChatProps) {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [showLimit, setShowLimit] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const demoStartedRef = useRef(false);
  const greetingShownRef = useRef(false);

  // Inline signup state
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showLoginMode, setShowLoginMode] = useState(false);

  const t = TEXTS[language];

  // Auto-show greeting with typing effect
  useEffect(() => {
    if (greetingShownRef.current) return;
    greetingShownRef.current = true;

    const greeting = DEMO_GREETING[language];
    const id = "greeting";
    setMessages([{ id, role: "assistant", content: "" }]);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setMessages([{ id, role: "assistant", content: greeting.slice(0, i) }]);
      if (i >= greeting.length) clearInterval(interval);
    }, 25);

    return () => clearInterval(interval);
  }, [language]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Show continuation message + signup form after limit
  useEffect(() => {
    if (!showLimit) return;

    const contMsg = CONTINUATION_MSG[language];
    const id = "continuation";

    // Check if already added
    setMessages(prev => {
      if (prev.find(m => m.id === id)) return prev;
      return [...prev, { id, role: "assistant", content: contMsg }];
    });

    // Delay showing the form slightly for emotional pacing
    const timer = setTimeout(() => setShowSignupForm(true), 800);
    return () => clearTimeout(timer);
  }, [showLimit, language]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

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

    analytics.track("demo_chat_message_sent", { message_number: newCount, language });

    setIsStreaming(true);
    const assistantId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      abortRef.current = new AbortController();
      const history = messages.filter(m => m.id !== "greeting" && m.id !== "continuation").map(m => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: "user", content: text });

      // For the last message, instruct the AI to end with an open question
      const isLastMessage = newCount >= DEMO_LIMIT;
      const extraInstruction = isLastMessage
        ? (language === "de"
          ? "\n\n[Wichtig: Dies ist die letzte Nachricht in diesem Demo-Gespräch. Beende deine Antwort mit einer warmherzigen, offenen Frage, die Lust macht weiterzureden. Mache das subtil – kein Hinweis auf die Demo.]"
          : "\n\n[Important: This is the last message in this demo conversation. End your response with a warm, open question that creates desire to continue talking. Be subtle – no mention of the demo.]")
        : "";

      const messagesForApi = [...history];
      if (isLastMessage && messagesForApi.length > 0) {
        const lastMsg = messagesForApi[messagesForApi.length - 1];
        messagesForApi[messagesForApi.length - 1] = {
          ...lastMsg,
          content: lastMsg.content + extraInstruction,
        };
      }

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
            messages: messagesForApi,
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

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail.trim() || !signupPassword.trim()) return;

    setIsSigningUp(true);
    try {
      if (showLoginMode) {
        await signIn(signupEmail.trim().toLowerCase(), signupPassword);
        analytics.track("demo_chat_converted", { messages_sent: userMessageCount, language, method: "login" });
      } else {
        const result = await signUp(signupEmail.trim().toLowerCase(), signupPassword, signupName.trim() || undefined);
        analytics.track("demo_chat_converted", { messages_sent: userMessageCount, language, method: "signup" });
        if (result?.session) {
          navigate("/home", { replace: true });
          return;
        }
      }
      navigate("/home", { replace: true });
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSigningUp(false);
    }
  }, [signupEmail, signupPassword, signupName, showLoginMode, signIn, signUp, navigate, userMessageCount, language, toast, t.error]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className={`bg-card rounded-3xl border shadow-card overflow-hidden transition-all duration-300 ${
        inputFocused ? "border-primary/40 shadow-lg shadow-primary/10" : "border-border/50"
      }`}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border/30 bg-background/50">
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
        <div className="px-4 py-4 space-y-3 max-h-[340px] overflow-y-auto" style={{ minHeight: 140 }}>
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
                {isStreaming && msg.role === "assistant" && msg === messages[messages.length - 1] && msg.content !== "" && (
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

        {/* Inline Signup Form — replaces input after limit */}
        <AnimatePresence>
          {showSignupForm && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 py-4 border-t border-border/30 bg-gradient-to-b from-primary/[0.03] to-transparent"
            >
              <form onSubmit={handleSignup} className="space-y-2.5">
                {!showLoginMode && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder={t.namePlaceholder}
                      className="w-full h-11 bg-muted/30 border border-border/40 rounded-xl pl-10 pr-4 text-[14px] focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required
                    className="w-full h-11 bg-muted/30 border border-border/40 rounded-xl pl-10 pr-4 text-[14px] focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    required
                    minLength={6}
                    className="w-full h-11 bg-muted/30 border border-border/40 rounded-xl pl-10 pr-4 text-[14px] focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                  />
                </div>

                <Button type="submit" className="w-full h-11 gap-2 text-[14px]" disabled={isSigningUp}>
                  {isSigningUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t.signup}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground/50">
                    <Shield className="w-3 h-3" />
                    <span className="text-[10px]">{t.secure}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLoginMode(!showLoginMode)}
                    className="text-[11px] text-primary hover:underline"
                  >
                    {showLoginMode ? (language === "de" ? "Neu hier? Registrieren" : "New here? Sign up") : `${t.orLogin} ${t.loginLink}`}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input — only when not at limit */}
        {!showLimit && (
          <div className="px-4 py-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={INPUT_PLACEHOLDER[language]}
                className="flex-1 h-12 bg-muted/30 border border-border/40 rounded-full px-5 text-[15px] focus:outline-none focus:border-primary/50 focus:bg-muted/50 transition-all placeholder:text-muted-foreground/50"
                disabled={isStreaming}
              />
              <Button
                size="icon"
                className="rounded-full h-10 w-10 shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
              {language === "de"
                ? `${DEMO_LIMIT - userMessageCount} ${DEMO_LIMIT - userMessageCount === 1 ? "Nachricht" : "Nachrichten"} verbleibend · Ohne Anmeldung`
                : `${DEMO_LIMIT - userMessageCount} ${DEMO_LIMIT - userMessageCount === 1 ? "message" : "messages"} remaining · No signup needed`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

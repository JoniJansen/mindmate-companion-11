import { useState, useCallback, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowRight, Mail, Lock, User, Loader2, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CompanionAvatarAnimated } from "@/components/companion/CompanionAvatarAnimated";
import { analytics } from "@/hooks/useAnalytics";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";
import { DEMO_MESSAGE_LIMIT, saveDemoConversation } from "@/lib/demoConfig";
import { shouldShowGoogleAuth } from "@/lib/platformSeparation";

interface DemoChatProps {
  language: "en" | "de";
}

interface DemoMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

const DEMO_LIMIT = DEMO_MESSAGE_LIMIT;

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

const ERROR_MESSAGES = {
  en: {
    offline: "It seems like you're offline right now. Check your connection and try again — I'll be right here.",
    timeout: "I'm taking a bit longer than usual. Would you like to try again?",
    generic: "I couldn't respond just now. Let's try again — I'm still here for you.",
    retry: "Try again",
    continueSignup: "Create account instead",
  },
  de: {
    offline: "Du scheinst gerade offline zu sein. Prüfe deine Verbindung und versuch es nochmal — ich bin gleich wieder da.",
    timeout: "Ich brauche gerade etwas länger als üblich. Möchtest du es nochmal versuchen?",
    generic: "Ich konnte gerade nicht antworten. Lass es uns nochmal versuchen — ich bin weiterhin für dich da.",
    retry: "Nochmal versuchen",
    continueSignup: "Stattdessen Konto erstellen",
  },
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

/** Memoized message text renderer — avoids re-splitting on every streaming tick */
const MessageRenderer = memo(function MessageRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
});

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
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const demoStartedRef = useRef(false);
  const greetingShownRef = useRef(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Inline signup state
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showLoginMode, setShowLoginMode] = useState(false);

  const t = TEXTS[language];
  const errorTexts = ERROR_MESSAGES[language];

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
    // Scroll only the messages container, not the outer page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    if (userMessageCount > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, userMessageCount]);

  // Show continuation message + signup form after limit
  useEffect(() => {
    if (!showLimit) return;

    const contMsg = CONTINUATION_MSG[language];
    const id = "continuation";

    setMessages(prev => {
      if (prev.find(m => m.id === id)) return prev;
      return [...prev, { id, role: "assistant", content: contMsg }];
    });

    const timer = setTimeout(() => {
      setShowSignupForm(true);
      // Autofocus email field after form renders
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }, 800);
    return () => clearTimeout(timer);
  }, [showLimit, language]);

  const handleRetry = useCallback(() => {
    if (!lastFailedInput) return;
    // Remove the error message
    setMessages(prev => prev.filter(m => !m.isError));
    // Decrement user message count to allow retry
    setUserMessageCount(prev => Math.max(0, prev - 1));
    // Re-set the input
    setInput(lastFailedInput);
    setLastFailedInput(null);
  }, [lastFailedInput]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    if (!demoStartedRef.current) {
      demoStartedRef.current = true;
      analytics.track("demo_chat_started", { language }, "demo_chat_started");
    }

    if (userMessageCount >= DEMO_LIMIT) {
      if (!showLimit) setShowLimit(true);
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

      // Check online status before fetch
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw Object.assign(new Error("offline"), { type: "offline" });
      }

      const history = messages.filter(m => m.id !== "greeting" && m.id !== "continuation" && !m.isError).map(m => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: "user", content: text });

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

      // 20s timeout for demo chat
      const timeoutId = setTimeout(() => {
        abortRef.current?.abort();
      }, 20000);

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

      clearTimeout(timeoutId);

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

      setLastFailedInput(null);
    } catch (e: any) {
      if (e.name === "AbortError") {
        // Could be timeout or user abort
        const errorMsg = e.type === "offline" ? errorTexts.offline : errorTexts.timeout;
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: errorMsg, isError: true } : m)
        );
        setLastFailedInput(text);
      } else if (e.type === "offline") {
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: errorTexts.offline, isError: true } : m)
        );
        setLastFailedInput(text);
      } else {
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: errorTexts.generic, isError: true } : m)
        );
        setLastFailedInput(text);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      if (newCount >= DEMO_LIMIT) {
        analytics.track("demo_chat_limit_reached", { language }, "demo_limit");
        setTimeout(() => setShowLimit(true), 1500);
      }
    }
  }, [input, isStreaming, userMessageCount, messages, language, errorTexts]);

  // Persist demo conversation for post-signup continuity
  const persistDemoMessages = useCallback(() => {
    const conversationMessages = messages
      .filter(m => !m.isError && m.id !== "continuation")
      .map(m => ({ role: m.role, content: m.content }));
    if (conversationMessages.length > 1) {
      saveDemoConversation({
        messages: conversationMessages,
        language,
        companionName: "Mira",
        timestamp: Date.now(),
      });
    }
  }, [messages, language]);

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail.trim() || !signupPassword.trim()) return;

    setIsSigningUp(true);
    try {
      if (showLoginMode) {
        persistDemoMessages();
        await signIn(signupEmail.trim().toLowerCase(), signupPassword);
        analytics.track("demo_chat_converted", { messages_sent: userMessageCount, language, method: "login" });
        navigate("/home", { replace: true });
      } else {
        const result = await signUp(signupEmail.trim().toLowerCase(), signupPassword, signupName.trim() || undefined);
        analytics.track("demo_chat_converted", { messages_sent: userMessageCount, language, method: "signup" });
        if (result?.session) {
          persistDemoMessages();
          navigate("/home", { replace: true });
        } else {
          // Save demo messages even before confirmation — they'll be consumed on next login
          persistDemoMessages();
          toast({
            title: language === "de" ? "Fast geschafft!" : "Almost there!",
            description: language === "de"
              ? "Bitte bestätige deine E-Mail-Adresse, um fortzufahren."
              : "Please confirm your email address to continue.",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSigningUp(false);
    }
  }, [signupEmail, signupPassword, signupName, showLoginMode, signIn, signUp, navigate, userMessageCount, language, toast, t.error, persistDemoMessages]);

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
        <div
          ref={messagesContainerRef}
          className="px-4 py-4 space-y-3 max-h-[240px] sm:max-h-[320px] overflow-y-auto overscroll-contain"
          style={{ minHeight: 120, WebkitOverflowScrolling: "touch" }}
        >
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14.5px] leading-relaxed ${
                msg.isError
                  ? "bg-muted/50 border border-border/30 text-muted-foreground rounded-bl-lg"
                  : msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-lg"
                    : "bg-muted/50 border border-border/30 text-foreground rounded-bl-lg"
              }`}>
                <MessageRenderer content={msg.content} />
                {isStreaming && msg.role === "assistant" && msg === messages[messages.length - 1] && msg.content !== "" && !msg.isError && (
                  <span className="inline-block w-[3px] h-[16px] bg-primary/60 rounded-full align-text-bottom ml-0.5 animate-[cursor-blink_0.8s_ease-in-out_infinite]" />
                )}
              </div>
            </motion.div>
          ))}

          {/* Error recovery actions */}
          {lastFailedInput && !isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5 rounded-full"
                  onClick={handleRetry}
                >
                  <RefreshCw className="w-3 h-3" />
                  {errorTexts.retry}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs rounded-full text-muted-foreground"
                  onClick={() => {
                    setLastFailedInput(null);
                    setShowLimit(true);
                  }}
                >
                  {errorTexts.continueSignup}
                </Button>
              </div>
            </motion.div>
          )}

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
              {/* Google Sign-In — fastest path */}
              <button
                type="button"
                onClick={async () => {
                  persistDemoMessages();
                  analytics.track("demo_chat_google_signup_clicked", { language });
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) {
                    toast({ title: t.error, description: String(error), variant: "destructive" });
                  }
                }}
                className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl border border-border/50 bg-card hover:bg-muted/40 transition-all text-[14px] font-medium text-foreground mb-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {language === "de" ? "Mit Google fortfahren" : "Continue with Google"}
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                  {language === "de" ? "oder" : "or"}
                </span>
                <div className="flex-1 h-px bg-border/40" />
              </div>

              <form onSubmit={handleSignup} className="space-y-2">
                {!showLoginMode && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder={t.namePlaceholder}
                      autoComplete="given-name"
                      enterKeyHint="next"
                      className="w-full h-10 bg-muted/30 border border-border/40 rounded-xl pl-10 pr-4 text-[14px] text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required
                    autoComplete="email"
                    enterKeyHint="next"
                    className="w-full h-10 bg-muted/30 border border-border/40 rounded-xl pl-10 pr-4 text-[14px] text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
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
                    autoComplete="new-password"
                    enterKeyHint="go"
                    className="w-full h-10 bg-muted/30 border border-border/40 rounded-xl pl-10 pr-4 text-[14px] text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                  />
                </div>

                <Button type="submit" className="w-full h-10 gap-2 text-[14px]" disabled={isSigningUp}>
                  {isSigningUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t.signup}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between">
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
                className="flex-1 h-12 bg-muted/30 border border-border/40 rounded-full px-5 text-[15px] text-foreground focus:outline-none focus:border-primary/50 focus:bg-muted/50 transition-colors placeholder:text-muted-foreground/50"
                disabled={isStreaming}
                autoComplete="off"
                autoCorrect="on"
                enterKeyHint="send"
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
              {(() => {
                const remaining = Math.max(0, DEMO_LIMIT - userMessageCount);
                return language === "de"
                  ? `${remaining} ${remaining === 1 ? "Nachricht" : "Nachrichten"} verbleibend · Ohne Anmeldung`
                  : `${remaining} ${remaining === 1 ? "message" : "messages"} remaining · No signup needed`;
              })()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useRef, useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessageContent } from "@/components/chat/ChatMessageContent";
import { MessagePlayButton } from "@/components/chat/MessagePlayButton";
import { useTranslation } from "@/hooks/useTranslation";
import type { Message } from "@/hooks/useChatComposer";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isStreamingActive: boolean;
  isRestoringConversation: boolean;
  onRetry: () => void;
  onContinue: () => void;
  onPlayMessage: (message: Message) => void;
  onStopTTS: () => void;
  onSaveMessage: (message: Message) => void;
  isPlayingMessage: (id: string) => boolean;
  isLoadingMessage: (id: string) => boolean;
  canUseVoice: boolean;
  companionName?: string;
}

export function ChatMessages({
  messages, isLoading, isStreamingActive, isRestoringConversation,
  onRetry, onContinue, onPlayMessage, onStopTTS, onSaveMessage,
  isPlayingMessage, isLoadingMessage, canUseVoice, companionName,
}: ChatMessagesProps) {
  const { t, language } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserAtBottomRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isUserAtBottomRef.current = atBottom;
    setShowJumpToLatest(!atBottom);
  }, []);

  useEffect(() => {
    if (isUserAtBottomRef.current) {
      scrollToBottom(isStreamingActive ? "auto" : "smooth");
    }
  }, [messages, isStreamingActive, scrollToBottom]);

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4"
      style={{ WebkitOverflowScrolling: 'touch', contain: 'layout style' }}
    >
      <div className="max-w-lg mx-auto space-y-3">
        {isRestoringConversation ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.isError ? (
                <div className="max-w-[88%] px-4 py-3 rounded-2xl bg-destructive/10 border border-destructive/20 rounded-bl-lg">
                  <p className="text-sm text-destructive mb-2">{message.content}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t("chat.retryMessage")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onContinue}>
                      {t("chat.continueMessage")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={`relative max-w-[88%] px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-lg"
                    : "bg-card border border-border/50 text-foreground rounded-bl-lg shadow-soft"
                }`}>
                  <ChatMessageContent
                    content={message.content}
                    isUser={message.role === "user"}
                    isStreaming={isStreamingActive && message.role === "assistant" && message === messages[messages.length - 1]}
                  />
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MessagePlayButton
                        isPlaying={isPlayingMessage(message.id)}
                        isLoading={isLoadingMessage(message.id)}
                        onPlay={() => onPlayMessage(message)}
                        onStop={onStopTTS}
                        isPremium={canUseVoice}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); onSaveMessage(message); }}
                        className="p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground transition-colors flex items-center justify-center"
                        title={t("chat.saveMessage")}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* Thinking indicator */}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-bl-lg shadow-soft">
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-muted-foreground/70 italic">
                  {language === "de" ? `${companionName || "Soulvay"} reflektiert` : `${companionName || "Soulvay"} is reflecting`}
                </span>
                <span className="inline-flex gap-0.5">
                  <span className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                  <span className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showJumpToLatest && messages.length > 5 && (
        <button
          onClick={() => { scrollToBottom("smooth"); isUserAtBottomRef.current = true; setShowJumpToLatest(false); }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-card border border-border/50 shadow-elevated text-sm text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          ↓ {t("chat.jumpToLatest")}
        </button>
      )}
    </div>
  );
}

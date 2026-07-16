import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessageContent } from "@/components/chat/ChatMessageContent";
import { MessagePlayButton } from "@/components/chat/MessagePlayButton";
import { useTranslation } from "@/hooks/useTranslation";
import type { Message } from "@/hooks/useChatComposer";

// ============================================================================
// Per-message component (memoized)
// ----------------------------------------------------------------------------
// Elite-Audit #7: previously every drip-tick from the streaming assistant
// message caused all N messages to re-render + parse markdown. This isolates
// each message so only the streaming one re-renders during typing.
//
// Elite-Audit #10 (a11y): assistant messages are marked as log entries so
// screen readers announce each response; typing indicator is role=status.
// ============================================================================

interface ChatMessageItemProps {
  message: Message;
  isStreamingThis: boolean;
  canUseVoice: boolean;
  onRetry: () => void;
  onContinue: () => void;
  onPlayMessage: (message: Message) => void;
  onStopTTS: () => void;
  onSaveMessage: (message: Message) => void;
  isPlaying: boolean;
  isLoadingPlay: boolean;
}

const ChatMessageItem = React.memo(function ChatMessageItem({
  message, isStreamingThis, canUseVoice,
  onRetry, onContinue, onPlayMessage, onStopTTS, onSaveMessage,
  isPlaying, isLoadingPlay,
}: ChatMessageItemProps) {
  const { t } = useTranslation();

  const handleSave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveMessage(message);
  }, [onSaveMessage, message]);

  const handlePlay = useCallback(() => {
    onPlayMessage(message);
  }, [onPlayMessage, message]);

  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      {message.isError ? (
        <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-destructive/10 border border-destructive/20 rounded-bl-lg">
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
        <div
          className={`relative px-4 py-3 rounded-2xl ${
            message.role === "user"
              ? "max-w-[80%] bg-primary text-primary-foreground rounded-br-lg"
              : "max-w-[88%] bg-card border border-border/40 text-foreground rounded-bl-lg shadow-soft"
          }`}
          role={message.role === "assistant" ? "log" : undefined}
          aria-live={message.role === "assistant" && isStreamingThis ? "polite" : undefined}
        >
          <ChatMessageContent
            content={message.content}
            isUser={message.role === "user"}
            isStreaming={isStreamingThis && message.role === "assistant"}
          />
          {message.role === "assistant" && (
            <div className="flex items-center gap-1 mt-1.5 -mb-0.5">
              <MessagePlayButton
                isPlaying={isPlaying}
                isLoading={isLoadingPlay}
                onPlay={handlePlay}
                onStop={onStopTTS}
                isPremium={canUseVoice}
              />
              <button
                onClick={handleSave}
                className="p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground/40 hover:text-muted-foreground transition-colors flex items-center justify-center"
                title={t("chat.saveMessage")}
                aria-label={t("chat.saveMessage")}
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  // Custom shallow-compare: only re-render if this specific message's data
  // or its play/stream/voice state changed, or a callback identity changed.
  // Callbacks should be stable via useCallback in Chat.tsx.
  return (
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.isError === next.message.isError &&
    prev.message.role === next.message.role &&
    prev.isStreamingThis === next.isStreamingThis &&
    prev.isPlaying === next.isPlaying &&
    prev.isLoadingPlay === next.isLoadingPlay &&
    prev.canUseVoice === next.canUseVoice &&
    prev.onRetry === next.onRetry &&
    prev.onContinue === next.onContinue &&
    prev.onPlayMessage === next.onPlayMessage &&
    prev.onStopTTS === next.onStopTTS &&
    prev.onSaveMessage === next.onSaveMessage
  );
});

// ============================================================================
// Main ChatMessages list
// ============================================================================

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

export const ChatMessages = React.memo(function ChatMessages({
  messages, isLoading, isStreamingActive, isRestoringConversation,
  onRetry, onContinue, onPlayMessage, onStopTTS, onSaveMessage,
  isPlayingMessage, isLoadingMessage, canUseVoice, companionName,
}: ChatMessagesProps) {
  const { t } = useTranslation();
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

  // Derive once per render — avoids threading the full messages array into
  // each child just to check `message === messages[messages.length - 1]`.
  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i].id;
    }
    return null;
  }, [messages]);

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-5"
      style={{ WebkitOverflowScrolling: 'touch', contain: 'layout style' }}
    >
      <div className="max-w-[580px] mx-auto space-y-4">
        {isRestoringConversation ? (
          <div className="flex justify-center py-8" role="status" aria-live="polite">
            <div
              className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"
              aria-label={t("chat.restoringConversation") || "Loading conversation"}
            />
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              isStreamingThis={
                isStreamingActive &&
                message.role === "assistant" &&
                message.id === lastAssistantId
              }
              canUseVoice={canUseVoice}
              onRetry={onRetry}
              onContinue={onContinue}
              onPlayMessage={onPlayMessage}
              onStopTTS={onStopTTS}
              onSaveMessage={onSaveMessage}
              isPlaying={isPlayingMessage(message.id)}
              isLoadingPlay={isLoadingMessage(message.id)}
            />
          ))
        )}

        {/* Thinking indicator — role=status so screen readers announce it. */}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start animate-fade-in" role="status" aria-live="polite">
            <div className="bg-card border border-border/40 px-4 py-3 rounded-2xl rounded-bl-lg shadow-soft">
              <div className="flex items-center gap-2.5">
                <span className="text-[13.5px] text-muted-foreground/60 italic">
                  {`${companionName || "Soulvay"} ${t("companion.isReflecting")}`}
                </span>
                <span className="inline-flex gap-[3px]" aria-hidden="true">
                  <span className="w-[5px] h-[5px] bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-[5px] h-[5px] bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                  <span className="w-[5px] h-[5px] bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
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
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-card border border-border/40 shadow-elevated text-xs font-medium text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          ↓ {t("chat.jumpToLatest")}
        </button>
      )}
    </div>
  );
});

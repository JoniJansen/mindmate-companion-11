import React from "react";
import { Send, Mic, MicOff, VolumeX, Volume2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";

interface ChatInputBarProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isOnline: boolean;
  isPremium: boolean;
  canSendMessage: () => boolean;
  // Voice
  canUseVoice: boolean;
  isListening: boolean;
  isSpeechSupported: boolean;
  autoPlayReplies: boolean;
  onToggleAutoPlay: () => void;
  onToggleRecording: () => void;
}

export const ChatInputBar = React.memo(function ChatInputBar({
  inputValue, onInputChange, onSend,
  isLoading, isOnline, isPremium, canSendMessage,
  canUseVoice, isListening, isSpeechSupported, autoPlayReplies,
  onToggleAutoPlay, onToggleRecording,
}: ChatInputBarProps) {
  const { t } = useTranslation();

  return (
    <div className="shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="px-4 py-3">
        <div className="max-w-[580px] mx-auto flex items-center gap-2">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className={`shrink-0 h-9 w-9 rounded-full ${canUseVoice && autoPlayReplies ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                  onClick={onToggleAutoPlay}
                >
                  {canUseVoice && autoPlayReplies ? <Volume2 className="w-[18px] h-[18px]" /> : <VolumeX className="w-[18px] h-[18px]" />}
                  {!canUseVoice && <Lock className="w-2 h-2 absolute -bottom-0.5 -right-0.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {canUseVoice
                  ? (autoPlayReplies ? t("chat.aiSpeaksAuto") : t("chat.textOnly"))
                  : t("chat.voiceOutputPlus")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isSpeechSupported && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isListening && canUseVoice ? "destructive" : "outline"}
                    size="icon" className="shrink-0 h-9 w-9 rounded-full relative"
                    onClick={onToggleRecording}
                  >
                    {isListening && canUseVoice ? <MicOff className="w-[18px] h-[18px]" /> : <Mic className="w-[18px] h-[18px]" />}
                    {isListening && canUseVoice && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />}
                    {!canUseVoice && <Lock className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {canUseVoice
                    ? (isListening ? t("chat.stopRecording") : t("chat.voiceInput"))
                    : t("chat.voiceInputPlus")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
              placeholder={isListening && canUseVoice ? t("voice.listening") : t("chat.inputPlaceholder")}
              className="w-full h-11 bg-muted/20 border border-border/40 rounded-full px-4 pr-12 text-[15px] focus:outline-none focus:border-primary/30 focus:bg-background focus:ring-1 focus:ring-primary/10 transition-colors placeholder:text-muted-foreground/60"
              disabled={isLoading || (!canSendMessage() && !isPremium) || !isOnline}
              autoComplete="off"
              autoCorrect="on"
              enterKeyHint="send"
            />
            <Button
              size="icon" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full h-8 w-8"
              onClick={onSend}
              disabled={!inputValue.trim() || isLoading || (!canSendMessage() && !isPremium) || !isOnline}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

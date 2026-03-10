import React from "react";
import { BookOpen, AlertTriangle, Save, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface ChatActionButtonsProps {
  messageCount: number;
  canUseSessionSummary: boolean;
  onSummary: () => void;
  onSaveChat: () => void;
  onSaveSummary: () => void;
  onCrisisHelp: () => void;
}

export function ChatActionButtons({
  messageCount, canUseSessionSummary,
  onSummary, onSaveChat, onSaveSummary, onCrisisHelp,
}: ChatActionButtonsProps) {
  const { t } = useTranslation();

  if (messageCount <= 4) return null;

  return (
    <div className="shrink-0 px-4 pb-2 bg-background">
      <div className="max-w-lg mx-auto flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-2" onClick={onSummary}>
          <BookOpen className="w-4 h-4" />
          {t("chat.summary")}
          {!canUseSessionSummary && <Lock className="w-3 h-3 ml-1" />}
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={onSaveChat}>
          <Save className="w-4 h-4" />
          {t("chat.saveChat")}
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={onSaveSummary}>
          <BookOpen className="w-4 h-4" />
          {t("chat.saveSummary")}
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 text-destructive" onClick={onCrisisHelp}>
          <AlertTriangle className="w-4 h-4" />
          {t("chat.crisisHelp2")}
        </Button>
      </div>
    </div>
  );
}

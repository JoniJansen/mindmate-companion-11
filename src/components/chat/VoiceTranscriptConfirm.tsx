import { motion } from "framer-motion";
import { Send, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface VoiceTranscriptConfirmProps {
  transcript: string;
  onSend: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

export function VoiceTranscriptConfirm({
  transcript,
  onSend,
  onEdit,
  onCancel,
}: VoiceTranscriptConfirmProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-card border border-border/50 rounded-2xl p-4 shadow-soft"
    >
      <p className="text-sm text-foreground mb-3 leading-relaxed">
        "{transcript}"
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onSend}
          className="flex-1 gap-2"
        >
          <Send className="w-4 h-4" />
          {t("voice.send")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="gap-2"
        >
          <Pencil className="w-4 h-4" />
          {t("voice.edit")}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

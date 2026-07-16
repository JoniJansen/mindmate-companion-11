import { useState } from "react";
import { BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";

interface SaveToJournalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTitle: string;
  onSave: (title: string) => void;
  variant?: "message" | "conversation" | "summary";
}

export function SaveToJournalDialog({
  open,
  onOpenChange,
  defaultTitle,
  onSave,
  variant = "message",
}: SaveToJournalDialogProps) {
  const [title, setTitle] = useState(defaultTitle);
  const { t } = useTranslation();

  const handleSave = () => {
    onSave(title.trim() || defaultTitle);
    onOpenChange(false);
    setTitle(defaultTitle);
  };

  const descriptionKeys: Record<string, string> = {
    message: "chat.saveDialog.messageDesc",
    conversation: "chat.saveDialog.conversationDesc",
    summary: "chat.saveDialog.summaryDesc",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t("chat.saveDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t(descriptionKeys[variant] || descriptionKeys.message)}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            {t("chat.saveDialog.titleLabel")}
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={defaultTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

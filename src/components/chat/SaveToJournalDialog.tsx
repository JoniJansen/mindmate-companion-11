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
  const { language } = useTranslation();

  const handleSave = () => {
    onSave(title.trim() || defaultTitle);
    onOpenChange(false);
    setTitle(defaultTitle);
  };

  const descriptions: Record<string, Record<string, string>> = {
    message: {
      de: "Diese Nachricht wird in deinem Tagebuch gespeichert.",
      en: "This message will be saved to your journal.",
    },
    conversation: {
      de: "Das gesamte Gespräch wird in deinem Tagebuch gespeichert.",
      en: "The entire conversation will be saved to your journal.",
    },
    summary: {
      de: "Eine KI-Zusammenfassung wird erstellt und gespeichert.",
      en: "An AI summary will be generated and saved.",
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {language === "de" ? "Im Tagebuch speichern" : "Save to Journal"}
          </DialogTitle>
          <DialogDescription>
            {descriptions[variant]?.[language] || descriptions.message[language]}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            {language === "de" ? "Titel (optional)" : "Title (optional)"}
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
            {language === "de" ? "Abbrechen" : "Cancel"}
          </Button>
          <Button onClick={handleSave}>
            {language === "de" ? "Speichern" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

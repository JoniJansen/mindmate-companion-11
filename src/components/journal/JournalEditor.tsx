import { useState, forwardRef } from "react";
import { motion } from "framer-motion";
import { X, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

interface JournalEditorProps {
  initialContent?: string;
  initialTitle?: string;
  initialMood?: string;
  source?: string;
  onSave: (entry: { title: string; content: string; mood: string }) => Promise<void>;
  onClose: () => void;
  onReflect?: (content: string) => void;
}

const moods = ["😊", "😌", "😢", "😤", "😰", "🙏", "💪", "🤔"];

export const JournalEditor = forwardRef<HTMLDivElement, JournalEditorProps>(
  function JournalEditor({ 
    initialContent = "", 
    initialTitle = "", 
    initialMood = "",
    onSave, 
    onClose,
    onReflect
  }, ref) {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [mood, setMood] = useState(initialMood);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const { t } = useTranslation();

    const handleSave = async () => {
      if (!content.trim()) {
        toast({
          title: t("journal.emptyEntry"),
          description: t("journal.pleaseWriteSomething"),
          variant: "destructive",
        });
        return;
      }

      setIsSaving(true);
      try {
        await onSave({ title, content, mood });
        toast({
          title: t("journal.saved"),
          description: t("journal.entrySaved"),
        });
        onClose();
      } catch (error) {
        toast({
          title: t("common.error"),
          description: t("journal.saveFailed"),
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/95 z-50 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            {onReflect && content.length > 50 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onReflect(content)}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {t("journal.reflect")}
              </Button>
            )}
            <Button 
              variant="calm" 
              size="sm" 
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t("journal.saving") : t("common.save")}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 max-w-lg mx-auto w-full">
          {/* Mood selector */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">{t("journal.howAreYouFeeling")}</p>
            <div className="flex gap-2 flex-wrap">
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(mood === m ? "" : m)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    mood === m 
                      ? "bg-primary/20 ring-2 ring-primary" 
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("journal.titlePlaceholder")}
            className="w-full bg-transparent text-lg font-medium placeholder:text-muted-foreground focus:outline-none mb-4"
          />

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("journal.contentPlaceholder")}
            className="w-full h-[50vh] bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed"
            autoFocus
          />
        </div>
      </motion.div>
    );
  }
);

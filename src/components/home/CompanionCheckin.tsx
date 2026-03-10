import React from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface CompanionCheckinProps {
  type: "insight" | "memory" | "pattern";
  text: string;
  onTalkAboutIt: () => void;
  onDismiss: () => void;
}

export function CompanionCheckin({ type, text, onTalkAboutIt, onDismiss }: CompanionCheckinProps) {
  const { t } = useTranslation();

  const icon = type === "insight" ? "💡" : type === "memory" ? "💭" : "🌱";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="mb-6"
    >
      <div className="rounded-2xl p-4 border bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-medium text-muted-foreground">
            {t("growth.companionCheckin")}
          </span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed mb-3">
          {text}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-2"
            onClick={onTalkAboutIt}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {t("home.talkAboutIt")}
          </Button>
          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={onDismiss}>
            {t("home.notNow")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

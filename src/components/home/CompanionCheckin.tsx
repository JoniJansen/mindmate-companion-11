import React from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
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
      <div className="rounded-2xl overflow-hidden border bg-primary/5 border-primary/20">
        {/* Companion avatar strip */}
        <div className="px-4 pt-3 pb-0 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-xs">
            {icon}
          </div>
          <span className="text-[11px] font-medium text-primary/80 tracking-wide">
            {t("growth.companionCheckin")}
          </span>
        </div>

        <div className="px-4 pt-2 pb-3">
          <p className="text-sm text-foreground/90 leading-relaxed mb-3">
            {text}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="rounded-xl gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-0"
              onClick={onTalkAboutIt}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {t("home.talkAboutIt")}
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground text-xs" onClick={onDismiss}>
              {t("home.notNow")}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

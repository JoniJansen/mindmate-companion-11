import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { CompanionAvatarAnimated } from "@/components/companion/CompanionAvatarAnimated";

interface MemoryMomentCardProps {
  content: string;
  companionName?: string;
  companionArchetype?: string;
  companionAvatarUrl?: string;
  onTalkAboutIt: () => void;
  onDismiss: () => void;
}

/**
 * Surfaces one long-term memory from the companion ("Mira remembers…").
 * Rendered on Home only when useMemoryMoments has a moment to show —
 * no empty state, no placeholder.
 */
export function MemoryMomentCard({
  content,
  companionName,
  companionArchetype,
  companionAvatarUrl,
  onTalkAboutIt,
  onDismiss,
}: MemoryMomentCardProps) {
  const { t } = useTranslation();

  const title = companionName
    ? t("home.memoryMomentTitle").replace("{name}", companionName)
    : t("home.memoryMoment");

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="mb-6"
    >
      <div className="rounded-2xl overflow-hidden border bg-primary/5 border-primary/20">
        {/* Companion identity strip */}
        <div className="px-4 pt-3 pb-0 flex items-center gap-2.5">
          {companionArchetype ? (
            <CompanionAvatarAnimated
              avatarUrl={companionAvatarUrl}
              archetype={companionArchetype}
              name={companionName}
              size="sm"
              state="idle"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-xs">
              💭
            </div>
          )}
          <span className="text-[11px] font-medium text-primary/80 tracking-wide">
            {title}
          </span>
        </div>

        <div className="px-4 pt-2 pb-3">
          <p className="text-xs text-muted-foreground mb-1">
            {t("home.memoryMomentIntro")}
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed italic mb-1.5">
            {`"${content}"`}
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mb-3">
            {t("home.memoryMomentQuestion")}
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

import { useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useCompanion } from "@/hooks/useCompanion";
import { CompanionAvatarAnimated } from "@/components/companion/CompanionAvatarAnimated";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { getMoodEmoji } from "@/components/mood/MoodSelector";
import { analytics } from "@/hooks/useAnalytics";

interface MoodChatBridgeProps {
  moodValue: number;
  feelings: string[];
  note: string | null;
  onDismiss: () => void;
}

export function MoodChatBridge({ moodValue, feelings, note, onDismiss }: MoodChatBridgeProps) {
  const { t, language } = useTranslation();
  const { companion } = useCompanion();
  const navigate = useNavigate();
  const avatarUrl = useAvatarUrl(companion?.avatar_url);
  const companionName = companion?.name || "Soulvay";

  // Track prompt shown once
  useEffect(() => {
    analytics.track("mood_to_chat_prompt_shown", { mood_value: moodValue }, "mood_bridge_shown");
  }, []);

  const getMessage = () => {
    if (moodValue <= 2) {
      return language === "de"
        ? `Das klingt nach einem schweren Moment. Ich bin hier, wenn du reden möchtest.`
        : `That sounds like a tough moment. I'm here if you'd like to talk.`;
    }
    if (moodValue === 3) {
      return language === "de"
        ? `Danke, dass du das geteilt hast. Magst du ein bisschen darüber sprechen?`
        : `Thanks for sharing that. Would you like to talk about it a bit?`;
    }
    return language === "de"
      ? `Schön zu hören. Magst du mir erzählen, was deinen Tag gut gemacht hat?`
      : `Nice to hear. Want to tell me what made your day good?`;
  };

  const handleStartChat = () => {
    // Build context message for chat
    const emoji = getMoodEmoji(moodValue);
    const feelingList = feelings.length > 0 ? feelings.join(", ") : "";
    
    let contextMsg = language === "de"
      ? `Ich habe gerade meine Stimmung eingecheckt: ${emoji}`
      : `I just checked in with my mood: ${emoji}`;
    
    if (feelingList) {
      contextMsg += language === "de" ? ` (${feelingList})` : ` (${feelingList})`;
    }
    if (note) {
      contextMsg += language === "de" ? `. Notiz: "${note}"` : `. Note: "${note}"`;
    }
    
    localStorage.setItem("soulvay-initial-message", contextMsg);
    navigate("/chat");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mt-4"
    >
      <div className="rounded-2xl border bg-primary/5 border-primary/20 overflow-hidden">
        <div className="px-4 pt-3 pb-0 flex items-center gap-2.5">
          {companion?.archetype ? (
            <CompanionAvatarAnimated
              avatarUrl={avatarUrl}
              archetype={companion.archetype}
              name={companion.name}
              size="sm"
              state="idle"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-xs">
              💬
            </div>
          )}
          <span className="text-[11px] font-medium text-primary/80 tracking-wide">
            {companionName}
          </span>
        </div>

        <div className="px-4 pt-2 pb-3">
          <p className="text-sm text-foreground/90 leading-relaxed mb-3">
            {getMessage()}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="rounded-xl gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-0"
              onClick={handleStartChat}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {t("mood.wantToTalk")}
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

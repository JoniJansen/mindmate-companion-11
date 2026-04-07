import { useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useCompanion } from "@/hooks/useCompanion";
import { CompanionAvatarAnimated } from "@/components/companion/CompanionAvatarAnimated";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { analytics } from "@/hooks/useAnalytics";

interface JournalChatBridgeProps {
  entryContent: string;
  onDismiss: () => void;
}

export function JournalChatBridge({ entryContent, onDismiss }: JournalChatBridgeProps) {
  const { t, language } = useTranslation();
  const { companion } = useCompanion();
  const navigate = useNavigate();
  const avatarUrl = useAvatarUrl(companion?.avatar_url, companion?.archetype);
  const companionName = companion?.name || "Soulvay";

  useEffect(() => {
    analytics.track("journal_to_chat_prompt_shown", {}, "journal_bridge_shown");
  }, []);

  const handleStartChat = () => {
    analytics.track("journal_to_chat_clicked");
    const preview = entryContent.slice(0, 200);
    const contextMsg = language === "de"
      ? `Ich habe gerade etwas in mein Tagebuch geschrieben: "${preview}". Kannst du mir helfen, das einzuordnen?`
      : `I just wrote something in my journal: "${preview}". Can you help me make sense of it?`;

    localStorage.setItem("soulvay-initial-message", contextMsg);
    navigate("/chat");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
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
              📝
            </div>
          )}
          <span className="text-[11px] font-medium text-primary/80 tracking-wide">
            {companionName}
          </span>
        </div>

        <div className="px-4 pt-2 pb-3">
          <p className="text-sm text-foreground/90 leading-relaxed mb-3">
            {language === "de"
              ? `Möchtest du mit ${companionName} darüber sprechen, was du geschrieben hast?`
              : `Would you like to talk with ${companionName} about what you wrote?`}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="rounded-xl gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-0"
              onClick={handleStartChat}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {language === "de" ? "Darüber sprechen" : "Talk about it"}
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

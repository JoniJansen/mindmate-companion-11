import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CompanionAvatarAnimated } from "./CompanionAvatarAnimated";
import { useTranslation } from "@/hooks/useTranslation";
import { CompanionProfile } from "@/hooks/useCompanion";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";

interface CompanionCardProps {
  companion: CompanionProfile;
}

export function CompanionCard({ companion }: CompanionCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const avatarSignedUrl = useAvatarUrl(companion.avatar_url);

  const getGreeting = () => {
    const name = companion.name;
    const bond = companion.bond_level || 0;

    if (companion.last_interaction) {
      const lastInteraction = new Date(companion.last_interaction);
      const hoursSince = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 48) {
        return `${name} ${t("companion.greetingWondering")}`;
      }
    }

    if (bond >= 10) {
      return `${name} ${t("companion.greetingKnowsYou")}`;
    }

    return `${name} ${t("companion.greetingHere")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="mb-6"
    >
      <button
        onClick={() => navigate("/chat")}
        className="w-full rounded-2xl p-4 border bg-card border-border/50 hover:border-primary/30 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <CompanionAvatarAnimated
            avatarUrl={avatarSignedUrl}
            archetype={companion.archetype}
            name={companion.name}
            size="md"
            state="idle"
            showPresenceDot
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{companion.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {getGreeting()}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </button>
    </motion.div>
  );
}
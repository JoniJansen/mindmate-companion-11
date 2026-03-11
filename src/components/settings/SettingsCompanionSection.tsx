import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CalmCard } from "@/components/shared/CalmCard";
import { CompanionAvatarAnimated } from "@/components/companion/CompanionAvatarAnimated";
import { useTranslation } from "@/hooks/useTranslation";
import { useCompanion } from "@/hooks/useCompanion";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";

export function SettingsCompanionSection() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { companion, isLoading } = useCompanion();
  const avatarSignedUrl = useAvatarUrl(companion?.avatar_url);

  if (isLoading || !companion) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
        {language === "de" ? "Dein Begleiter" : "Your Companion"}
      </h2>
      <CalmCard
        variant="elevated"
        className="cursor-pointer hover:shadow-card hover:border-primary/20 transition-all"
        onClick={() => navigate("/companion")}
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
            <p className="font-medium text-foreground">{companion.name}</p>
            <p className="text-sm text-muted-foreground">
              {language === "de"
                ? `Verbindungslevel ${companion.bond_level}`
                : `Bond level ${companion.bond_level}`}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </div>
      </CalmCard>
    </motion.div>
  );
}

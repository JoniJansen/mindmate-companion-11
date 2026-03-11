import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCompanion } from "@/hooks/useCompanion";
import { CompanionSelector } from "@/components/companion/CompanionSelector";
import { CompanionAvatar } from "@/components/companion/CompanionAvatar";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompanionSettings() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { toast } = useToast();
  const { companion, isLoading, selectArchetype, updateName } = useCompanion();

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <PageHeader
          title={language === "de" ? "Dein Begleiter" : "Your Companion"}
          showBack
          backTo="/settings"
        />
        <div className="flex-1 px-4 py-6 space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title={language === "de" ? "Dein Begleiter" : "Your Companion"}
        subtitle={language === "de" ? "Wähle deinen Reflexionsbegleiter" : "Choose your reflection companion"}
        showBack
        backTo="/settings"
      />

      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="px-4 py-6 pb-32 max-w-lg mx-auto space-y-6">
          {/* Current Companion Preview */}
          {companion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-6"
            >
              <CompanionAvatar
                avatarUrl={companion.avatar_url}
                archetype={companion.archetype}
                name={companion.name}
                size="xl"
                animate={true}
              />
              <p className="font-semibold text-foreground mt-4 text-lg">{companion.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "de" ? `Verbindungslevel ${companion.bond_level}` : `Bond level ${companion.bond_level}`}
              </p>
            </motion.div>
          )}

          {/* Section header */}
          <h2 className="text-sm font-medium text-muted-foreground px-1">
            {language === "de" ? "Begleiter wählen" : "Choose Companion"}
          </h2>

          {/* Selector */}
          <CompanionSelector
            currentCompanion={companion}
            onSelect={async (id) => {
              await selectArchetype(id);
              toast({
                title: language === "de" ? "Begleiter aktualisiert" : "Companion updated",
                description: language === "de" ? "Dein Begleiter wurde geändert." : "Your companion has been changed.",
              });
            }}
            onUpdateName={async (name) => {
              await updateName(name);
              toast({
                title: language === "de" ? "Name gespeichert" : "Name saved",
              });
            }}
            onNavigateUpgrade={() => navigate("/upgrade")}
          />
        </div>
      </div>
    </div>
  );
}

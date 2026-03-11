import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { companionArchetypes, CompanionArchetype } from "@/data/companions";
import { CompanionAvatar } from "./CompanionAvatar";
import { usePremium } from "@/hooks/usePremium";
import { CompanionProfile } from "@/hooks/useCompanion";

interface CompanionSelectorProps {
  currentCompanion: CompanionProfile | null;
  onSelect: (archetypeId: string) => Promise<void>;
  onUpdateName: (name: string) => Promise<void>;
  onNavigateUpgrade: () => void;
}

export function CompanionSelector({ currentCompanion, onSelect, onUpdateName, onNavigateUpgrade }: CompanionSelectorProps) {
  const { language } = useTranslation();
  const { isPremium } = usePremium();
  const [selectedId, setSelectedId] = useState(currentCompanion?.archetype || "mira");
  const [customName, setCustomName] = useState(currentCompanion?.name || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = async (arch: CompanionArchetype) => {
    setSelectedId(arch.id);
    setCustomName(arch.name);
    setIsSaving(true);
    try {
      await onSelect(arch.id);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameSave = async () => {
    if (!customName.trim() || !isPremium) return;
    setIsSaving(true);
    try {
      await onUpdateName(customName.trim());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Archetype Grid */}
      <div className="grid grid-cols-2 gap-3">
        {companionArchetypes.map((arch) => {
          const isSelected = selectedId === arch.id;
          return (
            <motion.button
              key={arch.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(arch)}
              disabled={isSaving}
              className={`relative p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border/50 bg-card hover:border-border"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              )}
              <CompanionAvatar archetype={arch.id} size="md" animate={false} />
              <p className="font-medium text-foreground mt-2 text-sm">{arch.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {language === "de" ? arch.descriptionDe : arch.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Custom Name (Premium) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">
            {language === "de" ? "Name anpassen" : "Customize name"}
          </label>
          {!isPremium && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
        </div>
        {isPremium ? (
          <div className="flex gap-2">
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              maxLength={20}
              className="rounded-xl"
              placeholder={language === "de" ? "Name deines Begleiters" : "Your companion's name"}
            />
            <Button
              onClick={handleNameSave}
              disabled={!customName.trim() || isSaving}
              size="sm"
              className="rounded-xl shrink-0"
            >
              {language === "de" ? "Speichern" : "Save"}
            </Button>
          </div>
        ) : (
          <button
            onClick={onNavigateUpgrade}
            className="w-full text-left p-3 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-sm text-muted-foreground"
          >
            {language === "de"
              ? "Upgrade auf Plus, um deinen Begleiter umzubenennen und das Aussehen anzupassen."
              : "Upgrade to Plus to rename your companion and customize appearance."}
          </button>
        )}
      </div>
    </div>
  );
}

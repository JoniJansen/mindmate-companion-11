import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { companionArchetypes, CompanionArchetype } from "@/data/companions";
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
  const [confirmSwitch, setConfirmSwitch] = useState<CompanionArchetype | null>(null);

  const handleSelect = async (arch: CompanionArchetype) => {
    // If already selected, do nothing
    if (arch.id === selectedId) return;

    // If user already has a companion, show confirmation
    if (currentCompanion && currentCompanion.archetype !== arch.id) {
      setConfirmSwitch(arch);
      return;
    }

    await doSelect(arch);
  };

  const doSelect = async (arch: CompanionArchetype) => {
    setSelectedId(arch.id);
    setCustomName(arch.name);
    setIsSaving(true);
    try {
      await onSelect(arch.id);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSwitch = async () => {
    if (!confirmSwitch) return;
    setConfirmSwitch(null);
    await doSelect(confirmSwitch);
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

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Archetype List */}
      <div className="flex flex-col gap-3">
        {companionArchetypes.map((arch, index) => {
          const isSelected = selectedId === arch.id;
          const desc = language === "de" ? arch.descriptionDe : arch.description;
          return (
            <motion.div
              key={arch.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`relative rounded-2xl border text-left transition-all cursor-pointer flex flex-row items-stretch overflow-hidden ${
                isSaving ? "opacity-50 pointer-events-none" : ""
              } ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)]"
                  : "border-border/50 bg-card hover:border-primary/20 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.15)]"
              }`}
              onClick={() => handleSelect(arch)}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}
              
              {/* Avatar — fixed width, full height */}
              <div className="w-24 sm:w-28 lg:w-32 shrink-0 bg-muted/30">
                <img
                  src={arch.defaultAvatar}
                  alt={arch.name}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                  draggable={false}
                />
              </div>
              
              {/* Info */}
              <div className="p-3 lg:p-4 flex flex-col gap-1.5 flex-1 min-w-0 justify-center">
                <p className="font-semibold text-foreground text-sm lg:text-base">{arch.emoji} {arch.name}</p>
                <p className="text-[11px] lg:text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Custom Name (Premium) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">
            {language === "de" ? "Name anpassen" : "Customize name"}
          </label>
          {!isPremium && <Sparkles className="w-3.5 h-3.5 text-primary" />}
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
            className="w-full text-left p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-sm text-muted-foreground"
          >
            {language === "de"
              ? "Upgrade auf Plus, um deinen Begleiter umzubenennen und das Aussehen anzupassen."
              : "Upgrade to Plus to rename your companion and customize appearance."}
          </button>
        )}
      </div>

      {/* Switch Confirmation Dialog */}
      <AlertDialog open={!!confirmSwitch} onOpenChange={(open) => !open && setConfirmSwitch(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "de" ? "Begleiter wechseln?" : "Switch companion?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "de"
                ? `Möchtest du von ${currentCompanion?.name || ""} zu ${confirmSwitch?.name || ""} wechseln? Dein Gesprächsverlauf bleibt erhalten, aber neue Gespräche werden mit ${confirmSwitch?.name || ""} geführt.`
                : `Switch from ${currentCompanion?.name || ""} to ${confirmSwitch?.name || ""}? Your conversation history will be preserved, but new conversations will be with ${confirmSwitch?.name || ""}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              {language === "de" ? "Abbrechen" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch} className="rounded-xl">
              {language === "de" ? "Wechseln" : "Switch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

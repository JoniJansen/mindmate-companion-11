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
      {/* Archetype Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
        {companionArchetypes.map((arch, index) => {
          const isSelected = selectedId === arch.id;
          const isExpanded = expandedId === arch.id;
          const desc = language === "de" ? arch.descriptionDe : arch.description;
          return (
            <motion.div
              key={arch.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`relative rounded-2xl border text-left transition-all overflow-hidden group cursor-pointer ${
                isSaving ? "opacity-50 pointer-events-none" : ""
              } ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)]"
                  : "border-border/50 bg-card hover:border-primary/20 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.15)]"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 z-10 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-primary-foreground" />
                </div>
              )}
              
              {/* Avatar Image — clickable to select */}
              <div
                className="w-full aspect-square bg-muted/30 overflow-hidden active:scale-[0.97] transition-transform"
                onClick={() => handleSelect(arch)}
              >
                <img
                  src={arch.defaultAvatar}
                  alt={arch.name}
                  className="w-full h-full object-cover object-[center_25%]"
                  loading="lazy"
                />
              </div>
              
              {/* Info */}
              <div className="p-3 lg:p-4">
                <p className="font-semibold text-foreground text-sm lg:text-base cursor-pointer" onClick={() => handleSelect(arch)}>{arch.name}</p>
                <AnimatePresence mode="wait">
                  {isExpanded ? (
                    <motion.p
                      key="full"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[11px] lg:text-xs text-muted-foreground mt-1 leading-relaxed"
                    >
                      {desc}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="truncated"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] lg:text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2 lg:line-clamp-3"
                      onClick={(e) => toggleExpand(arch.id, e)}
                    >
                      {desc}
                    </motion.p>
                  )}
                </AnimatePresence>
                {!isExpanded && desc.length > 50 && (
                  <span
                    onClick={(e) => toggleExpand(arch.id, e)}
                    className="text-[10px] lg:text-[11px] text-primary font-medium mt-1 inline-block cursor-pointer"
                  >
                    {language === "de" ? "Mehr →" : "More →"}
                  </span>
                )}
                {isExpanded && (
                  <span
                    onClick={(e) => toggleExpand(arch.id, e)}
                    className="text-[10px] lg:text-[11px] text-primary font-medium mt-1 inline-block cursor-pointer"
                  >
                    {language === "de" ? "Weniger" : "Less"}
                  </span>
                )}
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

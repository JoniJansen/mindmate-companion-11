import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCompanion } from "@/hooks/useCompanion";
import { CompanionSelector } from "@/components/companion/CompanionSelector";
import { CompanionAvatar } from "@/components/companion/CompanionAvatar";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { usePremium } from "@/hooks/usePremium";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";

export default function CompanionSettings() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { toast } = useToast();
  const { isPremium } = usePremium();
  const { companion, isLoading, selectArchetype, updateName, updateAppearance, saveAvatarUrl, reload } = useCompanion();
  const [isGenerating, setIsGenerating] = useState(false);
  const [appearancePrompt, setAppearancePrompt] = useState(companion?.appearance_prompt || "");
  const avatarSignedUrl = useAvatarUrl(companion?.avatar_url);

  // Sync appearance prompt when companion loads
  const handleGenerateAvatar = async () => {
    if (!companion || !isPremium) return;
    const prompt = appearancePrompt.trim() || companion.appearance_prompt;
    if (!prompt) {
      toast({ title: language === "de" ? "Beschreibe zuerst das Aussehen" : "Describe the appearance first", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      // Save the appearance prompt first
      if (appearancePrompt.trim()) {
        await updateAppearance(appearancePrompt.trim());
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-companion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ appearance_prompt: prompt }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Generation failed");
      }

      const result = await resp.json();
      if (result.avatar_path) {
        await saveAvatarUrl(result.avatar_path);
        await reload();
        toast({ title: language === "de" ? "Portrait generiert!" : "Portrait generated!" });
      }
    } catch (e: any) {
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: e.message || "Failed to generate",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
                avatarUrl={avatarSignedUrl}
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
              // Update local appearance prompt
              const arch = (await import("@/data/companions")).getArchetype(id);
              if (arch) setAppearancePrompt(arch.appearancePrompt);
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

          {/* Avatar Generation (Premium) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-muted-foreground px-1">
                {language === "de" ? "Portrait generieren" : "Generate Portrait"}
              </h2>
              {!isPremium && <Sparkles className="w-3.5 h-3.5 text-primary" />}
            </div>

            {isPremium ? (
              <div className="space-y-3">
                <Textarea
                  value={appearancePrompt}
                  onChange={(e) => setAppearancePrompt(e.target.value)}
                  placeholder={language === "de"
                    ? "Beschreibe das Aussehen deines Begleiters (z.B. 'Eine ruhige Frau mit kurzen Haaren und Brille')"
                    : "Describe your companion's appearance (e.g. 'A calm woman with short hair and glasses')"}
                  className="rounded-xl min-h-[80px] resize-none"
                  maxLength={300}
                />
                <Button
                  onClick={handleGenerateAvatar}
                  disabled={isGenerating}
                  className="w-full rounded-xl gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {language === "de" ? "Generiert…" : "Generating…"}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {language === "de" ? "Portrait generieren" : "Generate Portrait"}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/upgrade")}
                className="w-full text-left p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-sm text-muted-foreground"
              >
                {language === "de"
                  ? "Upgrade auf Plus für KI-generierte Portraits."
                  : "Upgrade to Plus for AI-generated portraits."}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

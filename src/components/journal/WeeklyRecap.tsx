import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, Sparkles, Loader2, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface WeeklyRecapProps {
  userId: string;
}

interface RecapData {
  themes: string[];
  emotionalTone: string;
  insight: string;
}

export function WeeklyRecap({ userId }: WeeklyRecapProps) {
  const [recap, setRecap] = useState<RecapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { language, t } = useTranslation();
  const { aiConsentGiven } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkDataAvailability();
  }, [userId]);

  const checkDataAvailability = async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count } = await supabase
      .from("journal_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", weekAgo.toISOString());

    setHasEnoughData((count || 0) >= 3);
  };

  const generateRecap = async () => {
    // Client-side AI consent gate: server's requireAIConsent will 403 anyway,
    // but blocking here gives the user a cleaner message than a generic error.
    if (!aiConsentGiven) {
      toast({
        title: t("weeklyRecap.aiConsentRequired"),
        description: t("weeklyRecap.aiConsentInSettings"),
      });
      return;
    }

    setIsLoading(true);
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: entries } = await supabase
        .from("journal_entries")
        .select("content, mood, created_at")
        .eq("user_id", userId)
        .gte("created_at", weekAgo.toISOString())
        .order("created_at", { ascending: false });

      if (!entries || entries.length < 3) return;

      const { data, error } = await supabase.functions.invoke("journal-reflect", {
        body: {
          entries: entries.map((e) => e.content).join("\n\n---\n\n"),
          type: "weekly-recap",
          language,
        },
      });

      if (error) {
        // Surface AI consent errors specifically — the server enforces this
        // via requireAIConsent (Apple 5.1.1(i) / 5.1.2(i)).
        const isConsentErr = (error as any)?.context?.status === 403
          || /AI_CONSENT_REQUIRED/i.test(error.message || "");
        if (isConsentErr) {
          toast({
            title: t("weeklyRecap.aiConsentRequired"),
            description: t("weeklyRecap.aiConsentDesc"),
          });
          return;
        }
        throw error;
      }

      setRecap({
        themes: data.themes || [],
        emotionalTone: data.emotionalTone || "",
        insight: data.insight || data.reflection || "",
      });
      setExpanded(true);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error generating recap:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!recap) return;
    const title = t("weeklyRecap.title");
    const themesText = recap.themes.length > 0
      ? `\n${recap.themes.map(t => `• ${t}`).join("\n")}`
      : "";
    const shareText = `${title}\n${themesText}\n\n"${recap.insight}"\n\n· Soulvay`;

    if (navigator.share) {
      try { await navigator.share({ text: shareText }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(shareText); } catch {}
    }
  };

  if (!hasEnoughData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <CalmCard variant="calm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            {recap ? (
              <div className="space-y-3">
                {/* Narrative title */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("weeklyRecap.title")}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </Button>
                </div>

                {/* Themes as narrative flow */}
                {recap.themes.length > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">
                      {t("weeklyRecap.themesLabel")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {recap.themes.slice(0, 4).map((theme) => (
                        <span
                          key={theme}
                          className="px-2.5 py-1 bg-primary/8 text-foreground/80 rounded-lg text-xs"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded: insight as a reflective moment */}
                {expanded && recap.insight && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3"
                  >
                    {/* Emotional tone */}
                    {recap.emotionalTone && (
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                          {t("weeklyRecap.emotionalTone")}
                        </p>
                        <p className="text-sm text-foreground/75">{recap.emotionalTone}</p>
                      </div>
                    )}

                    {/* Reflective insight — the heart of the narrative */}
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                          {t("weeklyRecap.reflectionLabel")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/85 leading-relaxed italic">
                        "{recap.insight}"
                      </p>
                    </div>

                    {/* Share */}
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground gap-1.5 h-7"
                        onClick={handleShare}
                      >
                        <Share2 className="w-3 h-3" />
                        {t("weeklyRecap.share")}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  {t("weeklyRecap.title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("weeklyRecap.description")}
                </p>
                <Button
                  size="sm"
                  onClick={generateRecap}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("weeklyRecap.loading")}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      {t("weeklyRecap.createCTA")}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CalmCard>
    </motion.div>
  );
}

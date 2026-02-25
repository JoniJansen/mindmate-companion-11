import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";

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
  const { language } = useTranslation();

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

      if (!entries || entries.length < 3) {
        return;
      }

      const { data, error } = await supabase.functions.invoke("journal-reflect", {
        body: {
          entries: entries.map((e) => e.content).join("\n\n---\n\n"),
          type: "weekly-recap",
          language,
        },
      });

      if (error) throw error;

      setRecap({
        themes: data.themes || [],
        emotionalTone: data.emotionalTone || "",
        insight: data.insight || data.reflection || "",
      });
    } catch (error) {
      console.error("Error generating recap:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasEnoughData) {
    return null;
  }

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
                <h3 className="font-medium text-foreground">
                  {language === "de" ? "Deine Woche im Rückblick" : "Your week in review"}
                </h3>

                {recap.themes.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === "de" ? "Wiederkehrende Themen" : "Recurring themes"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {recap.themes.slice(0, 4).map((theme) => (
                        <span
                          key={theme}
                          className="px-2 py-0.5 bg-primary/20 text-primary-foreground rounded-full text-xs"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {recap.insight && (
                  <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                    <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{recap.insight}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  {language === "de" ? "Wochenrückblick" : "Weekly recap"}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {language === "de"
                    ? "Entdecke Muster und Themen aus deinen Einträgen dieser Woche."
                    : "Discover patterns and themes from your entries this week."}
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
                      {language === "de" ? "Analysiere..." : "Analyzing..."}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      {language === "de" ? "Rückblick erstellen" : "Generate recap"}
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

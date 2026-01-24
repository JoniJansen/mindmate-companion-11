import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";

interface JournalPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const prompts = {
  en: [
    { category: "Feelings", prompt: "What am I feeling right now, and where do I feel it in my body?" },
    { category: "Clarity", prompt: "What is taking up the most mental space today?" },
    { category: "Patterns", prompt: "What keeps coming up for me lately?" },
    { category: "Self-compassion", prompt: "What would I tell a close friend in my situation?" },
    { category: "Gratitude", prompt: "What small moment brought me peace today?" },
    { category: "Boundaries", prompt: "Where do I need to say no more often?" },
    { category: "Growth", prompt: "What have I learned about myself recently?" },
    { category: "Values", prompt: "Am I living in alignment with what matters most to me?" },
    { category: "Release", prompt: "What do I need to let go of?" },
    { category: "Future", prompt: "What would make tomorrow feel lighter?" },
  ],
  de: [
    { category: "Gefühle", prompt: "Was fühle ich gerade und wo spüre ich es in meinem Körper?" },
    { category: "Klarheit", prompt: "Was nimmt heute den meisten mentalen Raum ein?" },
    { category: "Muster", prompt: "Was kommt in letzter Zeit immer wieder hoch?" },
    { category: "Selbstmitgefühl", prompt: "Was würde ich einem guten Freund in meiner Situation sagen?" },
    { category: "Dankbarkeit", prompt: "Welcher kleine Moment hat mir heute Frieden gebracht?" },
    { category: "Grenzen", prompt: "Wo muss ich öfter Nein sagen?" },
    { category: "Wachstum", prompt: "Was habe ich kürzlich über mich gelernt?" },
    { category: "Werte", prompt: "Lebe ich im Einklang mit dem, was mir am wichtigsten ist?" },
    { category: "Loslassen", prompt: "Was muss ich loslassen?" },
    { category: "Zukunft", prompt: "Was würde morgen leichter machen?" },
  ],
};

export function JournalPrompts({ onSelectPrompt }: JournalPromptsProps) {
  const { language } = useTranslation();
  const promptList = prompts[language as "en" | "de"] || prompts.en;
  
  const [displayedPrompts, setDisplayedPrompts] = useState(() => 
    shuffleArray(promptList).slice(0, 3)
  );

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  const refreshPrompts = () => {
    setDisplayedPrompts(shuffleArray(promptList).slice(0, 3));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Lightbulb className="w-4 h-4" />
          <span>{language === "de" ? "Reflexionsfragen" : "Reflection prompts"}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshPrompts}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <AnimatePresence mode="popLayout">
        {displayedPrompts.map((item, index) => (
          <motion.div
            key={item.prompt}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.1 }}
          >
            <CalmCard
              variant="gentle"
              className="cursor-pointer hover:bg-gentle/10 transition-colors group"
              onClick={() => onSelectPrompt(item.prompt)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {item.category}
                  </span>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {item.prompt}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CalmCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

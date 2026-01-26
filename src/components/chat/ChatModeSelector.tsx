import { useRef, useEffect, useState } from "react";
import { MessageCircle, Lightbulb, Heart, TrendingUp, Lock } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export type ChatMode = "talk" | "clarify" | "calm" | "patterns";

interface ChatModeSelectorProps {
  activeMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  lockedModes?: ChatMode[];
}

const modes = [
  {
    id: "talk" as ChatMode,
    icon: MessageCircle,
    labelEn: "Talk",
    labelDe: "Freireden",
  },
  {
    id: "clarify" as ChatMode,
    icon: Lightbulb,
    labelEn: "Clarify",
    labelDe: "Klären",
  },
  {
    id: "calm" as ChatMode,
    icon: Heart,
    labelEn: "Calm",
    labelDe: "Beruhigen",
  },
  {
    id: "patterns" as ChatMode,
    icon: TrendingUp,
    labelEn: "Patterns",
    labelDe: "Muster",
  },
];

export function ChatModeSelector({ activeMode, onModeChange, lockedModes = [] }: ChatModeSelectorProps) {
  const { language } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Check scroll position for edge fades
  const updateFades = () => {
    const el = scrollRef.current;
    if (!el) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftFade(scrollLeft > 4);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    updateFades();
    el.addEventListener("scroll", updateFades, { passive: true });
    window.addEventListener("resize", updateFades);
    
    return () => {
      el.removeEventListener("scroll", updateFades);
      window.removeEventListener("resize", updateFades);
    };
  }, []);

  // Scroll active tab into view on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const activeIndex = modes.findIndex(m => m.id === activeMode);
    const buttons = el.querySelectorAll("button");
    if (buttons[activeIndex]) {
      buttons[activeIndex].scrollIntoView({ behavior: "instant", inline: "center", block: "nearest" });
    }
    
    // Delay fade check after scroll
    requestAnimationFrame(updateFades);
  }, [activeMode]);

  return (
    <div className="relative w-full max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto">
      {/* Left fade overlay */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none transition-opacity duration-150",
          "bg-gradient-to-r from-background to-transparent",
          showLeftFade ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />
      
      {/* Right fade overlay */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none transition-opacity duration-150",
          "bg-gradient-to-l from-background to-transparent",
          showRightFade ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />

      {/* Scrollable segmented control container */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ 
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Inner control wrapper - unified pill background */}
        <div 
          className="inline-flex items-center gap-1 p-1 mx-auto bg-muted/50 rounded-xl border border-border/40"
          role="tablist"
          aria-label={language === "de" ? "Chat-Modus wählen" : "Select chat mode"}
        >
          {modes.map((mode) => {
            const isActive = activeMode === mode.id;
            const isLocked = lockedModes.includes(mode.id);
            const Icon = mode.icon;
            const label = language === "de" ? mode.labelDe : mode.labelEn;
            
            return (
              <button
                key={mode.id}
                role="tab"
                aria-selected={isActive}
                aria-disabled={isLocked}
                onClick={() => !isLocked && onModeChange(mode.id)}
                disabled={isLocked}
                className={cn(
                  // Base styles - unified height, centered content
                  "relative flex items-center justify-center gap-1.5",
                  "h-9 px-3.5 min-w-fit",
                  "text-[13px] font-medium whitespace-nowrap",
                  "rounded-lg transition-all duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  // Scroll snap
                  "scroll-snap-align-center",
                  // Active state
                  isActive && [
                    "bg-background text-foreground",
                    "shadow-sm",
                  ],
                  // Inactive state
                  !isActive && !isLocked && [
                    "text-muted-foreground",
                    "hover:text-foreground hover:bg-background/50",
                    "active:bg-background/70",
                  ],
                  // Locked state
                  isLocked && [
                    "text-muted-foreground/50 cursor-not-allowed",
                  ]
                )}
                title={
                  isLocked 
                    ? (language === "de" ? "MindMate Plus erforderlich" : "Requires MindMate Plus")
                    : label
                }
              >
                <Icon 
                  className={cn(
                    "w-3.5 h-3.5 flex-shrink-0",
                    isActive && "text-primary"
                  )} 
                />
                <span className="leading-none">{label}</span>
                {isLocked && (
                  <Lock className="w-3 h-3 flex-shrink-0 ml-0.5 opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function getModeSystemPrompt(mode: ChatMode, language: "en" | "de"): string {
  const prompts: Record<ChatMode, { en: string; de: string }> = {
    talk: {
      en: `MODE: Free Emotional Conversation
      
The user wants to talk freely about what's on their mind. Your role:
- Listen more than you advise
- Reflect feelings back empathetically
- Ask only occasional clarifying questions
- Don't rush to fix or solve
- Create space for emotional expression
- Validate without judgment`,
      de: `MODUS: Freies emotionales Gespräch
      
Der Nutzer möchte frei über das sprechen, was ihn beschäftigt. Deine Rolle:
- Höre mehr zu als du rätst
- Spiegle Gefühle empathisch zurück
- Stelle nur gelegentlich klärende Fragen
- Versuche nicht, schnell zu lösen
- Schaffe Raum für emotionalen Ausdruck
- Validiere ohne Urteil`,
    },
    clarify: {
      en: `MODE: Guided Reflection
      
The user wants help clarifying their thoughts. Your role:
- Ask structured, reflective questions
- Help organize scattered thoughts
- Identify core concerns beneath the surface
- Guide toward insight, not answers
- Use Socratic questioning
- Summarize key points periodically`,
      de: `MODUS: Geführte Reflexion
      
Der Nutzer möchte Hilfe beim Klären seiner Gedanken. Deine Rolle:
- Stelle strukturierte, reflexive Fragen
- Hilf, zerstreute Gedanken zu ordnen
- Identifiziere Kernthemen unter der Oberfläche
- Führe zu Einsicht, nicht zu Antworten
- Nutze sokratisches Fragen
- Fasse Kernpunkte regelmäßig zusammen`,
    },
    calm: {
      en: `MODE: Emotional Regulation
      
The user needs calming support. Your role:
- Use a slower, gentler pace
- Offer grounding techniques when helpful
- Focus on the present moment
- Validate the difficulty they're experiencing
- Suggest breathing or sensory exercises if appropriate
- Be a steady, calming presence
- Avoid analysis—focus on regulation`,
      de: `MODUS: Emotionale Regulierung
      
Der Nutzer braucht beruhigende Unterstützung. Deine Rolle:
- Nutze ein langsameres, sanfteres Tempo
- Biete Grounding-Techniken an, wenn hilfreich
- Fokussiere auf den gegenwärtigen Moment
- Validiere die Schwierigkeit, die er erlebt
- Schlage Atem- oder Sinnesübungen vor, wenn passend
- Sei eine stetige, beruhigende Präsenz
- Vermeide Analyse—fokussiere auf Regulierung`,
    },
    patterns: {
      en: `MODE: Pattern Recognition
      
The user wants to understand their patterns better. Your role:
- Help identify recurring themes
- Notice connections between situations and emotions
- Offer gentle psychoeducation when relevant
- Explore "What tends to happen when..."
- Look for patterns without labeling or diagnosing
- Encourage self-discovery over explanation`,
      de: `MODUS: Muster-Erkennung
      
Der Nutzer möchte seine Muster besser verstehen. Deine Rolle:
- Hilf, wiederkehrende Themen zu identifizieren
- Bemerke Verbindungen zwischen Situationen und Emotionen
- Biete sanfte Psychoedukation an, wenn relevant
- Erkunde "Was passiert typischerweise, wenn..."
- Suche nach Mustern ohne zu labeln oder diagnostizieren
- Fördere Selbstentdeckung statt Erklärung`,
    },
  };

  return prompts[mode][language];
}

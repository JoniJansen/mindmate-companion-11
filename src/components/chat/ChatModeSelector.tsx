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
    const isScrollable = scrollWidth > clientWidth;
    setShowLeftFade(isScrollable && scrollLeft > 4);
    setShowRightFade(isScrollable && scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    // Initial check after render
    const timer = setTimeout(updateFades, 50);
    
    el.addEventListener("scroll", updateFades, { passive: true });
    window.addEventListener("resize", updateFades);
    
    // DEV-ONLY: Check if last tab is clipped (automated visual check)
    if (import.meta.env.DEV) {
      const checkClipping = () => {
        const buttons = el.querySelectorAll("button");
        const lastButton = buttons[buttons.length - 1];
        if (lastButton) {
          const containerRect = el.getBoundingClientRect();
          const buttonRect = lastButton.getBoundingClientRect();
          const isClipped = buttonRect.right > containerRect.right + 4;
          const isPartiallyHidden = buttonRect.left + buttonRect.width * 0.5 > containerRect.right;
          
          if (isClipped && el.scrollLeft === 0 && import.meta.env.DEV) {
            console.warn(
              `[ChatModeSelector] Last tab "${lastButton.textContent}" may be clipped at rest. ` +
              `Container: ${containerRect.width}px, Content needs: ${el.scrollWidth}px. ` +
              `Consider ensuring parent has min-w-0 and no overflow-hidden.`
            );
          }
        }
      };
      setTimeout(checkClipping, 100);
    }
    
    return () => {
      clearTimeout(timer);
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
    // CRITICAL: min-w-0 prevents flex compression issues on iOS
    <div className="relative w-full min-w-0">
      {/* Left fade overlay */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none transition-opacity duration-150",
          "bg-gradient-to-r from-background via-background/60 to-transparent",
          showLeftFade ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />
      
      {/* Right fade overlay */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none transition-opacity duration-150",
          "bg-gradient-to-l from-background via-background/60 to-transparent",
          showRightFade ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />

      {/* Scrollable segmented control — full width, centered pill */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide justify-center"
        style={{ 
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Inner control wrapper — w-full on small screens so tabs stretch to fill */}
        <div 
          className="inline-flex flex-nowrap items-center gap-0.5 p-1 bg-muted/60 rounded-xl border border-border/50 w-full max-w-md"
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
                  // Base styles - 44px min tap target, flex-1 to distribute evenly
                  "relative flex items-center justify-center gap-1.5 flex-1",
                  "min-h-[44px] h-11 px-2.5 min-w-0",
                  "text-[13px] font-medium whitespace-nowrap",
                  "rounded-[10px] transition-all duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  // Scroll snap
                  "snap-center",
                  // Active state - clear visual dominance
                  isActive && [
                    "bg-background text-foreground",
                    "shadow-sm border border-border/30",
                  ],
                  // Inactive state - clearly secondary
                  !isActive && !isLocked && [
                    "text-muted-foreground",
                    "active:bg-background/60 active:text-foreground",
                  ],
                  // Locked state
                  isLocked && [
                    "text-muted-foreground/40 cursor-not-allowed",
                  ]
                )}
                title={
                  isLocked 
                    ? (language === "de" ? "Soulvay Plus erforderlich" : "Requires Soulvay Plus")
                    : label
                }
              >
                <Icon 
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-primary" : "text-current"
                  )} 
                />
                <span className="leading-none">{label}</span>
                {isLocked && (
                  <Lock className="w-3 h-3 flex-shrink-0 ml-0.5" />
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
      en: `MODE: Deep Listening & Reflective Conversation

The user wants to talk freely. Your role is to listen deeply and reflect meaningfully — NOT to simply echo.

Guidelines:
- Reflect SPECIFIC emotional details from what the user shared, not generic summaries
- Add a layer of understanding that shows you grasped the deeper meaning
- Offer gentle observations when you notice patterns or themes ("I notice that...")
- Ask thoughtful follow-up questions that invite deeper exploration
- End every response with either ONE reflective question OR a warm invitation to continue sharing
- Do NOT list solutions or techniques unless explicitly asked
- Resist the impulse to fix — create space for the user to process`,
      de: `MODUS: Tiefes Zuhören & Reflektives Gespräch

Der Nutzer möchte frei sprechen. Deine Rolle ist tiefes Zuhören und bedeutungsvolles Reflektieren — NICHT einfaches Echo.

Richtlinien:
- Spiegle SPEZIFISCHE emotionale Details aus dem Gesagten, keine generischen Zusammenfassungen
- Füge eine Ebene des Verstehens hinzu, die zeigt, dass du den tieferen Sinn erfasst hast
- Biete sanfte Beobachtungen an, wenn dir Muster auffallen ("Mir fällt auf, dass...")
- Stelle durchdachte Nachfragen, die zu tieferer Reflexion einladen
- Beende jede Antwort mit EINER reflektiven Frage ODER einer warmen Einladung weiterzusprechen
- Liste KEINE Lösungen oder Techniken auf, es sei denn ausdrücklich gefragt
- Widerstehe dem Impuls zu reparieren — schaffe Raum zum Verarbeiten`,
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

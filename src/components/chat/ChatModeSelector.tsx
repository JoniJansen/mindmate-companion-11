import { MessageCircle, Lightbulb, Heart, TrendingUp, Lock } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

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
    labelEn: "Talk it out",
    labelDe: "Frei reden",
    descEn: "Free emotional conversation",
    descDe: "Freies emotionales Gespräch",
  },
  {
    id: "clarify" as ChatMode,
    icon: Lightbulb,
    labelEn: "Clarify",
    labelDe: "Klären",
    descEn: "Guided reflection",
    descDe: "Geführte Reflexion",
  },
  {
    id: "calm" as ChatMode,
    icon: Heart,
    labelEn: "Calm down",
    labelDe: "Beruhigen",
    descEn: "Emotional regulation",
    descDe: "Emotionale Regulierung",
  },
  {
    id: "patterns" as ChatMode,
    icon: TrendingUp,
    labelEn: "Patterns",
    labelDe: "Muster",
    descEn: "Understand yourself",
    descDe: "Dich selbst verstehen",
  },
];

export function ChatModeSelector({ activeMode, onModeChange, lockedModes = [] }: ChatModeSelectorProps) {
  const { language } = useTranslation();

  return (
    <div className="max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
      {modes.map((mode) => {
        const isActive = activeMode === mode.id;
        const isLocked = lockedModes.includes(mode.id);
        const Icon = mode.icon;
        
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            disabled={isLocked}
            className={`relative flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-[13px] font-medium whitespace-nowrap transition-all duration-150 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-soft"
                : isLocked
                  ? "bg-muted/20 text-muted-foreground/40 border border-border/30 cursor-not-allowed opacity-60"
                  : "bg-muted/40 text-muted-foreground border border-transparent hover:bg-muted/60"
            }`}
            title={isLocked 
              ? (language === "de" ? "MindMate Plus erforderlich" : "Requires MindMate Plus")
              : (language === "de" ? mode.descDe : mode.descEn)
            }
          >
            <Icon className="w-4 h-4" />
            <span>{language === "de" ? mode.labelDe : mode.labelEn}</span>
            {isLocked && <Lock className="w-3 h-3 ml-0.5" />}
          </button>
        );
      })}
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

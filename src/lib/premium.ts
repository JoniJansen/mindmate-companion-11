// MindMate Premium vs Free Feature Structure
// This defines the psychological and product structure, not technical paywall

export type FeatureTier = "free" | "premium";

export interface Feature {
  id: string;
  name: { en: string; de: string };
  description: { en: string; de: string };
  tier: FeatureTier;
}

// FREE: Core emotional support - always available
// PREMIUM: Deeper pattern recognition & long-term insights
export const features: Feature[] = [
  // FREE FEATURES - Core emotional support
  {
    id: "chat-talk",
    name: { en: "Talk it out", de: "Darüber reden" },
    description: { en: "Free emotional conversation anytime", de: "Emotionales Gespräch jederzeit" },
    tier: "free",
  },
  {
    id: "chat-calm",
    name: { en: "Calm me down", de: "Beruhige mich" },
    description: { en: "Immediate grounding & regulation support", de: "Sofortige Erdung & Beruhigung" },
    tier: "free",
  },
  {
    id: "journal-free",
    name: { en: "Free journaling", de: "Freies Tagebuch" },
    description: { en: "Write freely without prompts", de: "Frei schreiben ohne Vorgaben" },
    tier: "free",
  },
  {
    id: "mood-checkin",
    name: { en: "Mood check-ins", de: "Stimmungs-Check-ins" },
    description: { en: "Track how you're feeling", de: "Erfasse, wie du dich fühlst" },
    tier: "free",
  },
  {
    id: "toolbox-basic",
    name: { en: "Core exercises", de: "Kern-Übungen" },
    description: { en: "Breathing, grounding essentials", de: "Atmung, Erdungs-Grundlagen" },
    tier: "free",
  },
  {
    id: "safety",
    name: { en: "Crisis resources", de: "Krisenressourcen" },
    description: { en: "Always available safety support", de: "Immer verfügbare Krisenhilfe" },
    tier: "free",
  },

  // PREMIUM FEATURES - Deeper insight & long-term reflection
  {
    id: "chat-clarify",
    name: { en: "Clarify my thoughts", de: "Gedanken klären" },
    description: { en: "Guided reflection with follow-up questions", de: "Geführte Reflexion mit Rückfragen" },
    tier: "premium",
  },
  {
    id: "chat-patterns",
    name: { en: "Understand my patterns", de: "Meine Muster verstehen" },
    description: { en: "Light psychoeducation & self-understanding", de: "Leichte Psychoedukation & Selbstverständnis" },
    tier: "premium",
  },
  {
    id: "journal-guided",
    name: { en: "Guided prompts", de: "Geführte Impulse" },
    description: { en: "Thoughtful reflection questions", de: "Durchdachte Reflexionsfragen" },
    tier: "premium",
  },
  {
    id: "journal-ai",
    name: { en: "AI reflection", de: "KI-Reflexion" },
    description: { en: "Non-judgmental insights on your writing", de: "Nicht-wertende Einblicke zu deinem Schreiben" },
    tier: "premium",
  },
  {
    id: "weekly-recap",
    name: { en: "Weekly recap", de: "Wochenrückblick" },
    description: { en: "Patterns & themes over time", de: "Muster & Themen über Zeit" },
    tier: "premium",
  },
  {
    id: "mood-trends",
    name: { en: "Mood trends", de: "Stimmungstrends" },
    description: { en: "30 & 90 day emotional patterns", de: "30 & 90 Tage Emotionsmuster" },
    tier: "premium",
  },
  {
    id: "topics",
    name: { en: "Topic paths", de: "Themen-Pfade" },
    description: { en: "Structured exploration of life themes", de: "Strukturierte Erkundung von Lebensthemen" },
    tier: "premium",
  },
  {
    id: "toolbox-full",
    name: { en: "Full exercise library", de: "Volle Übungsbibliothek" },
    description: { en: "All cognitive & values exercises", de: "Alle kognitiven & Werte-Übungen" },
    tier: "premium",
  },
  {
    id: "session-summary",
    name: { en: "Session summaries", de: "Sitzungszusammenfassungen" },
    description: { en: "AI-generated chat recaps", de: "KI-generierte Chat-Zusammenfassungen" },
    tier: "premium",
  },
];

export const freeFeatures = features.filter((f) => f.tier === "free");
export const premiumFeatures = features.filter((f) => f.tier === "premium");

// Value proposition - human language
export const premiumValue = {
  en: {
    headline: "Go deeper with Premium",
    description:
      "Premium isn't about more features—it's about understanding yourself better over time. See emotional patterns, get thoughtful AI reflections on your writing, and explore structured paths through life's challenges. For those ready to move from venting to genuine self-insight.",
    cta: "Start your journey",
  },
  de: {
    headline: "Tiefer gehen mit Premium",
    description:
      "Premium bedeutet nicht mehr Features—es geht darum, dich über Zeit besser zu verstehen. Erkenne emotionale Muster, erhalte einfühlsame KI-Reflexionen zu deinem Schreiben, und erkunde strukturierte Pfade durch Lebensthemen. Für alle, die bereit sind, von Entlastung zu echter Selbsterkenntnis zu gehen.",
    cta: "Deine Reise beginnen",
  },
};

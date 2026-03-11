export interface CompanionArchetype {
  id: string;
  name: string;
  description: string;
  descriptionDe: string;
  personalityStyle: string;
  tone: string;
  appearancePrompt: string;
  emoji: string;
  defaultAvatar: string;
}

export const companionArchetypes: CompanionArchetype[] = [
  {
    id: "mira",
    name: "Mira",
    description: "Warm and empathetic — she listens deeply and holds space for your emotions.",
    descriptionDe: "Warm und empathisch — sie hört aufmerksam zu und gibt deinen Gefühlen Raum.",
    personalityStyle: "warm and empathetic",
    tone: "gentle",
    appearancePrompt: "A young woman with warm brown eyes, soft wavy brown hair, gentle smile, wearing a cozy earth-toned sweater",
    emoji: "🌸",
    defaultAvatar: "/companions/mira.png",
  },
  {
    id: "noah",
    name: "Noah",
    description: "Calm analytical thinker — he helps you see things from new angles.",
    descriptionDe: "Ruhiger analytischer Denker — er hilft dir, Dinge aus neuen Perspektiven zu sehen.",
    personalityStyle: "calm and analytical",
    tone: "neutral",
    appearancePrompt: "A calm man with short dark hair, kind thoughtful eyes behind thin-framed glasses, clean neutral clothing",
    emoji: "🧠",
    defaultAvatar: "/companions/noah.png",
  },
  {
    id: "elena",
    name: "Elena",
    description: "Philosophical and reflective — she explores the deeper meaning behind your thoughts.",
    descriptionDe: "Philosophisch und reflektierend — sie erforscht die tiefere Bedeutung hinter deinen Gedanken.",
    personalityStyle: "philosophical and reflective",
    tone: "gentle",
    appearancePrompt: "A thoughtful woman with dark hair pulled back, expressive dark eyes, wearing a simple elegant blouse, contemplative expression",
    emoji: "🌙",
    defaultAvatar: "/companions/elena.png",
  },
  {
    id: "kai",
    name: "Kai",
    description: "Grounded and direct — he keeps conversations focused and honest.",
    descriptionDe: "Geerdet und direkt — er hält Gespräche fokussiert und ehrlich.",
    personalityStyle: "grounded and direct",
    tone: "structured",
    appearancePrompt: "A sturdy man with short hair, warm tan skin, confident calm expression, wearing a simple henley shirt",
    emoji: "🪨",
    defaultAvatar: "/companions/kai.png",
  },
  {
    id: "lina",
    name: "Lina",
    description: "Gentle and patient — she never rushes and always makes you feel heard.",
    descriptionDe: "Sanft und geduldig — sie drängt nie und gibt dir immer das Gefühl, gehört zu werden.",
    personalityStyle: "gentle and patient",
    tone: "gentle",
    appearancePrompt: "A soft-featured woman with long light hair, gentle blue-green eyes, calm serene expression, wearing a flowing light-colored top",
    emoji: "🕊️",
    defaultAvatar: "/companions/lina.png",
  },
  {
    id: "theo",
    name: "Theo",
    description: "Mentor-like and wise — he offers perspective drawn from deep understanding.",
    descriptionDe: "Mentorenhaft und weise — er bietet Perspektiven aus tiefem Verständnis.",
    personalityStyle: "mentor-like and wise",
    tone: "structured",
    appearancePrompt: "A distinguished older man with grey-streaked hair, warm brown eyes, slight wise smile, wearing a casual collared shirt",
    emoji: "📚",
    defaultAvatar: "/companions/theo.png",
  },
  {
    id: "ava",
    name: "Ava",
    description: "Curious and explorative — she asks the questions that open new doors.",
    descriptionDe: "Neugierig und erforschend — sie stellt die Fragen, die neue Türen öffnen.",
    personalityStyle: "curious and explorative",
    tone: "neutral",
    appearancePrompt: "A bright-eyed young woman with curly auburn hair, freckles, an open curious expression, wearing a casual modern outfit",
    emoji: "✨",
    defaultAvatar: "/companions/ava.png",
  },
  {
    id: "jonas",
    name: "Jonas",
    description: "Structured and thoughtful — he helps you organize your inner world.",
    descriptionDe: "Strukturiert und durchdacht — er hilft dir, deine innere Welt zu ordnen.",
    personalityStyle: "structured and thoughtful",
    tone: "structured",
    appearancePrompt: "A composed man with neat dark hair, calm focused eyes, clean-shaven, wearing a minimalist crew-neck sweater",
    emoji: "🗂️",
    defaultAvatar: "/companions/jonas.png",
  },
  {
    id: "sofia",
    name: "Sofia",
    description: "Emotionally perceptive — she notices what you haven't said yet.",
    descriptionDe: "Emotional wahrnehmend — sie bemerkt, was du noch nicht gesagt hast.",
    personalityStyle: "emotionally perceptive",
    tone: "gentle",
    appearancePrompt: "A perceptive woman with medium-length dark hair, deep warm eyes, subtle knowing expression, wearing a soft muted-tone wrap",
    emoji: "💫",
    defaultAvatar: "/companions/sofia.png",
  },
  {
    id: "arin",
    name: "Arin",
    description: "Minimalist calm presence — they offer stillness and clarity.",
    descriptionDe: "Minimalistische ruhige Präsenz — Arin bietet Stille und Klarheit.",
    personalityStyle: "minimalist and calm",
    tone: "neutral",
    appearancePrompt: "An androgynous person with short natural hair, serene peaceful expression, minimal styling, wearing a simple neutral-toned turtleneck",
    emoji: "🍃",
    defaultAvatar: "/companions/arin.png",
  },
];

export function getArchetype(id: string): CompanionArchetype | undefined {
  return companionArchetypes.find((a) => a.id === id);
}

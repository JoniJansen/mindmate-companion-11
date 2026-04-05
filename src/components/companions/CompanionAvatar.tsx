import { motion } from "framer-motion";
import { type Companion } from "@/data/companions";

interface CompanionAvatarProps {
  companion: Companion;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { outer: "w-8 h-8",   text: "text-sm",  ring: "ring-1" },
  sm: { outer: "w-12 h-12", text: "text-lg",  ring: "ring-2" },
  md: { outer: "w-16 h-16", text: "text-2xl", ring: "ring-2" },
  lg: { outer: "w-20 h-20", text: "text-3xl", ring: "ring-2" },
  xl: { outer: "w-28 h-28", text: "text-5xl", ring: "ring-4" },
};

// Gradient backgrounds per companion color
const colorMap: Record<string, string> = {
  violet: "bg-gradient-to-br from-violet-400 to-purple-600",
  teal:   "bg-gradient-to-br from-teal-400 to-cyan-600",
  rose:   "bg-gradient-to-br from-rose-400 to-pink-600",
  amber:  "bg-gradient-to-br from-amber-400 to-orange-500",
  green:  "bg-gradient-to-br from-green-400 to-emerald-600",
  slate:  "bg-gradient-to-br from-slate-500 to-zinc-700",
  sky:    "bg-gradient-to-br from-sky-400 to-blue-600",
  orange: "bg-gradient-to-br from-orange-400 to-red-500",
  purple: "bg-gradient-to-br from-purple-400 to-fuchsia-600",
  yellow: "bg-gradient-to-br from-yellow-300 to-lime-500",
};

const ringColorMap: Record<string, string> = {
  violet: "ring-violet-300",
  teal:   "ring-teal-300",
  rose:   "ring-rose-300",
  amber:  "ring-amber-300",
  green:  "ring-green-300",
  slate:  "ring-slate-400",
  sky:    "ring-sky-300",
  orange: "ring-orange-300",
  purple: "ring-purple-300",
  yellow: "ring-yellow-300",
};

export function CompanionAvatar({
  companion,
  size = "md",
  animate = false,
  className = "",
}: CompanionAvatarProps) {
  const { outer, text, ring } = sizeMap[size];
  const bg = colorMap[companion.color] ?? "bg-gradient-to-br from-primary to-primary/70";
  const ringColor = ringColorMap[companion.color] ?? "ring-primary/40";

  return (
    <motion.div
      className={`${outer} rounded-full ${bg} ${ring} ${ringColor} flex items-center justify-center shadow-md select-none ${className}`}
      animate={animate ? { scale: [1, 1.04, 1] } : undefined}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className={`${text} leading-none`} role="img" aria-label={companion.name}>
        {companion.emoji}
      </span>
    </motion.div>
  );
}

/** Compact badge used inside chat header and cards */
export function CompanionBadge({
  companion,
  className = "",
}: {
  companion: Companion;
  className?: string;
}) {
  const bg = colorMap[companion.color] ?? "bg-gradient-to-br from-primary to-primary/70";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white ${bg} ${className}`}
    >
      <span>{companion.emoji}</span>
      {companion.name}
    </span>
  );
}

/** Full companion selection card for onboarding / settings */
export function CompanionCard({
  companion,
  selected,
  onSelect,
  language = "en",
}: {
  companion: Companion;
  selected: boolean;
  onSelect: () => void;
  language?: "en" | "de";
}) {
  const bg = colorMap[companion.color] ?? "bg-gradient-to-br from-primary to-primary/70";
  const ringColor = ringColorMap[companion.color] ?? "ring-primary/40";

  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 focus:outline-none ${
        selected
          ? `border-transparent ring-2 ${ringColor} bg-card shadow-md`
          : "border-border/40 bg-card/60 hover:bg-card hover:border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`w-12 h-12 shrink-0 rounded-full ${bg} flex items-center justify-center shadow-sm ring-2 ${ringColor}`}
        >
          <span className="text-2xl leading-none">{companion.emoji}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-foreground">{companion.name}</span>
            <span className="text-xs text-muted-foreground">{companion.pronouns}</span>
            {selected && (
              <span className="ml-auto text-xs font-medium text-primary">✓</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
            {companion.approach[language]}
          </p>
          <p className="text-sm text-foreground/80 leading-snug line-clamp-2">
            {companion.specialty[language]}
          </p>
        </div>
      </div>

      {/* Tagline */}
      <p className="mt-2.5 text-xs italic text-muted-foreground pl-15">
        "{companion.tagline[language]}"
      </p>
    </motion.button>
  );
}

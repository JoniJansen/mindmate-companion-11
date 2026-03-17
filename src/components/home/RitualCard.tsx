import { motion } from "framer-motion";
import { Sun, Moon, Heart, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useCompanion } from "@/hooks/useCompanion";

type RitualType = "morning" | "evening" | null;

function getRitualType(): RitualType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 20 || hour < 2) return "evening";
  return null;
}

export function RitualCard() {
  const ritualType = getRitualType();
  const { language } = useTranslation();
  const { companion } = useCompanion();
  const navigate = useNavigate();
  const companionName = companion?.name || "Soulvay";

  // Don't show during afternoon/daytime
  if (!ritualType) return null;

  // Check if already dismissed today
  const dismissKey = `soulvay-ritual-${ritualType}-${new Date().toDateString()}`;
  const wasDismissed = localStorage.getItem(dismissKey) === "1";
  if (wasDismissed) return null;

  const config = ritualType === "morning"
    ? {
        icon: Sun,
        prompt: language === "de"
          ? "Wie möchtest du heute in den Tag gehen?"
          : "How would you like to start your day?",
        sub: language === "de"
          ? "Kurzes Morgen-Ritual"
          : "Quick morning ritual",
        actions: [
          {
            label: language === "de" ? "Stimmung einchecken" : "Check in mood",
            onClick: () => navigate("/mood"),
          },
          {
            label: language === "de" ? `Mit ${companionName} reden` : `Talk to ${companionName}`,
            onClick: () => {
              const msg = language === "de"
                ? "Guten Morgen. Wie fühle ich mich heute?"
                : "Good morning. How am I feeling today?";
              localStorage.setItem("soulvay-initial-message", msg);
              navigate("/chat");
            },
          },
        ],
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      }
    : {
        icon: Moon,
        prompt: language === "de"
          ? "Wie war dein Tag wirklich?"
          : "How was your day, really?",
        sub: language === "de"
          ? "Abend-Reflexion"
          : "Evening reflection",
        actions: [
          {
            label: language === "de" ? "Tag reflektieren" : "Reflect on the day",
            onClick: () => {
              const msg = language === "de"
                ? "Ich möchte meinen Tag kurz sortieren."
                : "I'd like to briefly sort through my day.";
              localStorage.setItem("soulvay-initial-message", msg);
              navigate("/chat");
            },
          },
          {
            label: language === "de" ? "Tagebuch schreiben" : "Write in journal",
            onClick: () => navigate("/journal"),
          },
        ],
        color: "text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
      };

  const Icon = config.icon;

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, "1");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="mb-6"
    >
      <div className={`rounded-2xl border ${config.border} ${config.bg} p-4`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4.5 h-4.5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">{config.sub}</p>
            <p className="text-sm font-medium text-foreground leading-snug">{config.prompt}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {config.actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => { handleDismiss(); action.onClick(); }}
                  className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 rounded-xl px-3 py-1.5 transition-colors flex items-center gap-1"
                >
                  {action.label}
                  <ChevronRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

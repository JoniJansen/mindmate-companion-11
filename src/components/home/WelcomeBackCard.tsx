import { motion } from "framer-motion";
import { Heart, X } from "lucide-react";

interface WelcomeBackCardProps {
  message: string;
  onDismiss: () => void;
}

export function WelcomeBackCard({ message, onDismiss }: WelcomeBackCardProps) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className="mb-6"
    >
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 relative">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed pr-4">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}

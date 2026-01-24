import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

interface PremiumGateProps {
  isPremium: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  featureName?: string;
  showLock?: boolean;
}

export function PremiumGate({ 
  isPremium, 
  children, 
  fallback,
  featureName,
  showLock = true 
}: PremiumGateProps) {
  const { language } = useTranslation();

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showLock) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-1.5 text-muted-foreground text-xs"
    >
      <Lock className="w-3 h-3" />
      <span>
        {featureName 
          ? (language === "de" ? `${featureName} – Plus` : `${featureName} – Plus`)
          : (language === "de" ? "Plus-Funktion" : "Plus feature")}
      </span>
    </motion.div>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useTranslation } from "@/hooks/useTranslation";

export function OfflineBanner() {
  const { isOnline, retry } = useNetworkStatus();
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-destructive/10 border-b border-destructive/20 overflow-hidden z-50"
        >
          <div className="flex items-center justify-between px-4 py-2.5 max-w-lg mx-auto">
            <div className="flex items-center gap-2 text-sm">
              <WifiOff className="w-4 h-4 text-destructive" />
              <span className="text-foreground font-medium">{t("common.offline")}</span>
              <span className="text-muted-foreground">{t("common.offlineBody")}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={retry} className="shrink-0 gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              {t("common.retry")}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

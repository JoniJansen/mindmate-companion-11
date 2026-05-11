import { useState } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";

export function SettingsAIConsentSection() {
  const { aiConsentGiven, giveAIConsent, revokeAIConsent } = useAuth();
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      giveAIConsent();
    } else {
      setConfirmRevoke(true);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
      <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Datenschutz & KI</h2>
      <CalmCard>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground">Einwilligung zur KI-Datenverarbeitung</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Erlaubt Soulvay, deine Texte an Google Gemini zu senden
              </p>
            </div>
          </div>
          <Switch checked={aiConsentGiven} onCheckedChange={handleToggle} className="mt-1 shrink-0" />
        </div>
      </CalmCard>

      <AlertDialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Einwilligung widerrufen?</AlertDialogTitle>
            <AlertDialogDescription>
              Soulvay kann ohne Einwilligung keine KI-Gespräche führen. Du kannst die Einwilligung
              jederzeit wieder erteilen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                revokeAIConsent();
                setConfirmRevoke(false);
              }}
            >
              Widerrufen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

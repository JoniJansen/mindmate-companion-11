import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check, CreditCard, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";
import { usePremium } from "@/hooks/usePremium";
import { useToast } from "@/hooks/use-toast";
import { isNativeApp } from "@/lib/nativeDetect";
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

interface SubscriptionSectionProps {
  onUpgradeClick?: () => void;
}

export function SubscriptionSection({ onUpgradeClick }: SubscriptionSectionProps) {
  const { language } = useTranslation();
  const { toast } = useToast();
  const {
    isPremium,
    planType,
    cancelAtPeriodEnd,
    currentPeriodEnd,
    subscriptionStatus,
    cancelSubscription,
    reactivateSubscription,
    openBillingPortal,
  } = usePremium();

  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "de" ? "de-DE" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await cancelSubscription();
      toast({
        title: language === "de" ? "Abo gekündigt" : "Subscription canceled",
        description: language === "de" 
          ? `Dein Abo läuft noch bis zum ${formatDate(currentPeriodEnd)}. Bis dahin behältst du alle Plus-Funktionen.` 
          : `Your subscription remains active until ${formatDate(currentPeriodEnd)}.`,
      });
    } catch (error) {
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowCancelDialog(false);
    }
  };

  const handleReactivate = async () => {
    setIsLoading(true);
    try {
      await reactivateSubscription();
      toast({
        title: language === "de" ? "Abo reaktiviert" : "Subscription reactivated",
        description: language === "de" 
          ? "Dein Abo bleibt aktiv. Schön, dass du bleibst!" 
          : "Your subscription will continue.",
      });
    } catch (error) {
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading(true);
    try {
      await openBillingPortal();
    } catch (error) {
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (isPremium) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            {language === "de" ? "Abonnement" : "Subscription"}
          </h2>
          <CalmCard variant="elevated">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">Soulvay Plus</p>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {planType === "yearly" 
                        ? (language === "de" ? "Jährlich" : "Yearly") 
                        : (language === "de" ? "Monatlich" : "Monthly")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {cancelAtPeriodEnd 
                      ? (language === "de" 
                          ? `Endet am ${formatDate(currentPeriodEnd)}` 
                          : `Ends on ${formatDate(currentPeriodEnd)}`)
                      : (language === "de" 
                          ? `Nächste Zahlung: ${formatDate(currentPeriodEnd)}` 
                          : `Next payment: ${formatDate(currentPeriodEnd)}`)}
                  </p>
                </div>
              </div>

              {/* Active subscription info */}
              {cancelAtPeriodEnd && (
                <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                  <p className="text-sm text-foreground">
                    {language === "de" 
                      ? `Dein Abo wurde gekündigt. Du behältst alle Plus-Funktionen bis zum ${formatDate(currentPeriodEnd)}.`
                      : `Your subscription has been canceled. You'll keep Plus features until ${formatDate(currentPeriodEnd)}.`}
                  </p>
                </div>
              )}

              {/* Action buttons - only show for real Stripe subscriptions, not review/manual accounts */}
              {planType && planType !== "review" && planType !== "revenuecat" && (
                <div className="space-y-2 pt-1">
                  {/* Billing portal - hide on native iOS/Android (Apple Guideline 3.1.1) */}
                  {!(window as any).Capacitor && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleManageBilling}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      {language === "de" ? "Zahlung verwalten" : "Manage billing"}
                    </Button>
                  )}

                  {cancelAtPeriodEnd ? (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleReactivate}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      {language === "de" ? "Abo reaktivieren" : "Reactivate subscription"}
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowCancelDialog(true)}
                      disabled={isLoading}
                      className="w-full text-muted-foreground hover:text-destructive"
                    >
                      {language === "de" ? "Abo kündigen" : "Cancel subscription"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CalmCard>
        </motion.div>

        {/* Cancel confirmation dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === "de" ? "Abo wirklich kündigen?" : "Cancel subscription?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  {language === "de" 
                    ? `Dein Abo wird zum Ende der aktuellen Laufzeit am ${formatDate(currentPeriodEnd)} beendet. Bis dahin behältst du alle Plus-Funktionen.`
                    : `Your subscription will end on ${formatDate(currentPeriodEnd)}. You'll keep all Plus features until then.`}
                </p>
                <p className="font-medium">
                  {language === "de"
                    ? "Du verlierst dann: Unbegrenzte Gespräche, Sprachfunktion, Wochenrückblicke und mehr."
                    : "You'll lose: Unlimited conversations, voice features, weekly recaps and more."}
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {language === "de" ? "Abo behalten" : "Keep subscription"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {language === "de" ? "Jetzt kündigen" : "Cancel now"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Free tier - show upgrade prompt
  const features = [
    { en: "Unlimited conversations", de: "Unbegrenzte Gespräche" },
    { en: "Voice conversations", de: "Sprachgespräche" },
    { en: "Weekly recaps & insights", de: "Wochenrückblicke & Einblicke" },
    { en: "Guided journaling", de: "Geführtes Tagebuch" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
        {language === "de" ? "Abonnement" : "Subscription"}
      </h2>
      <CalmCard variant="elevated" className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Soulvay Plus</p>
              <p className="text-sm text-muted-foreground">
                {language === "de" 
                  ? "Entfalte dein volles Potenzial" 
                  : "Unlock your full potential"}
              </p>
            </div>
          </div>

          <ul className="space-y-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                <Check className="w-4 h-4 text-primary shrink-0" />
                {language === "de" ? feature.de : feature.en}
              </li>
            ))}
          </ul>

          <Button 
            onClick={onUpgradeClick} 
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {language === "de" ? "Plus entdecken" : "Explore Plus"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {language === "de" 
              ? "Ab €9,99/Monat • Jederzeit kündbar" 
              : "From €9.99/month • Cancel anytime"}
          </p>
        </div>
      </CalmCard>
    </motion.div>
  );
}
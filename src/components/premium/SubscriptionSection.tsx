import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check, CreditCard, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";
import { usePremium } from "@/hooks/usePremium";
import { useToast } from "@/hooks/use-toast";

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

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await cancelSubscription();
      toast({
        title: language === "de" ? "Abo gekündigt" : "Subscription canceled",
        description: language === "de" 
          ? "Dein Abo wird am Ende der Laufzeit beendet." 
          : "Your subscription will end at the end of the billing period.",
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

  const handleReactivate = async () => {
    setIsLoading(true);
    try {
      await reactivateSubscription();
      toast({
        title: language === "de" ? "Abo reaktiviert" : "Subscription reactivated",
        description: language === "de" 
          ? "Dein Abo bleibt aktiv." 
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "de" ? "de-DE" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isPremium) {
    return (
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

            <div className="flex flex-wrap gap-2">
              {/* Hide Stripe billing portal on native iOS/Android - Apple Guideline 3.1.1 */}
              {!(window as any).Capacitor && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleManageBilling}
                  disabled={isLoading}
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
                >
                  {language === "de" ? "Abo reaktivieren" : "Reactivate"}
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="text-muted-foreground"
                >
                  {language === "de" ? "Kündigen" : "Cancel"}
                </Button>
              )}
            </div>

            {cancelAtPeriodEnd && (
              <p className="text-xs text-muted-foreground">
                {language === "de" 
                  ? "Du behältst Plus-Funktionen bis zum Ende der Laufzeit." 
                  : "You'll keep Plus features until the end of your billing period."}
              </p>
            )}
          </div>
        </CalmCard>
      </motion.div>
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

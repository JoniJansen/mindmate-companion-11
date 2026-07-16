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
  const { t } = useTranslation();
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
  const isNative = useMemo(() => isNativeApp(), []);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(t("subscription.locale"), {
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
        title: t("subscription.canceledToast.title"),
        description: `${t("subscription.canceledToast.descPrefix")}${formatDate(currentPeriodEnd)}${t("subscription.canceledToast.descSuffix")}`,
      });
    } catch (error) {
      toast({
        title: t("common.error"),
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
        title: t("subscription.reactivatedToast.title"),
        description: t("subscription.reactivatedToast.desc"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
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
        title: t("common.error"),
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
            {t("subscription.heading")}
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
                        ? t("subscription.planYearly")
                        : t("subscription.planMonthly")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {cancelAtPeriodEnd
                      ? `${t("subscription.endsOnPrefix")}${formatDate(currentPeriodEnd)}`
                      : `${t("subscription.nextPaymentPrefix")}${formatDate(currentPeriodEnd)}`}
                  </p>
                </div>
              </div>

              {/* Active subscription info */}
              {cancelAtPeriodEnd && (
                <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                  <p className="text-sm text-foreground">
                    {`${t("subscription.canceledInfoPrefix")}${formatDate(currentPeriodEnd)}${t("subscription.canceledInfoSuffix")}`}
                  </p>
                </div>
              )}

              {/* Action buttons - only show for real Stripe subscriptions, not review/manual accounts */}
              {planType && planType !== "review" && planType !== "revenuecat" && (
                <div className="space-y-2 pt-1">
                  {/* Billing portal - hide on native builds (Apple Guideline 3.1.1) */}
                  {!isNative && (
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
                      {t("subscription.manageBilling")}
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
                      {t("subscription.reactivate")}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={isLoading}
                      className="w-full text-muted-foreground hover:text-destructive"
                    >
                      {t("subscription.cancel")}
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
                {t("subscription.cancelDialog.title")}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  {`${t("subscription.cancelDialog.descPrefix")}${formatDate(currentPeriodEnd)}${t("subscription.cancelDialog.descSuffix")}`}
                </p>
                <p className="font-medium">
                  {t("subscription.cancelDialog.willLose")}
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("subscription.cancelDialog.keep")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {t("subscription.cancelDialog.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Free tier - show upgrade prompt
  const features = [
    t("subscription.feat.unlimited"),
    t("subscription.feat.voice"),
    t("subscription.feat.recaps"),
    t("subscription.feat.journal"),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
        {t("subscription.heading")}
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
                {t("subscription.unlockPotential")}
              </p>
            </div>
          </div>

          <ul className="space-y-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                <Check className="w-4 h-4 text-primary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <Button
            onClick={onUpgradeClick}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t("subscription.explorePlus")}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t("subscription.footnote")}
          </p>
        </div>
      </CalmCard>
    </motion.div>
  );
}
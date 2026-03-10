import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Check, 
  ArrowLeft, 
  Volume2, 
  Brain, 
  Heart, 
  Calendar,
  MessageSquare,
  Loader2,
  RotateCcw
} from "lucide-react";
import { FeatureMatrix } from "@/components/premium/FeatureMatrix";
import { ProgressUnlock } from "@/components/premium/ProgressUnlock";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";
import { usePremium } from "@/hooks/usePremium";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { REVENUECAT_PRODUCTS } from "@/hooks/useRevenueCat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StandalonePage } from "@/components/layout/StandalonePage";

export default function Upgrade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { 
    isPremium, 
    checkSubscriptionStatus,
    isRevenueCatAvailable,
    offerings,
    purchasePackage,
    restorePurchases,
  } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedWithdrawal, setAcceptedWithdrawal] = useState(false);
  const { user } = useAuth();
  const [userStats, setUserStats] = useState({ chatSessions: 0, journalEntries: 0, moodCheckins: 0, exercisesCompleted: 0 });

  // Load user stats for progress display
  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      try {
        const [journalRes, moodRes, activityRes] = await Promise.all([
          supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('mood_checkins').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('user_activity_log').select('activity_type').eq('user_id', user.id),
        ]);
        const activities = activityRes.data || [];
        setUserStats({
          journalEntries: journalRes.count || 0,
          moodCheckins: moodRes.count || 0,
          chatSessions: activities.filter(a => a.activity_type === 'chat_session').length,
          exercisesCompleted: activities.filter(a => a.activity_type === 'exercise_completed').length,
        });
      } catch { /* silent */ }
    };
    loadStats();
  }, [user]);

  // Handle success from previous Stripe flow (legacy)
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: t("upgrade.welcomePlus"),
        description: t("upgrade.upgradeSuccess"),
      });
      checkSubscriptionStatus();
      navigate("/settings", { replace: true });
    } else if (searchParams.get("canceled") === "true") {
      toast({
        title: t("upgrade.checkoutCanceled"),
        description: t("upgrade.upgradeAnytime"),
      });
    }
  }, [searchParams, navigate, toast, t, checkSubscriptionStatus]);

  // Redirect if already premium
  useEffect(() => {
    if (isPremium) {
      navigate("/settings");
    }
  }, [isPremium, navigate]);

  const handleUpgrade = async () => {
    if (!acceptedTerms || !acceptedWithdrawal) {
      toast({
        title: t("upgrade.consentRequired"),
        description: t("upgrade.acceptTermsFirst"),
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      if (isRevenueCatAvailable && offerings) {
        const packageId = selectedPlan === "yearly" ? "yearly" : "monthly";
        const packageToPurchase = offerings.availablePackages.find(
          (pkg) => pkg.identifier === packageId || 
                   pkg.product.identifier === (selectedPlan === "yearly" 
                     ? REVENUECAT_PRODUCTS.YEARLY 
                     : REVENUECAT_PRODUCTS.MONTHLY)
        );
        
        if (!packageToPurchase) {
          const fallbackPackage = offerings.availablePackages.find(
            (pkg) => pkg.product.identifier.includes(selectedPlan)
          );
          
          if (fallbackPackage) {
            const success = await purchasePackage(fallbackPackage);
            if (success) {
              await checkSubscriptionStatus();
              navigate("/settings", { replace: true });
            }
          } else {
            throw new Error(t("upgrade.productNotFound"));
          }
        } else {
          const success = await purchasePackage(packageToPurchase);
          if (success) {
            await checkSubscriptionStatus();
            navigate("/settings", { replace: true });
          }
        }
      } else {
        // Web: use Stripe Checkout
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: {
            userId: user?.id || crypto.randomUUID(),
            planType: selectedPlan,
            successUrl: `${window.location.origin}/settings?success=true`,
            cancelUrl: `${window.location.origin}/upgrade?canceled=true`,
          },
        });

        if (error) throw new Error(error.message);
        if (data?.url) {
          window.location.href = data.url;
        }
      }
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

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    try {
      const success = await restorePurchases();
      if (success) {
        await checkSubscriptionStatus();
        navigate("/settings", { replace: true });
      }
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

  // Get prices from RevenueCat offerings if available
  const getPrice = (planType: "monthly" | "yearly") => {
    if (offerings) {
      const pkg = offerings.availablePackages.find(
        (p) => p.identifier === planType || 
               p.product.identifier.includes(planType)
      );
      if (pkg) {
        return pkg.product.priceString;
      }
    }
    return planType === "yearly" ? "€79,00" : "€9,99";
  };

  const plans = [
    {
      id: "monthly" as const,
      name: t("upgrade.monthly"),
      price: getPrice("monthly"),
      interval: t("upgrade.perMonth"),
      trial: t("upgrade.trial"),
    },
    {
      id: "yearly" as const,
      name: t("upgrade.yearly"),
      price: getPrice("yearly"),
      interval: t("upgrade.perYear"),
      savings: t("upgrade.savings"),
      monthlyEquivalent: "€6,58",
    },
  ];

  const features = [
    { icon: MessageSquare, titleKey: "upgrade.feat.unlimitedTitle", descKey: "upgrade.feat.unlimitedDesc" },
    { icon: Volume2, titleKey: "upgrade.feat.voiceTitle", descKey: "upgrade.feat.voiceDesc" },
    { icon: Brain, titleKey: "upgrade.feat.patternsTitle", descKey: "upgrade.feat.patternsDesc" },
    { icon: Calendar, titleKey: "upgrade.feat.recapsTitle", descKey: "upgrade.feat.recapsDesc" },
    { icon: Heart, titleKey: "upgrade.feat.journalingTitle", descKey: "upgrade.feat.journalingDesc" },
  ];

  return (
    <StandalonePage>
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 py-4 max-w-lg mx-auto">
           <button
            onClick={() => navigate("/settings", { replace: true })}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">{t("common.back")}</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Soulvay Plus</h1>
            <p className="text-muted-foreground mt-2">
              {t("upgrade.heroSubtitle")}
            </p>
          </div>
        </motion.div>

        {/* Plan Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                selectedPlan === plan.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {plan.savings && (
                <span className="absolute -top-2 left-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {plan.savings}
                </span>
              )}
              {plan.trial && (
                <span className="absolute -top-2 left-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {plan.trial}
                </span>
              )}
              <p className="font-medium text-foreground">{plan.name}</p>
              <div className="mt-1">
                <span className="text-xl font-semibold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.interval}</span>
              </div>
              {plan.monthlyEquivalent && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("upgrade.only")} {plan.monthlyEquivalent}{t("upgrade.perMo")}
                </p>
              )}
              {selectedPlan === plan.id && (
                <div className="absolute top-3 right-3">
                  <Check className="w-5 h-5 text-primary" />
                </div>
              )}
            </button>
          ))}
        </motion.div>

        {/* Features - compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          {features.map((feature, i) => (
            <CalmCard key={i} variant="default" className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">
                    {t(feature.titleKey)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t(feature.descKey)}
                  </p>
                </div>
              </div>
            </CalmCard>
          ))}
        </motion.div>

        {/* Progress Unlock */}
        <ProgressUnlock stats={userStats} />

        {/* Feature Comparison Matrix */}
        <FeatureMatrix />

        {/* Legal Consent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 bg-muted/30 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              {t("upgrade.acceptTermsLabel")}{" "}
              <Link to="/terms" className="text-primary hover:underline">{t("upgrade.termsLink")}</Link>
              {" "}{t("upgrade.andThe")}{" "}
              <Link to="/privacy" className="text-primary hover:underline">{t("upgrade.privacyLink")}</Link>.
            </label>
          </div>
          
          <div className="flex items-start gap-3">
            <Checkbox
              id="withdrawal"
              checked={acceptedWithdrawal}
              onCheckedChange={(checked) => setAcceptedWithdrawal(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="withdrawal" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              {t("upgrade.withdrawalAgree")}{" "}
              <Link to="/cancellation" className="text-primary hover:underline">{t("upgrade.withdrawalRight")}</Link>
              {" "}{t("upgrade.withdrawalEnd")}
            </label>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <Button
            onClick={handleUpgrade}
            disabled={isLoading || !acceptedTerms || !acceptedWithdrawal}
            className="w-full h-12 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {t("upgrade.loading")}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {selectedPlan === "yearly" ? t("upgrade.startYearly") : t("upgrade.startMonthly")}
              </>
            )}
          </Button>

          {/* Restore Purchases - always visible on iOS */}
          {isRevenueCatAvailable && (
            <Button
              onClick={handleRestorePurchases}
              disabled={isLoading}
              variant="outline"
              className="w-full h-10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t("upgrade.restorePurchases")}
            </Button>
          )}

          {/* Subscription Info - Required by Apple Guideline 3.1.2 */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <h4 className="font-medium text-sm text-foreground">
              {t("upgrade.subInfo")}
            </h4>
            <div className="text-xs text-muted-foreground space-y-1.5">
              <p>
                <strong>{t("upgrade.subTitle")}</strong> Soulvay Plus
              </p>
              <p>
                <strong>{t("upgrade.subDuration")}</strong>{" "}
                {selectedPlan === "yearly" ? t("upgrade.yearlyDuration") : t("upgrade.monthlyDuration")}
              </p>
              <p>
                <strong>{t("upgrade.subPrice")}</strong>{" "}
                {getPrice(selectedPlan)}{selectedPlan === "yearly" ? t("upgrade.perYear") : t("upgrade.perMonth")}
                {selectedPlan === "monthly" && t("upgrade.afterTrial")}
              </p>
              <p className="pt-1">
                {isRevenueCatAvailable ? t("upgrade.applePaymentInfo") : t("upgrade.stripePaymentInfo")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link to="/terms" className="text-xs text-primary hover:underline">
                {t("upgrade.termsOfUse")}
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/privacy" className="text-xs text-primary hover:underline">
                {t("upgrade.privacyPolicy")}
              </Link>
              <span className="text-muted-foreground">•</span>
              <a 
                href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-primary hover:underline"
              >
                Apple EULA
              </a>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              {isRevenueCatAvailable ? t("upgrade.secureApple") : t("upgrade.secureStripe")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("upgrade.cancelAnytime")}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
    </StandalonePage>
  );
}

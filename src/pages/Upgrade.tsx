import { useState, useEffect, useRef } from "react";
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
  RotateCcw,
  User
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
import { findPackageForPlan } from "@/hooks/useRevenueCat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StandalonePage } from "@/components/layout/StandalonePage";
import { analytics } from "@/hooks/useAnalytics";
import { isIOSApp } from "@/lib/platformSeparation";

export default function Upgrade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { 
    isPremium, 
    checkSubscriptionStatus,
    isRevenueCatAvailable,
    isRevenueCatUnavailable,
    initializeRevenueCat,
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

  // Lazy-initialize RevenueCat ONLY when the user actually opens the paywall.
  // (Auto-init at app launch was crashing iPad Air M3 in Build 43.)
  useEffect(() => {
    if (isIOSApp() && !isRevenueCatAvailable && !isRevenueCatUnavailable) {
      initializeRevenueCat().catch((e) => {
        if (import.meta.env.DEV) console.warn("[Upgrade] RC lazy init failed:", e);
      });
    }
  }, [isRevenueCatAvailable, isRevenueCatUnavailable, initializeRevenueCat]);

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

  // Track paywall view once
  const paywallTrackedRef = useRef(false);
  useEffect(() => {
    if (!paywallTrackedRef.current) {
      paywallTrackedRef.current = true;
      analytics.track("paywall_viewed", { source: "upgrade_page" }, "paywall_viewed");
      analytics.track("premium_cta_viewed", { source: "upgrade_page" }, "premium_cta_upgrade");
    }
  }, []);

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
      // ── iOS: RevenueCat / StoreKit ONLY ────────────────────────────
      // Apple Guideline 3.1.1: on iOS, digital subscriptions MUST use
      // Apple In-App Purchase. Never fall back to Stripe on iOS.
      if (isIOSApp()) {
        if (!isRevenueCatAvailable) {
          toast({
            title: t("common.error"),
            description: language === "de"
              ? "Der Kauf ist gerade nicht verfügbar. Bitte schließe die App und versuche es erneut."
              : "Purchases are currently unavailable. Please close the app and try again.",
            variant: "destructive",
          });
          return;
        }

        if (!offerings || !offerings.availablePackages?.length) {
          toast({
            title: t("common.error"),
            description: language === "de"
              ? "Produkte werden geladen. Bitte versuche es in einem Moment erneut."
              : "Products are loading. Please try again in a moment.",
            variant: "destructive",
          });
          return;
        }

        const packageToPurchase = findPackageForPlan(offerings, selectedPlan);
        if (!packageToPurchase) {
          if (import.meta.env.DEV) {
            console.error("[Upgrade] No package found for plan:", selectedPlan, "offerings:", offerings);
          }
          toast({
            title: t("common.error"),
            description: language === "de"
              ? "Abo-Produkt nicht verfügbar. Bitte kontaktiere den Support."
              : "Subscription product unavailable. Please contact support.",
            variant: "destructive",
          });
          return;
        }

        const success = await purchasePackage(packageToPurchase);
        if (success) {
          await checkSubscriptionStatus();
          navigate("/settings", { replace: true });
        }
        return;
      }

      // ── Web only: Stripe Checkout ──────────────────────────────────
      // Never reached on iOS (see isIOSApp guard above).
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
    { icon: User, titleKey: "upgrade.feat.faceToFaceTitle", descKey: "upgrade.feat.faceToFaceDesc" },
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
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">{t("common.back")}</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-8 max-w-lg mx-auto space-y-8">
        {/* Emotional Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Soulvay Plus
            </h1>
            <p className="text-muted-foreground mt-3 leading-relaxed max-w-xs mx-auto">
              {language === "de"
                ? "Stell dir vor, dein Begleiter kennt dich wirklich. Erinnert sich. Hört dir zu — in deiner Stimme."
                : "Imagine your companion truly knows you. Remembers. Listens — in your voice."}
            </p>
          </div>
        </motion.div>

        {/* What it feels like */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {[
            { icon: User, text: language === "de" ? "Sprich persönlich mit deinem Begleiter — Face-to-Face" : "Speak personally with your companion — Face-to-Face" },
            { icon: MessageSquare, text: language === "de" ? "Unbegrenzte Gespräche, so oft du möchtest" : "Unlimited conversations, whenever you need" },
            { icon: Brain, text: language === "de" ? "Dein Begleiter erkennt Muster und wächst mit dir" : "Your companion recognizes patterns and grows with you" },
            { icon: Calendar, text: language === "de" ? "Wöchentliche Einblicke in deine emotionale Reise" : "Weekly insights into your emotional journey" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-foreground">{item.text}</p>
            </div>
          ))}
        </motion.div>

        {/* Plan Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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

        {/* Simple Free vs Plus comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border/50 overflow-hidden"
        >
          <div className="grid grid-cols-3 bg-muted/30 text-xs font-medium text-muted-foreground p-3">
            <span></span>
            <span className="text-center">Free</span>
            <span className="text-center text-primary">Plus</span>
          </div>
          {[
            { label: language === "de" ? "Nachrichten" : "Messages", free: language === "de" ? "15/Tag" : "15/day", plus: "∞" },
            { label: "Face-to-Face", free: "1×", plus: "∞" },
            { label: language === "de" ? "Erinnerung" : "Memory", free: language === "de" ? "7 Tage" : "7 days", plus: "∞" },
            { label: language === "de" ? "Wochenrückblick" : "Weekly recap", free: "—", plus: "✓" },
            { label: language === "de" ? "Muster" : "Patterns", free: "—", plus: "✓" },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-3 text-sm p-3 border-t border-border/30">
              <span className="text-foreground">{row.label}</span>
              <span className="text-center text-muted-foreground">{row.free}</span>
              <span className="text-center text-primary font-medium">{row.plus}</span>
            </div>
          ))}
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex justify-center gap-6 text-xs text-muted-foreground"
        >
          <span>{language === "de" ? "🔒 Deine Daten bleiben privat" : "🔒 Your data stays private"}</span>
          <span>{language === "de" ? "💚 Jederzeit kündbar" : "💚 Cancel anytime"}</span>
        </motion.div>

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
              {isIOSApp() ? (
                <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t("upgrade.termsLink")}</a>
              ) : (
                <Link to="/terms" className="text-primary hover:underline">{t("upgrade.termsLink")}</Link>
              )}
              {" "}{t("upgrade.andThe")}{" "}
              {isIOSApp() ? (
                <a href="https://soulvay.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t("upgrade.privacyLink")}</a>
              ) : (
                <Link to="/privacy" className="text-primary hover:underline">{t("upgrade.privacyLink")}</Link>
              )}.
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
          transition={{ delay: 0.35 }}
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
                {t("upgrade.startSubscription")}
              </>
            )}
          </Button>

          {/* Restore Purchases */}
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

          {/* Subscription Info */}
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
                {isIOSApp() ? t("upgrade.applePaymentInfo") : t("upgrade.stripePaymentInfo")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                {t("upgrade.termsOfUse")}
              </a>
              <span className="text-muted-foreground">•</span>
              <a href="https://soulvay.com/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                {t("upgrade.privacyPolicy")}
              </a>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              {isIOSApp() ? t("upgrade.secureApple") : t("upgrade.secureStripe")}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
    </StandalonePage>
  );
}

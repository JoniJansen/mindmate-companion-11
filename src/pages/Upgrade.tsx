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
  ExternalLink
} from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";
import { usePremium } from "@/hooks/usePremium";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export default function Upgrade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useTranslation();
  const { toast } = useToast();
  const { isPremium, createCheckoutSession, checkSubscriptionStatus } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedWithdrawal, setAcceptedWithdrawal] = useState(false);

  // Handle success/cancel from Stripe
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: language === "de" ? "Willkommen bei MindMate Plus!" : "Welcome to MindMate Plus!",
        description: language === "de" 
          ? "Dein Upgrade war erfolgreich." 
          : "Your upgrade was successful.",
      });
      checkSubscriptionStatus();
      navigate("/settings", { replace: true });
    } else if (searchParams.get("canceled") === "true") {
      toast({
        title: language === "de" ? "Checkout abgebrochen" : "Checkout canceled",
        description: language === "de" 
          ? "Du kannst jederzeit upgraden." 
          : "You can upgrade anytime.",
      });
    }
  }, [searchParams, navigate, toast, language, checkSubscriptionStatus]);

  // Redirect if already premium
  useEffect(() => {
    if (isPremium) {
      navigate("/settings");
    }
  }, [isPremium, navigate]);

  const handleUpgrade = async () => {
    if (!acceptedTerms || !acceptedWithdrawal) {
      toast({
        title: language === "de" ? "Zustimmung erforderlich" : "Consent required",
        description: language === "de" 
          ? "Bitte akzeptiere die AGB und die Widerrufsbelehrung." 
          : "Please accept the terms and the withdrawal policy.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await createCheckoutSession(selectedPlan);
    } catch (error) {
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const plans = [
    {
      id: "monthly" as const,
      name: language === "de" ? "Monatlich" : "Monthly",
      price: "€9,99",
      interval: language === "de" ? "/Monat" : "/month",
      trial: language === "de" ? "7 Tage kostenlos testen" : "7-day free trial",
    },
    {
      id: "yearly" as const,
      name: language === "de" ? "Jährlich" : "Yearly",
      price: "€79",
      interval: language === "de" ? "/Jahr" : "/year",
      savings: language === "de" ? "2 Monate gratis" : "2 months free",
      monthlyEquivalent: "€6,58",
    },
  ];

  const features = [
    {
      icon: MessageSquare,
      title: { en: "Unlimited conversations", de: "Unbegrenzte Gespräche" },
      description: { en: "Chat as much as you need, whenever you need", de: "Chatte so viel du willst, wann immer du willst" },
    },
    {
      icon: Volume2,
      title: { en: "Voice conversations", de: "Sprachgespräche" },
      description: { en: "Speak naturally with warm AI voice responses", de: "Sprich natürlich mit warmen KI-Sprachantworten" },
    },
    {
      icon: Brain,
      title: { en: "Pattern insights", de: "Musteranalysen" },
      description: { en: "Discover trends in your emotional journey", de: "Entdecke Trends in deiner emotionalen Reise" },
    },
    {
      icon: Calendar,
      title: { en: "Weekly recaps", de: "Wochenrückblicke" },
      description: { en: "Thoughtful summaries of your week", de: "Nachdenkliche Zusammenfassungen deiner Woche" },
    },
    {
      icon: Heart,
      title: { en: "Guided journaling", de: "Geführtes Tagebuch" },
      description: { en: "AI-powered prompts for deeper reflection", de: "KI-gestützte Impulse für tiefere Reflexion" },
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 py-4 max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">{language === "de" ? "Zurück" : "Back"}</span>
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
            <h1 className="text-2xl font-semibold text-foreground">MindMate Plus</h1>
            <p className="text-muted-foreground mt-2">
              {language === "de" 
                ? "Ein ruhiger Raum für deinen Geist" 
                : "A quiet space for your mind"}
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
                <span className="absolute -top-2 left-3 bg-emerald-500 dark:bg-emerald-600 text-primary-foreground text-xs px-2 py-0.5 rounded-full">
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
                  {language === "de" ? "nur" : "only"} {plan.monthlyEquivalent}{language === "de" ? "/Monat" : "/mo"}
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

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {features.map((feature, i) => (
            <CalmCard key={i} variant="default" className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {language === "de" ? feature.title.de : feature.title.en}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === "de" ? feature.description.de : feature.description.en}
                  </p>
                </div>
              </div>
            </CalmCard>
          ))}
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
              {language === "de" ? (
                <>
                  Ich akzeptiere die{" "}
                  <Link to="/terms" className="text-primary hover:underline">AGB</Link>
                  {" "}und die{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link>.
                </>
              ) : (
                <>
                  I accept the{" "}
                  <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                  {" "}and the{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                </>
              )}
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
              {language === "de" ? (
                <>
                  Ich stimme ausdrücklich zu, dass die Dienstleistung sofort beginnt, und nehme zur Kenntnis, 
                  dass ich mein{" "}
                  <Link to="/cancellation" className="text-primary hover:underline">Widerrufsrecht</Link>
                  {" "}verliere, sobald der digitale Inhalt vollständig bereitgestellt wurde.
                </>
              ) : (
                <>
                  I expressly agree that the service begins immediately and acknowledge that I lose my{" "}
                  <Link to="/cancellation" className="text-primary hover:underline">right of withdrawal</Link>
                  {" "}once the digital content has been fully provided.
                </>
              )}
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
                {language === "de" ? "Wird geladen..." : "Loading..."}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {language === "de" 
                  ? `Mit ${selectedPlan === "yearly" ? "Jahresabo" : "Monatsabo"} starten` 
                  : `Start with ${selectedPlan === "yearly" ? "yearly" : "monthly"} plan`}
              </>
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              {language === "de" 
                ? "Sichere Zahlung über Stripe" 
                : "Secure payment via Stripe"}
            </p>
            <p className="text-xs text-muted-foreground">
              {language === "de" 
                ? "Jederzeit kündbar • Keine versteckten Kosten" 
                : "Cancel anytime • No hidden fees"}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { 
  CheckCircle, 
  MessageSquare, 
  Book, 
  Smile, 
  Wrench, 
  Settings, 
  CreditCard,
  ArrowRight,
  Shield,
  Star
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { CalmCard } from "@/components/shared/CalmCard";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  route?: string;
}

export default function ReviewInstructions() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  const steps: Step[] = [
    {
      icon: <Shield className="w-6 h-6 text-green-500" />,
      title: "1. Login Complete",
      description: "You are logged in with the review account. Premium features require the normal subscription flow.",
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-primary" />,
      title: "2. Test Chat Feature",
      description: "Send messages to the AI companion. Try different chat modes: Talk, Calm, Clarify, Patterns.",
      route: "/chat",
    },
    {
      icon: <Book className="w-6 h-6 text-amber-500" />,
      title: "3. Test Journal",
      description: "Create journal entries, view past entries, and see AI reflections.",
      route: "/journal",
    },
    {
      icon: <Smile className="w-6 h-6 text-pink-500" />,
      title: "4. Test Mood Tracking",
      description: "Log your mood, add feelings, and view the mood chart over time.",
      route: "/mood",
    },
    {
      icon: <Wrench className="w-6 h-6 text-cyan-500" />,
      title: "5. Test Toolbox",
      description: "Explore breathing exercises, grounding techniques, and other wellness tools.",
      route: "/toolbox",
    },
    {
      icon: <Settings className="w-6 h-6 text-gray-500" />,
      title: "6. Test Settings",
      description: "Customize language, theme, voice settings, and view account information.",
      route: "/settings",
    },
    {
      icon: <CreditCard className="w-6 h-6 text-violet-500" />,
      title: "7. Premium Features",
      description: "Open Soulvay Plus to test the StoreKit in-app purchase flow after the free tier limits.",
      route: "/upgrade",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader 
        title="Review Instructions" 
        subtitle="Apple App Store Review Guide"
        showBack 
        backTo="/chat"
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 py-6 pb-32 max-w-lg mx-auto space-y-6">
          {/* Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CalmCard variant="elevated" className="bg-green-500/10 border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Star className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Review Account Active</h3>
                  <p className="text-sm text-muted-foreground">
                    Premium access follows the normal subscription and StoreKit purchase flow
                  </p>
                </div>
              </div>
            </CalmCard>
          </motion.div>

          {/* Steps */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1">
              Testing Checklist
            </h2>
            
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CalmCard 
                  variant="elevated"
                  className={step.route ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                  onClick={() => step.route && navigate(step.route)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">{step.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    </div>
                    {step.route && (
                      <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />
                    )}
                  </div>
                </CalmCard>
              </motion.div>
            ))}
          </div>

          {/* App Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <CalmCard variant="elevated">
              <h3 className="font-medium text-foreground mb-3">App Information</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>App Name:</strong> Soulvay</p>
                <p><strong>Purpose:</strong> Mental wellness companion with AI chat, journaling, mood tracking, and self-care tools</p>
                <p><strong>Target Audience:</strong> Adults seeking mental wellness support</p>
                <p><strong>Subscription:</strong> Soulvay Plus (€9.99/month or €79/year)</p>
              </div>
            </CalmCard>
          </motion.div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={() => navigate("/chat")}
              className="w-full"
              size="lg"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Start Testing Chat
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate("/review-status")}
              className="w-full"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              View System Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

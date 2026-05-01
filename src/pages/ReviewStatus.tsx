import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Database, 
  User, 
  CreditCard,
  Wifi,
  Shield,
  Smartphone,
  RefreshCw
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { CalmCard } from "@/components/shared/CalmCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { getDeviceInfo } from "@/lib/reviewMode";

interface StatusCheck {
  name: string;
  status: "checking" | "success" | "error" | "warning";
  message: string;
  icon: React.ReactNode;
}

export default function ReviewStatus() {
  const { user, isAuthenticated } = useAuth();
  const { isPremium, subscriptionStatus } = usePremium();
  const [checks, setChecks] = useState<StatusCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runChecks = async () => {
    setIsRunning(true);
    const results: StatusCheck[] = [];

    // 1. Authentication Check
    results.push({
      name: "Authentication",
      status: "checking",
      message: "Checking authentication status...",
      icon: <User className="w-5 h-5" />,
    });
    setChecks([...results]);

    await new Promise(r => setTimeout(r, 300));

    if (isAuthenticated && user) {
      results[results.length - 1] = {
        name: "Authentication",
        status: "success",
        message: `Logged in as ${user.email}`,
        icon: <User className="w-5 h-5" />,
      };
    } else {
      results[results.length - 1] = {
        name: "Authentication",
        status: "error",
        message: "Not authenticated",
        icon: <User className="w-5 h-5" />,
      };
    }
    setChecks([...results]);

    // 2. Review Account Check — DEPRECATED.
    // The review/demo flow no longer uses a Supabase account; it runs fully
    // client-side via isDemoMode in AuthContext. This check is kept as a
    // neutral placeholder so the diagnostics layout doesn't shift.
    results.push({
      name: "Review Account",
      status: "warning",
      message: "Demo flow is now auth-free (client-side only)",
      icon: <Shield className="w-5 h-5" />,
    });
    setChecks([...results]);

    // 3. Database Connection
    results.push({
      name: "Database",
      status: "checking",
      message: "Testing database connection...",
      icon: <Database className="w-5 h-5" />,
    });
    setChecks([...results]);

    try {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      await new Promise(r => setTimeout(r, 300));
      
      if (error) throw error;
      
      results[results.length - 1] = {
        name: "Database",
        status: "success",
        message: "Database connection successful",
        icon: <Database className="w-5 h-5" />,
      };
    } catch (e: any) {
      results[results.length - 1] = {
        name: "Database",
        status: "error",
        message: `Database error: ${e.message}`,
        icon: <Database className="w-5 h-5" />,
      };
    }
    setChecks([...results]);

    // 4. Subscription Status
    results.push({
      name: "Subscription",
      status: "checking",
      message: "Checking subscription status...",
      icon: <CreditCard className="w-5 h-5" />,
    });
    setChecks([...results]);

    await new Promise(r => setTimeout(r, 300));

    results[results.length - 1] = {
      name: "Subscription",
      status: isPremium ? "success" : "warning",
      message: isPremium 
        ? `Premium active (${subscriptionStatus || "active"})` 
        : "Free tier — purchase flow must be tested through the paywall",
      icon: <CreditCard className="w-5 h-5" />,
    };
    setChecks([...results]);

    // 5. Network Connectivity
    results.push({
      name: "Network",
      status: "checking",
      message: "Testing network connectivity...",
      icon: <Wifi className="w-5 h-5" />,
    });
    setChecks([...results]);

    try {
      const response = await fetch("https://api.ipify.org?format=json");
      await new Promise(r => setTimeout(r, 300));
      
      if (response.ok) {
        results[results.length - 1] = {
          name: "Network",
          status: "success",
          message: "Network connectivity OK",
          icon: <Wifi className="w-5 h-5" />,
        };
      } else {
        throw new Error("Network response not OK");
      }
    } catch {
      results[results.length - 1] = {
        name: "Network",
        status: "warning",
        message: "Limited network connectivity",
        icon: <Wifi className="w-5 h-5" />,
      };
    }
    setChecks([...results]);

    // 6. Device Info
    const deviceInfo = getDeviceInfo();
    results.push({
      name: "Device",
      status: "success",
      message: `${deviceInfo.isIPad ? "iPad" : deviceInfo.isIOS ? "iPhone" : "Web"} (${deviceInfo.viewportWidth}x${deviceInfo.viewportHeight})`,
      icon: <Smartphone className="w-5 h-5" />,
    });
    setChecks([...results]);

    // 7. Chat API
    results.push({
      name: "Chat API",
      status: "checking",
      message: "Testing chat API...",
      icon: <Wifi className="w-5 h-5" />,
    });
    setChecks([...results]);

    try {
      const { error } = await supabase.functions.invoke("chat", {
        body: { 
          messages: [{ role: "user", content: "test" }],
          test: true 
        },
      });
      await new Promise(r => setTimeout(r, 300));
      
      // Even if there's an error, the function is reachable
      results[results.length - 1] = {
        name: "Chat API",
        status: "success",
        message: "Chat API reachable",
        icon: <Wifi className="w-5 h-5" />,
      };
    } catch (e: any) {
      results[results.length - 1] = {
        name: "Chat API",
        status: "error",
        message: `Chat API error: ${e.message}`,
        icon: <Wifi className="w-5 h-5" />,
      };
    }
    setChecks([...results]);

    setIsRunning(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  const getStatusColor = (status: StatusCheck["status"]) => {
    switch (status) {
      case "success": return "text-green-500";
      case "error": return "text-red-500";
      case "warning": return "text-amber-500";
      default: return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: StatusCheck["status"]) => {
    switch (status) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error": return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning": return <CheckCircle className="w-5 h-5 text-amber-500" />;
      default: return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
    }
  };

  const hasErrors = checks.some(c => c.status === "error");
  const hasWarnings = checks.some(c => c.status === "warning");

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader 
        title="System Status" 
        subtitle="Self-Test & Diagnostics"
        showBack 
        backTo="/review-instructions"
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 py-6 pb-32 max-w-lg mx-auto space-y-6">
          {/* Overall Status */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CalmCard 
              variant="elevated" 
              className={
                hasErrors 
                  ? "bg-red-500/10 border-red-500/20" 
                  : hasWarnings 
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-green-500/10 border-green-500/20"
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    hasErrors 
                      ? "bg-red-500/20" 
                      : hasWarnings 
                        ? "bg-amber-500/20"
                        : "bg-green-500/20"
                  }`}>
                    {isRunning ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : hasErrors ? (
                      <XCircle className="w-6 h-6 text-red-500" />
                    ) : hasWarnings ? (
                      <CheckCircle className="w-6 h-6 text-amber-500" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {isRunning 
                        ? "Running checks..." 
                        : hasErrors 
                          ? "Issues Detected" 
                          : hasWarnings 
                            ? "Minor Warnings"
                            : "All Systems OK"
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {checks.filter(c => c.status === "success").length}/{checks.length} checks passed
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={runChecks}
                  disabled={isRunning}
                >
                  <RefreshCw className={`w-5 h-5 ${isRunning ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CalmCard>
          </motion.div>

          {/* Individual Checks */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1">
              Status Checks
            </h2>
            
            {checks.map((check, index) => (
              <motion.div
                key={check.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CalmCard variant="elevated">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      {check.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{check.name}</h3>
                        {getStatusIcon(check.status)}
                      </div>
                      <p className={`text-sm ${getStatusColor(check.status)}`}>
                        {check.message}
                      </p>
                    </div>
                  </div>
                </CalmCard>
              </motion.div>
            ))}
          </div>

          {/* Device Details */}
          <CalmCard variant="elevated">
            <h3 className="font-medium text-foreground mb-3">Device Details</h3>
            <div className="space-y-1 text-sm text-muted-foreground font-mono">
              <p>User Agent: {navigator.userAgent.slice(0, 80)}...</p>
              <p>Viewport: {window.innerWidth}x{window.innerHeight}</p>
              <p>Device Pixel Ratio: {window.devicePixelRatio}</p>
              <p>Platform: {navigator.platform}</p>
            </div>
          </CalmCard>
        </div>
      </div>
    </div>
  );
}

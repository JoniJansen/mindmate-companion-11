import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, Loader2, Eye, EyeOff, Sun, Moon, Shield, Star } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/hooks/useTheme";
import logoImage from "@/assets/logo.png";
import { activateReviewMode, isReviewAccount } from "@/lib/reviewMode";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "@/lib/nativeDetect";

type AuthMode = "login" | "signup" | "forgot-password";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, signUp, resetPassword, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, language } = useTranslation();
  const { isDark, setMode: setThemeMode } = useTheme();

  // Check if coming from onboarding
  const fromOnboarding = searchParams.get("from") === "onboarding";
  
  const [authMode, setAuthMode] = useState<AuthMode>(fromOnboarding ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const isNative = useMemo(() => isNativeApp(), []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const redirect = searchParams.get("redirect") || "/";
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, searchParams]);

  // Review/Demo Login - credentials fetched server-side
  const handleReviewLogin = async () => {
    setIsReviewLoading(true);
    
    try {
      // Call edge function to get review session (credentials never leave server)
      const { data, error } = await supabase.functions.invoke("review-login", {
        body: { platform: "apple" },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Review login failed");
      }

      // Set the session from the server response
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) throw sessionError;

      activateReviewMode();
      
      toast({
        title: "Review Login Successful",
        description: "Welcome! All premium features are unlocked.",
      });
      
      navigate("/review-instructions", { replace: true });
    } catch (error: any) {
      if (import.meta.env.DEV) console.error("[Review Login] Error:", error);
      
      toast({
        title: "Review Login Failed",
        description: error.message || "Please contact support: service@soulvay.com",
        variant: "destructive",
      });
    } finally {
      setIsReviewLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      if (authMode === "login") {
        await signIn(normalizedEmail, password);
        
        if (isReviewAccount(normalizedEmail)) {
          activateReviewMode();
          toast({
            title: "Review Mode Active",
            description: "All premium features are unlocked.",
          });
          navigate("/review-instructions", { replace: true });
          return;
        }
        
        toast({
          title: t("auth.welcomeBackToast"),
          description: t("auth.nowLoggedIn"),
        });
      } else if (authMode === "signup") {
        const result = await signUp(normalizedEmail, password, displayName);
        
        // With auto-confirm enabled, the user is immediately signed in
        // The auth state change listener will handle navigation
        if (result?.session) {
          toast({
            title: t("auth.accountCreated"),
            description: t("auth.welcomeToSoulvay"),
          });
          // Navigate to home - user is already authenticated
          navigate("/home", { replace: true });
          return;
        }
        
        toast({
          title: t("auth.accountCreated"),
          description: t("auth.welcomeToSoulvay"),
        });
      } else if (authMode === "forgot-password") {
        await resetPassword(normalizedEmail);
        toast({
          title: t("auth.emailSent"),
          description: t("auth.checkInbox"),
        });
        setAuthMode("login");
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error("[Auth] Error:", error);
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const modeTexts = {
    login: {
      title: t("auth.welcomeBack"),
      subtitle: t("auth.signInContinue"),
      button: t("auth.signIn"),
      switchText: t("auth.noAccount"),
      switchAction: t("auth.signUp"),
    },
    signup: {
      title: t("auth.createAccount"),
      subtitle: fromOnboarding ? t("auth.keepSafe") : t("auth.startJourney"),
      button: t("auth.createAccountBtn"),
      switchText: t("auth.hasAccount"),
      switchAction: t("auth.signIn"),
    },
    "forgot-password": {
      title: t("auth.resetPassword"),
      subtitle: t("auth.resetSubtitle"),
      button: t("auth.sendResetLink"),
      switchText: t("auth.rememberPassword"),
      switchAction: t("auth.signIn"),
    },
  };

  const currentTexts = modeTexts[authMode];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        {fromOnboarding ? (
          <div className="w-10" />
        ) : (
          <button
            onClick={() => navigate("/landing")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">{t("auth.back")}</span>
          </button>
        )}
        
        <button
          onClick={() => setThemeMode(isDark ? "light" : "dark")}
          className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <motion.div
            key={isDark ? "moon" : "sun"}
            initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.div>
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm md:max-w-md space-y-8"
        >
          {/* Logo & Title */}
          <div className="text-center space-y-4">
            <motion.div 
              className="relative mx-auto w-24 h-24"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-xl" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-xl shadow-primary/15 ring-1 ring-primary/10">
                <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center">
                  <img 
                    src={logoImage} 
                    alt="Soulvay Assistant" 
                    className="w-16 h-16 object-cover rounded-full"
                  />
                </div>
              </div>
            </motion.div>
            
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                {currentTexts.title}
              </h1>
              <p className="text-muted-foreground text-sm">
                {currentTexts.subtitle}
              </p>
              
              {fromOnboarding && authMode === "signup" && (
                <div className="flex items-center justify-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {t("auth.secureEncrypted")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  {t("auth.yourName")}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder={t("auth.yourNamePlaceholder")}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            {authMode !== "forgot-password" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    {t("auth.password")}
                  </Label>
                  {authMode === "login" && (
                    <button
                      type="button"
                      onClick={() => setAuthMode("forgot-password")}
                      className="text-xs text-primary hover:underline"
                    >
                      {t("auth.forgot")}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                currentTexts.button
              )}
            </Button>
          </form>

          {/* Switch Mode */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {currentTexts.switchText}{" "}
            </span>
            <button
              onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
              className="text-primary hover:underline font-medium"
            >
              {currentTexts.switchAction}
            </button>
          </div>

          {/* Review/Demo Login Button - only visible in dev or for review URLs */}
          {authMode === "login" && (import.meta.env.DEV || window.location.hostname.includes('lovable') || isNative) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="pt-4 border-t border-border/50"
            >
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                onClick={handleReviewLogin}
                disabled={isReviewLoading}
              >
                {isReviewLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Star className="w-5 h-5 mr-2" />
                )}
                {t("auth.reviewLogin")}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                {t("auth.reviewPurpose")}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
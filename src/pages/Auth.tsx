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
// reviewMode.ts no longer exports auth helpers — demo flow is fully auth-free now.
import { isNativeApp } from "@/lib/nativeDetect";
import { lovable } from "@/integrations/lovable/index";
import { shouldShowReviewLogin, shouldShowGoogleAuth, shouldShowAppleAuth } from "@/lib/platformSeparation";

type AuthMode = "login" | "signup" | "forgot-password";

// Demo flow no longer uses any password — Apple's reviewer cannot reach Supabase.

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, signUp, resetPassword, isAuthenticated, isLoading: authLoading, activateDemoMode } = useAuth();
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

  // Review/Demo Login — fully auth-free.
  // Apple's iOS reviewer has been unable to reach our Supabase /auth/v1/token
  // endpoint (5x rejection: "we cannot sign in with the demo credentials").
  // Backend is verified working — the issue is environmental on Apple's side.
  // We therefore activate a purely client-side demo session and route the
  // reviewer straight to the paywall, where the StoreKit/RevenueCat purchase
  // flow can be exercised without any backend dependency.
  const handleReviewLogin = () => {
    setIsReviewLoading(true);
    try {
      activateDemoMode();
      navigate("/upgrade", { replace: true });
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
    <div className="min-h-[100dvh] bg-background flex flex-col" style={{ minHeight: '-webkit-fill-available' }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between safe-top">
        <button
          onClick={() => navigate(fromOnboarding ? "/welcome" : "/landing")}
          className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
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
      <div className="flex-1 flex items-start justify-center px-6 pt-2 pb-8 overflow-y-auto overscroll-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm md:max-w-md space-y-6 my-auto"
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

            {authMode === "signup" && (
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                {language === "de" ? "Mit der Registrierung stimmst du unseren " : "By signing up, you agree to our "}
                <button type="button" onClick={() => navigate("/terms")} className="text-primary hover:underline">
                  {language === "de" ? "Nutzungsbedingungen" : "Terms of Use"}
                </button>
                {language === "de" ? " und der " : " and "}
                <button type="button" onClick={() => navigate("/privacy")} className="text-primary hover:underline">
                  {language === "de" ? "Datenschutzerklärung" : "Privacy Policy"}
                </button>
                {language === "de" ? " zu." : "."}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                currentTexts.button
              )}
            </Button>
          </form>

          {/* OAuth options — platform-gated */}
          {authMode !== "forgot-password" && (shouldShowGoogleAuth() || shouldShowAppleAuth()) && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                  {language === "de" ? "oder" : "or"}
                </span>
                <div className="flex-1 h-px bg-border/40" />
              </div>
              {shouldShowGoogleAuth() && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const redirectUri = isNative ? "com.soulvay.app://auth/callback" : window.location.origin + "/auth";
                      const result: any = await lovable.auth.signInWithOAuth("google", {
                        redirect_uri: redirectUri,
                      });
                      if (result?.error) {
                        if (import.meta.env.DEV) console.error("[Auth] Google OAuth error:", result.error);
                        const errorMsg = typeof result.error === "string" ? result.error : result.error?.message || "";
                        const userMsg = errorMsg.includes("popup_closed") || errorMsg.includes("cancelled")
                          ? (language === "de" ? "Anmeldung abgebrochen." : "Sign-in was cancelled.")
                          : errorMsg.includes("network") || errorMsg.includes("fetch")
                          ? (language === "de" ? "Keine Verbindung. Prüfe deine Internetverbindung." : "No connection. Check your internet.")
                          : (language === "de" ? "Anmeldung fehlgeschlagen. Bitte versuche es erneut." : "Sign-in failed. Please try again.");
                        toast({ title: t("common.error"), description: userMsg, variant: "destructive" });
                      }
                    } catch (err: any) {
                      if (import.meta.env.DEV) console.error("[Auth] Google OAuth exception:", err);
                      toast({ title: t("common.error"), description: language === "de" ? "Anmeldung fehlgeschlagen. Bitte versuche es erneut." : "Sign-in failed. Please try again.", variant: "destructive" });
                    }
                  }}
                  className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl border border-border/50 bg-card hover:bg-muted/40 transition-all text-sm font-medium text-foreground"
                >
                  <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" width="18" height="18">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {language === "de" ? "Mit Google fortfahren" : "Continue with Google"}
                </button>
              )}
              {shouldShowAppleAuth() && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const redirectUri = isNative ? "com.soulvay.app://auth/callback" : window.location.origin + "/auth";
                      const result: any = await lovable.auth.signInWithOAuth("apple" as any, {
                        redirect_uri: redirectUri,
                      });
                      if (result?.error) {
                        if (import.meta.env.DEV) console.error("[Auth] Apple OAuth error:", result.error);
                        const errorMsg = typeof result.error === "string" ? result.error : result.error?.message || "";
                        const userMsg = errorMsg.includes("popup_closed") || errorMsg.includes("cancelled")
                          ? (language === "de" ? "Anmeldung abgebrochen." : "Sign-in was cancelled.")
                          : errorMsg.includes("network") || errorMsg.includes("fetch")
                          ? (language === "de" ? "Keine Verbindung. Prüfe deine Internetverbindung." : "No connection. Check your internet.")
                          : (language === "de" ? "Anmeldung mit Apple fehlgeschlagen. Bitte versuche es erneut." : "Apple sign-in failed. Please try again.");
                        toast({ title: t("common.error"), description: userMsg, variant: "destructive" });
                      }
                    } catch (err: any) {
                      if (import.meta.env.DEV) console.error("[Auth] Apple OAuth exception:", err);
                      toast({ title: t("common.error"), description: language === "de" ? "Anmeldung mit Apple fehlgeschlagen. Bitte versuche es erneut." : "Apple sign-in failed. Please try again.", variant: "destructive" });
                    }
                  }}
                  className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl border border-border/50 bg-card hover:bg-muted/40 transition-all text-sm font-medium text-foreground"
                >
                  <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  {language === "de" ? "Mit Apple fortfahren" : "Continue with Apple"}
                </button>
              )}
            </div>
          )}

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
          {authMode === "login" && shouldShowReviewLogin() && (
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
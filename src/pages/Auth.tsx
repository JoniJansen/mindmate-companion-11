import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

type AuthMode = "login" | "signup" | "forgot-password";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, signUp, resetPassword, isAuthenticated, isLoading: authLoading } = useAuth();
  const { language } = useTranslation();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const redirect = searchParams.get("redirect") || "/";
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        await signIn(email, password);
        toast({
          title: language === "de" ? "Willkommen zurück!" : "Welcome back!",
          description: language === "de" ? "Du bist jetzt eingeloggt." : "You are now logged in.",
        });
      } else if (mode === "signup") {
        await signUp(email, password, displayName);
        toast({
          title: language === "de" ? "Konto erstellt!" : "Account created!",
          description: language === "de" 
            ? "Willkommen bei MindMate!" 
            : "Welcome to MindMate!",
        });
      } else if (mode === "forgot-password") {
        await resetPassword(email);
        toast({
          title: language === "de" ? "E-Mail gesendet" : "Email sent",
          description: language === "de" 
            ? "Überprüfe dein Postfach für den Link zum Zurücksetzen." 
            : "Check your inbox for the reset link.",
        });
        setMode("login");
      }
    } catch (error: any) {
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const texts = {
    login: {
      title: { en: "Welcome back", de: "Willkommen zurück" },
      subtitle: { en: "Sign in to continue your journey", de: "Melde dich an, um fortzufahren" },
      button: { en: "Sign in", de: "Anmelden" },
      switch: { en: "Don't have an account?", de: "Noch kein Konto?" },
      switchAction: { en: "Sign up", de: "Registrieren" },
    },
    signup: {
      title: { en: "Create account", de: "Konto erstellen" },
      subtitle: { en: "Start your mental wellness journey", de: "Starte deine Reise zu mehr Wohlbefinden" },
      button: { en: "Create account", de: "Konto erstellen" },
      switch: { en: "Already have an account?", de: "Bereits ein Konto?" },
      switchAction: { en: "Sign in", de: "Anmelden" },
    },
    "forgot-password": {
      title: { en: "Reset password", de: "Passwort zurücksetzen" },
      subtitle: { en: "We'll send you a reset link", de: "Wir senden dir einen Reset-Link" },
      button: { en: "Send reset link", de: "Link senden" },
      switch: { en: "Remember your password?", de: "Passwort doch bekannt?" },
      switchAction: { en: "Sign in", de: "Anmelden" },
    },
  };

  const t = texts[mode];

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
      <div className="p-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">{language === "de" ? "Zurück" : "Back"}</span>
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Logo & Title */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <img src="/logo.png" alt="MindMate" className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              {language === "de" ? t.title.de : t.title.en}
            </h1>
            <p className="text-muted-foreground">
              {language === "de" ? t.subtitle.de : t.subtitle.en}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  {language === "de" ? "Name (optional)" : "Name (optional)"}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder={language === "de" ? "Dein Name" : "Your name"}
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

            {mode !== "forgot-password" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    {language === "de" ? "Passwort" : "Password"}
                  </Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot-password")}
                      className="text-xs text-primary hover:underline"
                    >
                      {language === "de" ? "Vergessen?" : "Forgot?"}
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
                language === "de" ? t.button.de : t.button.en
              )}
            </Button>
          </form>

          {/* Switch Mode */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {language === "de" ? t.switch.de : t.switch.en}{" "}
            </span>
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-primary hover:underline font-medium"
            >
              {language === "de" ? t.switchAction.de : t.switchAction.en}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

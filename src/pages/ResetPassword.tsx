import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const isDE = language === "de";

  // Check for recovery session from URL hash
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (type === "recovery" && accessToken) {
      // Set the session from recovery tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "",
      }).then(({ error }) => {
        if (error) {
          console.error("Recovery session error:", error);
          setIsValidSession(false);
        } else {
          setIsValidSession(true);
        }
        setIsChecking(false);
      });
    } else {
      // Check if already logged in (e.g. via PKCE flow)
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsValidSession(!!session);
        setIsChecking(false);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: isDE ? "Passwort zu kurz" : "Password too short",
        description: isDE ? "Mindestens 6 Zeichen erforderlich." : "At least 6 characters required.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: isDE ? "Passwörter stimmen nicht überein" : "Passwords don't match",
        description: isDE ? "Bitte überprüfe deine Eingabe." : "Please check your input.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(password);
      setIsSuccess(true);
      toast({
        title: isDE ? "Passwort geändert" : "Password updated",
        description: isDE ? "Du kannst dich jetzt mit deinem neuen Passwort anmelden." : "You can now sign in with your new password.",
      });
      setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch (error: any) {
      toast({
        title: isDE ? "Fehler" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-6">
          <h1 className="text-xl font-semibold text-foreground">
            {isDE ? "Link abgelaufen" : "Link expired"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isDE
              ? "Dieser Link ist nicht mehr gültig. Bitte fordere einen neuen Link an."
              : "This link is no longer valid. Please request a new one."}
          </p>
          <Button onClick={() => navigate("/auth")} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isDE ? "Zurück zum Login" : "Back to login"}
          </Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {isDE ? "Passwort geändert!" : "Password updated!"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isDE ? "Du wirst weitergeleitet..." : "Redirecting..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isDE ? "Neues Passwort setzen" : "Set new password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isDE ? "Gib dein neues Passwort ein." : "Enter your new password."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">
              {isDE ? "Neues Passwort" : "New password"}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {isDE ? "Passwort bestätigen" : "Confirm password"}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isDE ? "Passwort ändern" : "Update password"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

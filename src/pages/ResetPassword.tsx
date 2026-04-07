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
  const { t } = useTranslation();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check for recovery session from URL hash
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (type === "recovery" && accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "",
      }).then(({ error }) => {
        if (error) {
          if (import.meta.env.DEV) console.error("Recovery session error:", error);
          setIsValidSession(false);
        } else {
          setIsValidSession(true);
        }
        setIsChecking(false);
      });
    } else {
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
        title: t("resetPassword.tooShort"),
        description: t("resetPassword.minChars"),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t("resetPassword.mismatch"),
        description: t("resetPassword.checkInput"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(password);
      setIsSuccess(true);
      toast({
        title: t("resetPassword.success"),
        description: t("resetPassword.successDesc"),
      });
      setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch (error: any) {
      const rawMsg = error.message || "";
      const isDE = language === "de";
      const mappedMsg = rawMsg.includes("same_password")
        ? (isDE ? "Das neue Passwort muss sich vom alten unterscheiden." : "New password must be different from the old one.")
        : (isDE ? "Etwas hat nicht geklappt. Bitte versuche es nochmal." : "Something went wrong. Please try again.");
      toast({
        title: t("common.error"),
        description: mappedMsg,
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
            {t("resetPassword.linkExpired")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("resetPassword.linkExpiredDesc")}
          </p>
          <Button onClick={() => navigate("/auth")} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("resetPassword.backToLogin")}
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
            {t("resetPassword.successTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("resetPassword.redirecting")}
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
            {t("resetPassword.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("resetPassword.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">
              {t("resetPassword.newPassword")}
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
              {t("resetPassword.confirmPassword")}
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
              t("resetPassword.submit")
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

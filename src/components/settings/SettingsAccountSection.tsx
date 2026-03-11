import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AccountSettings } from "@/components/settings/AccountSettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface Props {
  language: "en" | "de";
}

export function SettingsAccountSection({ language }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast({ title: t("settings.loggedOut") });
      navigate("/auth", { replace: true });
    } catch (error: any) {
      toast({ title: t("settings.logoutError"), description: error.message, variant: "destructive" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
      <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t("settings.account")}</h2>
      <AccountSettings language={language} />
      <div className="mt-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <CalmCard variant="default" className="cursor-pointer hover:shadow-card transition-shadow border-destructive/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-destructive">{t("settings.logOut")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings.endSession")}</p>
                  </div>
                </div>
              </div>
            </CalmCard>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("settings.logOutConfirm")}</AlertDialogTitle>
              <AlertDialogDescription>{t("settings.logOutDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {isLoggingOut ? t("settings.loggingOut") : t("settings.logOut")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { Heart, Shield, HelpCircle, Download, RotateCcw, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";

interface Props {
  isAdmin: boolean;
}

export function SettingsSupportSection({ isAdmin }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRestartTour = () => {
    localStorage.removeItem("soulvay_tour_completed");
    localStorage.removeItem("soulvay_tour_auto_triggered");
    localStorage.removeItem("soulvay_tab_hints_seen");
    // Also clear legacy keys
    localStorage.removeItem("mindmate_tour_completed");
    localStorage.removeItem("mindmate_tour_auto_triggered");
    localStorage.removeItem("mindmate_tab_hints_seen");
    toast({ title: t("settings.tourReset"), description: t("settings.tourResetDesc") });
    navigate("/chat");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t("settings.support")}</h2>
      <div className="space-y-3">
        <CalmCard variant="default" className="cursor-pointer hover:shadow-card transition-shadow" onClick={() => navigate("/safety")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t("settings.supportResources")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.crisisAlways")}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CalmCard>

        <CalmCard variant="default" className="cursor-pointer hover:shadow-card transition-shadow" onClick={() => navigate("/privacy")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t("settings.privacyData")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.manageInfo")}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CalmCard>

        <CalmCard variant="default" className="cursor-pointer hover:shadow-card transition-shadow" onClick={() => navigate("/faq")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t("settings.helpSupport")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.faqContact")}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CalmCard>

        {!(window as any).Capacitor && (
          <CalmCard variant="default" className="cursor-pointer hover:shadow-card transition-shadow" onClick={() => navigate("/install")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("settings.installApp")}</p>
                  <p className="text-sm text-muted-foreground">{t("settings.addToHome")}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CalmCard>
        )}

        <CalmCard variant="default" className="cursor-pointer hover:shadow-card transition-shadow" onClick={handleRestartTour}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t("settings.restartTour")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.repeatIntro")}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CalmCard>

        {isAdmin && (
          <CalmCard variant="default" className="cursor-pointer hover:shadow-card transition-shadow border-primary/30" onClick={() => navigate("/admin")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("settings.adminPanel")}</p>
                  <p className="text-sm text-muted-foreground">{t("settings.manageUsers")}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CalmCard>
        )}
      </div>
    </motion.div>
  );
}

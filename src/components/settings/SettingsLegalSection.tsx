import { motion } from "framer-motion";
import { Cookie, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";
import { openCookieSettings } from "@/components/gdpr/CookieConsent";

export function SettingsLegalSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t("settings.legalInfo")}</h2>
      <div className="space-y-2">
        <CalmCard className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={openCookieSettings}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Cookie className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="font-medium text-foreground">{t("settings.cookieSettings")}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CalmCard>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => navigate("/privacy")} className="p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors">
            <span className="text-sm font-medium text-foreground">{t("settings.privacyPolicy")}</span>
          </button>
          <button onClick={() => navigate("/terms")} className="p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors">
            <span className="text-sm font-medium text-foreground">{t("settings.termsOfUse")}</span>
          </button>
          <button onClick={() => navigate("/impressum")} className="p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors">
            <span className="text-sm font-medium text-foreground">{t("settings.legalNotice")}</span>
          </button>
          <button onClick={() => navigate("/faq")} className="p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors">
            <span className="text-sm font-medium text-foreground">FAQ</span>
          </button>
          <button onClick={() => navigate("/cancellation")} className="p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors">
            <span className="text-sm font-medium text-foreground">{t("settings.withdrawal")}</span>
          </button>
          <button onClick={() => navigate("/about")} className="p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors">
            <span className="text-sm font-medium text-foreground">{t("settings.aboutUs")}</span>
          </button>
          <button onClick={() => navigate("/contact")} className="col-span-2 p-3 bg-card rounded-xl border border-border/40 text-left hover:bg-muted/30 transition-colors">
            <span className="text-sm font-medium text-foreground">{t("settings.contact")}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

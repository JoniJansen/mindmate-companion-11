import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-gentle-soft flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🌿</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{t("notFound.title")}</h1>
        <p className="text-muted-foreground mb-8">
          {t("notFound.description")}
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate("/chat")} className="w-full">
            <Home className="w-4 h-4 mr-2" />
            {t("notFound.goToChat")}
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("notFound.goBack")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

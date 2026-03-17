import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Search, Crown, Users, Loader2, AlertCircle, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnalyticsDashboardSection } from "@/components/admin/AnalyticsDashboardSection";
import { CalmCard } from "@/components/shared/CalmCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAdmin, AdminUser } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useTranslation();
  const {
    isAdmin,
    isChecking,
    users,
    isLoading,
    error,
    checkAdminStatus,
    listUsers,
    searchUsers,
    setPremium,
  } = useAdmin();

  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const texts = {
    title: { en: "Admin Panel", de: "Admin-Bereich" },
    subtitle: { en: "Manage users and subscriptions", de: "Nutzer und Abos verwalten" },
    search: { en: "Search by email...", de: "Nach E-Mail suchen..." },
    noAccess: { en: "You don't have admin access", de: "Du hast keinen Admin-Zugang" },
    noAccessDesc: { en: "This area is restricted to administrators only.", de: "Dieser Bereich ist nur für Administratoren zugänglich." },
    backHome: { en: "Back to Home", de: "Zurück zur Startseite" },
    loading: { en: "Loading...", de: "Lädt..." },
    checking: { en: "Checking permissions...", de: "Berechtigungen werden geprüft..." },
    noUsers: { en: "No users found", de: "Keine Nutzer gefunden" },
    searchHint: { en: "Search for users or load all users", de: "Nach Nutzern suchen oder alle laden" },
    loadAll: { en: "Load all users", de: "Alle Nutzer laden" },
    premium: { en: "Premium", de: "Premium" },
    free: { en: "Free", de: "Kostenlos" },
    setPremium: { en: "Set Premium", de: "Premium aktivieren" },
    revokePremium: { en: "Revoke Premium", de: "Premium entziehen" },
    success: { en: "Success", de: "Erfolg" },
    premiumGranted: { en: "Premium access granted", de: "Premium-Zugang aktiviert" },
    premiumRevoked: { en: "Premium access revoked", de: "Premium-Zugang entzogen" },
    error: { en: "Error", de: "Fehler" },
  };

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user, checkAdminStatus]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchUsers(searchQuery);
    }
  };

  const handleLoadAll = async () => {
    await listUsers();
  };

  const handleTogglePremium = async (targetUser: AdminUser) => {
    setUpdatingUserId(targetUser.id);
    const success = await setPremium(targetUser.id, !targetUser.isPremium);
    setUpdatingUserId(null);

    if (success) {
      toast({
        title: texts.success[language],
        description: targetUser.isPremium
          ? texts.premiumRevoked[language]
          : texts.premiumGranted[language],
      });
    } else {
      toast({
        title: texts.error[language],
        description: error || "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Check for admin access
  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{texts.checking[language]}</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{texts.noAccess[language]}</h1>
          <p className="text-muted-foreground mb-6">{texts.noAccessDesc[language]}</p>
          <Button onClick={() => navigate("/")}>
            {texts.backHome[language]}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={texts.title[language]}
        subtitle={texts.subtitle[language]}
        showSettings={false}
      />

      <div className="px-4 space-y-6">
        {/* Search Section */}
        <CalmCard>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={texts.search[language]}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={handleLoadAll}
            disabled={isLoading}
            className="w-full mt-3"
          >
            <Users className="w-4 h-4 mr-2" />
            {texts.loadAll[language]}
          </Button>
        </CalmCard>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">{texts.loading[language]}</span>
          </div>
        ) : users.length === 0 ? (
          <CalmCard className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{texts.searchHint[language]}</p>
          </CalmCard>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CalmCard>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {u.displayName || u.email}
                        </span>
                        {u.isPremium ? (
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            <Crown className="w-3 h-3 mr-1" />
                            {texts.premium[language]}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {texts.free[language]}
                          </Badge>
                        )}
                      </div>
                      {u.displayName && (
                        <p className="text-sm text-muted-foreground truncate">
                          {u.email}
                        </p>
                      )}
                      {u.isPremium && u.planType && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Plan: {u.planType}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {updatingUserId === u.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : (
                        <Switch
                          checked={u.isPremium}
                          onCheckedChange={() => handleTogglePremium(u)}
                          aria-label={u.isPremium ? texts.revokePremium[language] : texts.setPremium[language]}
                        />
                      )}
                      <Crown className={`w-5 h-5 ${u.isPremium ? "text-primary" : "text-muted-foreground opacity-30"}`} />
                    </div>
                  </div>
                </CalmCard>
              </motion.div>
            ))}
          </div>
        )}

        {error && (
          <CalmCard className="border-destructive/50 bg-destructive/10">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CalmCard>
        )}
      </div>
    </div>
  );
}

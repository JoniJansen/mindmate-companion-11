import { useState, useRef, useEffect } from "react";
import { User, Mail, Key, Pencil, Check, X, Send, Trash2, Camera, Download, Shield } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

interface AccountSettingsProps {
  language: "en" | "de";
}

export function AccountSettings({ language }: AccountSettingsProps) {
  const { user, profile, resetPassword, updatePassword, updateProfile, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Display name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Password change
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Password reset email
  const [isSendingReset, setIsSendingReset] = useState(false);
  
  // Avatar upload
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Account deletion
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  // Data export
  const [isExporting, setIsExporting] = useState(false);
  
  // 2FA
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const texts = {
    de: {
      displayName: "Anzeigename",
      displayNamePlaceholder: "Dein Name",
      email: "E-Mail",
      changePassword: "Passwort ändern",
      changePasswordDesc: "Neues Passwort festlegen",
      resetPassword: "Passwort zurücksetzen",
      resetPasswordDesc: "Link per E-Mail erhalten",
      newPassword: "Neues Passwort",
      confirmPassword: "Passwort bestätigen",
      passwordsNoMatch: "Passwörter stimmen nicht überein",
      passwordTooShort: "Passwort muss mindestens 6 Zeichen haben",
      passwordChanged: "Passwort erfolgreich geändert",
      resetEmailSent: "E-Mail zum Zurücksetzen wurde gesendet",
      resetEmailDesc: "Prüfe dein Postfach für den Link",
      nameUpdated: "Anzeigename aktualisiert",
      save: "Speichern",
      cancel: "Abbrechen",
      change: "Ändern",
      sendResetLink: "Link senden",
      editName: "Name bearbeiten",
      changeAvatar: "Profilbild ändern",
      avatarUpdated: "Profilbild aktualisiert",
      deleteAccount: "Konto löschen",
      deleteAccountDesc: "Alle Daten unwiderruflich löschen",
      deleteAccountTitle: "Konto wirklich löschen?",
      deleteAccountWarning: "Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Daten, Journaleinträge, Stimmungsaufzeichnungen und Einstellungen werden dauerhaft gelöscht.",
      deleteConfirmLabel: "Gib DELETE ein um zu bestätigen",
      deleting: "Wird gelöscht...",
      delete: "Endgültig löschen",
      accountDeleted: "Dein Konto wurde gelöscht",
      exportData: "Daten exportieren",
      exportDataDesc: "Journal & Stimmungsdaten herunterladen",
      exporting: "Wird exportiert...",
      exportSuccess: "Daten erfolgreich exportiert",
      twoFactor: "Zwei-Faktor-Authentifizierung",
      twoFactorDesc: "Zusätzliche Sicherheit für dein Konto",
      twoFactorEnabled: "2FA ist aktiviert",
      twoFactorDisabled: "2FA ist deaktiviert",
      setup2FA: "2FA einrichten",
      scan2FACode: "Scanne diesen QR-Code mit deiner Authenticator-App",
      enterCode: "Bestätigungscode eingeben",
      verify: "Bestätigen",
      verifying: "Wird überprüft...",
      twoFactorSuccess: "2FA erfolgreich aktiviert",
      disable2FA: "2FA deaktivieren",
      disable2FAConfirm: "2FA wirklich deaktivieren?",
      disable2FAWarning: "Dein Konto wird weniger sicher sein ohne 2FA.",
      twoFactorDisabledSuccess: "2FA wurde deaktiviert",
    },
    en: {
      displayName: "Display Name",
      displayNamePlaceholder: "Your name",
      email: "Email",
      changePassword: "Change Password",
      changePasswordDesc: "Set a new password",
      resetPassword: "Reset Password",
      resetPasswordDesc: "Get link via email",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      passwordsNoMatch: "Passwords do not match",
      passwordTooShort: "Password must be at least 6 characters",
      passwordChanged: "Password changed successfully",
      resetEmailSent: "Password reset email sent",
      resetEmailDesc: "Check your inbox for the link",
      nameUpdated: "Display name updated",
      save: "Save",
      cancel: "Cancel",
      change: "Change",
      sendResetLink: "Send Link",
      editName: "Edit name",
      changeAvatar: "Change profile picture",
      avatarUpdated: "Profile picture updated",
      deleteAccount: "Delete Account",
      deleteAccountDesc: "Permanently delete all data",
      deleteAccountTitle: "Really delete account?",
      deleteAccountWarning: "This action cannot be undone. All your data, journal entries, mood logs and settings will be permanently deleted.",
      deleteConfirmLabel: "Type DELETE to confirm",
      deleting: "Deleting...",
      delete: "Delete permanently",
      accountDeleted: "Your account has been deleted",
      exportData: "Export Data",
      exportDataDesc: "Download journal & mood data",
      exporting: "Exporting...",
      exportSuccess: "Data exported successfully",
      twoFactor: "Two-Factor Authentication",
      twoFactorDesc: "Extra security for your account",
      twoFactorEnabled: "2FA is enabled",
      twoFactorDisabled: "2FA is disabled",
      setup2FA: "Set up 2FA",
      scan2FACode: "Scan this QR code with your authenticator app",
      enterCode: "Enter verification code",
      verify: "Verify",
      verifying: "Verifying...",
      twoFactorSuccess: "2FA enabled successfully",
      disable2FA: "Disable 2FA",
      disable2FAConfirm: "Really disable 2FA?",
      disable2FAWarning: "Your account will be less secure without 2FA.",
      twoFactorDisabledSuccess: "2FA has been disabled",
    },
  };

  const t = texts[language];

  // Check 2FA status on mount
  useEffect(() => {
    const check2FAStatus = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (!error && data) {
          const verifiedFactors = data.totp.filter(f => f.status === "verified");
          setIs2FAEnabled(verifiedFactors.length > 0);
          if (verifiedFactors.length > 0) {
            setFactorId(verifiedFactors[0].id);
          }
        }
      } catch (e) {
        console.warn("Could not check 2FA status:", e);
      }
    };
    check2FAStatus();
  }, []);

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) return;
    
    setIsSavingName(true);
    try {
      await updateProfile({ display_name: displayName.trim() });
      toast({ title: t.nameUpdated });
      setIsEditingName(false);
      refreshProfile();
    } catch (error: any) {
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: t.passwordTooShort, variant: "destructive" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({ title: t.passwordsNoMatch, variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(newPassword);
      toast({ title: t.passwordChanged });
      setIsPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendPasswordResetEmail = async () => {
    if (!user?.email) return;
    
    setIsSendingReset(true);
    try {
      await resetPassword(user.email);
      toast({ title: t.resetEmailSent, description: t.resetEmailDesc });
    } catch (error: any) {
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: language === "de" ? "Ungültiger Dateityp" : "Invalid file type",
        description: language === "de" ? "Bitte wähle ein Bild aus" : "Please select an image",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: language === "de" ? "Datei zu groß" : "File too large",
        description: language === "de" ? "Maximale Größe: 5MB" : "Maximum size: 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      await updateProfile({ avatar_url: avatarUrl });
      refreshProfile();
      toast({ title: t.avatarUpdated });
    } catch (error: any) {
      toast({
        title: language === "de" ? "Fehler beim Hochladen" : "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    setIsExporting(true);
    try {
      // Fetch all user data
      const [journalResult, moodResult, recapResult] = await Promise.all([
        supabase.from("journal_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("mood_checkins").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("weekly_recaps").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          email: user.email,
          displayName: profile?.display_name,
        },
        journalEntries: journalResult.data || [],
        moodCheckins: moodResult.data || [],
        weeklyRecaps: recapResult.data || [],
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindmate-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: t.exportSuccess });
    } catch (error: any) {
      toast({
        title: language === "de" ? "Export fehlgeschlagen" : "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSetup2FA = async () => {
    setIsEnabling2FA(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "MindMate Authenticator",
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setFactorId(data.id);
      }
    } catch (error: any) {
      toast({
        title: language === "de" ? "Fehler beim Einrichten" : "Setup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!factorId || verifyCode.length !== 6) return;

    setIsVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      setIs2FAEnabled(true);
      setQrCode(null);
      setVerifyCode("");
      setIs2FADialogOpen(false);
      toast({ title: t.twoFactorSuccess });
    } catch (error: any) {
      toast({
        title: language === "de" ? "Verifizierung fehlgeschlagen" : "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!factorId) return;

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;

      setIs2FAEnabled(false);
      setFactorId(null);
      toast({ title: t.twoFactorDisabledSuccess });
    } catch (error: any) {
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (response.error) throw response.error;

      toast({ title: t.accountDeleted });
      await signOut();
      navigate("/auth", { replace: true });
    } catch (error: any) {
      toast({
        title: language === "de" ? "Fehler beim Löschen" : "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "MM";
  };

  return (
    <div className="space-y-3">
      {/* Avatar Upload */}
      <CalmCard variant="elevated">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} alt="Avatar" />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isUploadingAvatar ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">{t.changeAvatar}</p>
            <p className="text-sm text-muted-foreground">
              {language === "de" ? "JPG, PNG oder GIF. Max 5MB" : "JPG, PNG or GIF. Max 5MB"}
            </p>
          </div>
        </div>
      </CalmCard>

      {/* Display Name - Editable */}
      <CalmCard variant="elevated">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t.displayNamePlaceholder}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveDisplayName}
                  disabled={isSavingName || !displayName.trim()}
                  className="h-8 w-8 p-0"
                >
                  <Check className="w-4 h-4 text-primary" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingName(false);
                    setDisplayName(profile?.display_name || "");
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">{t.displayName}</p>
                <p className="font-medium text-foreground truncate">
                  {profile?.display_name || (language === "de" ? "MindMate Nutzer" : "MindMate User")}
                </p>
              </>
            )}
          </div>
          {!isEditingName && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDisplayName(profile?.display_name || "");
                setIsEditingName(true);
              }}
              className="h-8 w-8 p-0"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </CalmCard>

      {/* Email - Read only */}
      <CalmCard variant="default">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{t.email}</p>
            <p className="font-medium text-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </CalmCard>

      {/* Two-Factor Authentication */}
      <Dialog open={is2FADialogOpen} onOpenChange={setIs2FADialogOpen}>
        <DialogTrigger asChild>
          <CalmCard 
            variant="default" 
            className="cursor-pointer hover:shadow-card transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{t.twoFactor}</p>
                <p className="text-sm text-muted-foreground">
                  {is2FAEnabled ? t.twoFactorEnabled : t.twoFactorDisabled}
                </p>
              </div>
              <div className={`w-2 h-2 rounded-full ${is2FAEnabled ? "bg-green-500" : "bg-muted-foreground/30"}`} />
            </div>
          </CalmCard>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.twoFactor}</DialogTitle>
            <DialogDescription>{t.twoFactorDesc}</DialogDescription>
          </DialogHeader>
          
          {is2FAEnabled ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Shield className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {t.twoFactorEnabled}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    {t.disable2FA}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.disable2FAConfirm}</AlertDialogTitle>
                    <AlertDialogDescription>{t.disable2FAWarning}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDisable2FA}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t.disable2FA}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : qrCode ? (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-lg" />
              </div>
              <p className="text-sm text-center text-muted-foreground">{t.scan2FACode}</p>
              <div className="space-y-2">
                <Label htmlFor="verify-code">{t.enterCode}</Label>
                <Input
                  id="verify-code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button
                onClick={handleVerify2FA}
                disabled={verifyCode.length !== 6 || isVerifying}
                className="w-full"
              >
                {isVerifying ? t.verifying : t.verify}
              </Button>
            </div>
          ) : (
            <div className="py-4">
              <Button
                onClick={handleSetup2FA}
                disabled={isEnabling2FA}
                className="w-full"
              >
                {isEnabling2FA ? (language === "de" ? "Wird eingerichtet..." : "Setting up...") : t.setup2FA}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Password */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogTrigger asChild>
          <CalmCard 
            variant="default" 
            className="cursor-pointer hover:shadow-card transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-calm/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-calm" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{t.changePassword}</p>
                <p className="text-sm text-muted-foreground">{t.changePasswordDesc}</p>
              </div>
            </div>
          </CalmCard>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.changePassword}</DialogTitle>
            <DialogDescription>
              {language === "de" 
                ? "Gib dein neues Passwort ein und bestätige es."
                : "Enter your new password and confirm it."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t.newPassword}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t.confirmPassword}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordDialogOpen(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword 
                ? (language === "de" ? "Wird geändert..." : "Changing...") 
                : t.change}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password via Email */}
      <CalmCard 
        variant="default" 
        className="cursor-pointer hover:shadow-card transition-shadow"
        onClick={handleSendPasswordResetEmail}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gentle/10 flex items-center justify-center">
            <Send className="w-5 h-5 text-gentle" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">{t.resetPassword}</p>
            <p className="text-sm text-muted-foreground">{t.resetPasswordDesc}</p>
          </div>
          {isSendingReset && (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </CalmCard>

      {/* Export Data */}
      <CalmCard 
        variant="default" 
        className="cursor-pointer hover:shadow-card transition-shadow"
        onClick={handleExportData}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-calm/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-calm" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">{t.exportData}</p>
            <p className="text-sm text-muted-foreground">{t.exportDataDesc}</p>
          </div>
          {isExporting && (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </CalmCard>

      {/* Delete Account */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <CalmCard 
            variant="default" 
            className="cursor-pointer hover:shadow-card transition-shadow border-destructive/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-destructive">{t.deleteAccount}</p>
                <p className="text-sm text-muted-foreground">{t.deleteAccountDesc}</p>
              </div>
            </div>
          </CalmCard>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {t.deleteAccountTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>{t.deleteAccountWarning}</p>
              <div className="space-y-2">
                <Label htmlFor="delete-confirm" className="text-sm font-medium">
                  {t.deleteConfirmLabel}
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="border-destructive/50 focus-visible:ring-destructive"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE" || isDeletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAccount ? t.deleting : t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

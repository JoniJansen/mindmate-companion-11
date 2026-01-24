import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Key, Lock, Pencil, Check, X, Send } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AccountSettingsProps {
  language: "en" | "de";
}

export function AccountSettings({ language }: AccountSettingsProps) {
  const { user, profile, resetPassword, updatePassword, updateProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
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
    },
  };

  const t = texts[language];

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) return;
    
    setIsSavingName(true);
    try {
      await updateProfile({ display_name: displayName.trim() });
      toast({
        title: t.nameUpdated,
      });
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
      toast({
        title: t.passwordTooShort,
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: t.passwordsNoMatch,
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(newPassword);
      toast({
        title: t.passwordChanged,
      });
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
      toast({
        title: t.resetEmailSent,
        description: t.resetEmailDesc,
      });
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

  return (
    <div className="space-y-3">
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
    </div>
  );
}

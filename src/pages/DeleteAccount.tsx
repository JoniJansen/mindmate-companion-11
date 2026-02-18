import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Shield, Mail, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function DeleteAccount() {
  const { t, language } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const isDE = language === "de";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <Trash2 className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isDE ? "Konto löschen – Soulvay" : "Delete Account – Soulvay"}
          </h1>
          <p className="text-muted-foreground">
            {isDE
              ? "Hier erfährst du, wie du dein Soulvay-Konto und alle zugehörigen Daten löschen kannst."
               : "Learn how to delete your Soulvay account and all associated data."}
          </p>
        </div>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isDE ? "So löschst du dein Konto" : "How to delete your account"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Step
                number={1}
                text={
                  isDE
                    ? "Öffne die Soulvay-App und melde dich mit deinem Konto an."
                    : "Open the Soulvay app and sign in to your account."
                }
              />
              <Step
                number={2}
                text={
                  isDE
                    ? 'Gehe zu Einstellungen (⚙️) → Abschnitt „Konto".'
                    : 'Go to Settings (⚙️) → "Account" section.'
                }
              />
              <Step
                number={3}
                text={
                  isDE
                    ? 'Tippe auf „Konto löschen" und bestätige die Löschung.'
                    : 'Tap "Delete Account" and confirm the deletion.'
                }
              />
            </div>

            {isAuthenticated && (
              <Button
                onClick={() => navigate("/settings")}
                className="w-full mt-4"
              >
                {isDE ? "Zu den Einstellungen" : "Go to Settings"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {!isAuthenticated && (
              <Button
                onClick={() => navigate("/auth?redirect=/settings")}
                variant="outline"
                className="w-full mt-4"
              >
                {isDE ? "Anmelden & Konto löschen" : "Sign in & delete account"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* What gets deleted */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {isDE ? "Welche Daten werden gelöscht?" : "What data is deleted?"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <DataItem
                text={
                  isDE
                    ? "Profildaten (Name, Profilbild, Spracheinstellungen)"
                    : "Profile data (name, avatar, language preferences)"
                }
              />
              <DataItem
                text={
                  isDE
                    ? "Alle Tagebucheinträge"
                    : "All journal entries"
                }
              />
              <DataItem
                text={
                  isDE
                    ? "Stimmungs-Check-ins und Verlauf"
                    : "Mood check-ins and history"
                }
              />
              <DataItem
                text={
                  isDE
                    ? "Wochenrückblicke und Zusammenfassungen"
                    : "Weekly recaps and summaries"
                }
              />
              <DataItem
                text={
                  isDE
                    ? "Abonnement-Informationen"
                    : "Subscription information"
                }
              />
              <DataItem
                text={
                  isDE
                    ? "Chat-Verlauf und Gesprächsdaten"
                    : "Chat history and conversation data"
                }
              />
              <DataItem
                text={
                  isDE
                    ? "Dein Benutzerkonto und Anmeldedaten"
                    : "Your user account and login credentials"
                }
              />
            </ul>

            <div className="mt-4 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
              <p className="text-sm font-medium text-destructive">
                {isDE
                  ? "⚠️ Die Löschung ist unwiderruflich. Alle Daten werden sofort und vollständig entfernt. Es gibt keine Aufbewahrungsfrist."
                  : "⚠️ Deletion is irreversible. All data is removed immediately and completely. There is no retention period."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              {isDE ? "Hilfe benötigt?" : "Need help?"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isDE
                ? "Falls du Probleme bei der Kontolöschung hast oder dein Konto nicht selbst löschen kannst, kontaktiere uns per E-Mail:"
                : "If you have trouble deleting your account or cannot do it yourself, contact us via email:"}
            </p>
            <a
              href="mailto:joni.jansen00@gmail.com?subject=Account%20Deletion%20Request"
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              joni.jansen00@gmail.com
            </a>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Soulvay · MindMade by Jonathan Jansen
        </p>
      </div>
    </div>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
        {number}
      </span>
      <p className="text-sm text-foreground">{text}</p>
    </div>
  );
}

function DataItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-destructive mt-0.5">•</span>
      <span>{text}</span>
    </li>
  );
}

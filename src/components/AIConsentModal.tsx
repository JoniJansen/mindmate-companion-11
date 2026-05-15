import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";

interface AIConsentModalProps {
  onAccept: () => void | Promise<void>;
}

/**
 * Full-screen, non-dismissable AI data-processing consent modal.
 * Required by Apple App Review (Guidelines 5.1.1(i) + 5.1.2(i)) and GDPR Art. 6(1)(a).
 * Shown to every authenticated user (except demo-mode reviewers) until they accept.
 *
 * After Build 51 hardening: persistence is awaited before the modal closes.
 * The Edge Functions independently enforce consent (requireAIConsent), so
 * tearing down the modal before the DB write completed is no longer just
 * a UX hazard — it would let the user click features that 403 anyway.
 */
export function AIConsentModal({ onAccept }: AIConsentModalProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setError(null);
    setIsAccepting(true);
    try {
      await onAccept();
      // Parent will unmount us via aiConsentGiven flip.
    } catch (e: any) {
      setError(e?.message || "Speichern fehlgeschlagen — bitte versuche es erneut.");
      setIsAccepting(false);
    }
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-consent-title"
      className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm flex items-center justify-center overflow-y-auto"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        paddingLeft: "1rem",
        paddingRight: "1rem",
      }}
    >
      <div className="w-full max-w-lg my-auto bg-card rounded-2xl border border-border/40 shadow-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h1 id="ai-consent-title" className="text-xl font-semibold text-foreground">
            Datenschutzhinweis zu KI
          </h1>
        </div>

        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            Soulvay nutzt <strong className="text-foreground">Google Gemini</strong> von Google LLC,
            um deine Eingaben zu analysieren und persönliche Antworten zu generieren.
          </p>

          <div>
            <p className="font-medium text-foreground mb-1">Was wird gesendet:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Texte deiner Nachrichten und Tagebucheinträge</li>
              <li>Dein gewählter Gesprächston</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">Was wird NICHT gesendet:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>E-Mail oder Identifikationsdaten</li>
              <li>Standort oder Geräteinformationen</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">Empfänger:</p>
            <p>
              Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA, USA.
              Server-Standort: USA. Verschlüsselt (TLS 1.3).
            </p>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">Kein Training auf deinen Daten:</p>
            <p>
              Soulvay nutzt die Google Gemini API im kostenpflichtigen Paid Tier. Deine Eingaben
              und die generierten Antworten werden <strong className="text-foreground">nicht zum
              Training</strong> von Googles Modellen verwendet.
            </p>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">Auftragsverarbeitung:</p>
            <p>
              Google handelt im Sinne von Art. 28 DSGVO als Auftragsverarbeiter für Soulvay
              (Cloud Data Processing Addendum inkl. EU-Standardvertragsklauseln).
            </p>
          </div>

          <p>
            <strong className="text-foreground">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO
            (deine Einwilligung). Widerruf jederzeit in Einstellungen → Datenschutz & KI.
          </p>

          <p className="text-xs opacity-70">Zuletzt aktualisiert: 11. Mai 2026</p>

          <p>
            Mehr Details:{" "}
            <a
              href="https://soulvay.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              soulvay.com/privacy
            </a>
          </p>
        </div>

        <div className="space-y-2 pt-2">
          {error && (
            <p className="text-sm text-destructive text-center" role="alert">{error}</p>
          )}
          <Button
            onClick={handleAccept}
            size="lg"
            className="w-full"
            disabled={isAccepting}
          >
            {isAccepting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird gespeichert…
              </>
            ) : (
              "Ich verstehe und stimme zu"
            )}
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="w-full"
            disabled={isAccepting}
          >
            <a href="https://soulvay.com/privacy" target="_blank" rel="noopener noreferrer">
              Datenschutzerklärung lesen
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

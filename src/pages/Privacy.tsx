import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Eye, Trash2, Download, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export default function Privacy() {
  const navigate = useNavigate();
  const { language } = useTranslation();

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: January 2026",
      intro: "Your privacy matters to us. Soulvay is designed with your privacy and security as core principles. This policy explains how we handle your personal information.",
      sections: [
        {
          icon: Lock,
          title: "Data We Collect",
          content: `We collect only the information necessary to provide our services:

• **Account Information**: Email address and optional display name when you create an account.
• **Usage Data**: Your journal entries, mood check-ins, and chat conversations to provide personalized support.
• **Technical Data**: Device type, browser version, and anonymized usage patterns to improve the app.

We do NOT collect:
• Precise location data
• Contact lists
• Financial information (payments are handled securely by Stripe)
• Data from other apps on your device`
        },
        {
          icon: Shield,
          title: "How We Protect Your Data",
          content: `Your mental health data deserves the highest protection:

• **Encryption**: All data is encrypted in transit (TLS 1.3) and at rest (AES-256).
• **Secure Infrastructure**: We use enterprise-grade cloud infrastructure with industry-standard security certifications.
• **Access Controls**: Only you can access your personal data. Our team cannot read your journal entries or chat conversations.
• **No Third-Party Sharing**: We never sell or share your personal data with advertisers or data brokers.`
        },
        {
          icon: Eye,
          title: "How We Use Your Data",
          content: `Your data is used solely to:

• Provide personalized AI responses in chat
• Generate your mood insights and weekly recaps
• Improve our AI models (using anonymized, aggregated patterns only)
• Send you service-related notifications (optional)

We will NEVER use your data for:
• Targeted advertising
• Profiling for external parties
• Training AI models with identifiable personal content`
        },
        {
          icon: Download,
          title: "Your Rights",
          content: `You have full control over your data:

• **Access**: Export all your data anytime from Settings.
• **Correction**: Update your profile information at any time.
• **Deletion**: Delete your account and all associated data permanently.
• **Portability**: Download your data in a standard format (JSON).
• **Objection**: Opt out of analytics and non-essential data processing.

To exercise these rights, go to Settings > Account or contact us at joni.jansen00@gmail.com`
        },
        {
          icon: Trash2,
          title: "Data Retention",
          content: `• **Active Accounts**: Data is retained while your account is active.
• **Deleted Accounts**: All personal data is permanently deleted within 30 days of account deletion.
• **Anonymized Data**: We may retain anonymized, aggregated insights indefinitely for service improvement.
• **Legal Requirements**: We may retain data longer if required by law.`
        },
        {
          icon: Bell,
          title: "Updates to This Policy",
          content: `We may update this policy to reflect changes in our practices or legal requirements. We will notify you of significant changes via:

• In-app notification
• Email (if you've opted in)

Continued use of Soulvay after changes constitutes acceptance of the updated policy.`
        }
      ],
      contact: {
        title: "Contact Us",
        content: "For privacy-related questions or concerns, please contact us at:",
        email: "joni.jansen00@gmail.com"
      }
    },
    de: {
      title: "Datenschutzerklärung",
      lastUpdated: "Zuletzt aktualisiert: Januar 2026",
      intro: "Deine Privatsphäre ist uns wichtig. Soulvay wurde mit Datenschutz und Sicherheit als Grundprinzipien entwickelt. Diese Richtlinie erklärt, wie wir mit deinen persönlichen Daten umgehen.",
      sections: [
        {
          icon: Lock,
          title: "Daten, die wir erheben",
          content: `Wir erheben nur die Informationen, die für unsere Dienste notwendig sind:

• **Kontoinformationen**: E-Mail-Adresse und optionaler Anzeigename bei der Kontoerstellung.
• **Nutzungsdaten**: Deine Tagebucheinträge, Stimmungs-Check-ins und Chat-Gespräche für personalisierte Unterstützung.
• **Technische Daten**: Gerätetyp, Browserversion und anonymisierte Nutzungsmuster zur App-Verbesserung.

Wir erheben NICHT:
• Genaue Standortdaten
• Kontaktlisten
• Finanzinformationen (Zahlungen werden sicher über Stripe abgewickelt)
• Daten von anderen Apps auf deinem Gerät`
        },
        {
          icon: Shield,
          title: "Wie wir deine Daten schützen",
          content: `Deine mentalen Gesundheitsdaten verdienen höchsten Schutz:

• **Verschlüsselung**: Alle Daten werden bei der Übertragung (TLS 1.3) und im Ruhezustand (AES-256) verschlüsselt.
• **Sichere Infrastruktur**: Wir nutzen eine Enterprise-Cloud-Infrastruktur mit branchenüblichen Sicherheitszertifizierungen.
• **Zugriffskontrollen**: Nur du kannst auf deine persönlichen Daten zugreifen. Unser Team kann deine Tagebucheinträge oder Chat-Gespräche nicht lesen.
• **Keine Weitergabe an Dritte**: Wir verkaufen oder teilen deine persönlichen Daten niemals mit Werbetreibenden oder Datenhändlern.`
        },
        {
          icon: Eye,
          title: "Wie wir deine Daten nutzen",
          content: `Deine Daten werden ausschließlich verwendet für:

• Personalisierte KI-Antworten im Chat
• Erstellung deiner Stimmungseinblicke und wöchentlichen Zusammenfassungen
• Verbesserung unserer KI-Modelle (nur mit anonymisierten, aggregierten Mustern)
• Service-bezogene Benachrichtigungen (optional)

Wir werden deine Daten NIEMALS verwenden für:
• Zielgerichtete Werbung
• Profilbildung für externe Parteien
• Training von KI-Modellen mit identifizierbaren persönlichen Inhalten`
        },
        {
          icon: Download,
          title: "Deine Rechte",
          content: `Du hast volle Kontrolle über deine Daten:

• **Zugang**: Exportiere alle deine Daten jederzeit aus den Einstellungen.
• **Korrektur**: Aktualisiere deine Profilinformationen jederzeit.
• **Löschung**: Lösche dein Konto und alle zugehörigen Daten dauerhaft.
• **Übertragbarkeit**: Lade deine Daten in einem Standardformat (JSON) herunter.
• **Widerspruch**: Widerspreche Analytics und nicht-essentieller Datenverarbeitung.

Um diese Rechte auszuüben, gehe zu Einstellungen > Konto oder kontaktiere uns unter joni.jansen00@gmail.com`
        },
        {
          icon: Trash2,
          title: "Datenspeicherung",
          content: `• **Aktive Konten**: Daten werden gespeichert, solange dein Konto aktiv ist.
• **Gelöschte Konten**: Alle persönlichen Daten werden innerhalb von 30 Tagen nach der Kontolöschung dauerhaft gelöscht.
• **Anonymisierte Daten**: Wir können anonymisierte, aggregierte Erkenntnisse unbegrenzt für die Serviceverbesserung aufbewahren.
• **Gesetzliche Anforderungen**: Wir können Daten länger aufbewahren, wenn dies gesetzlich erforderlich ist.`
        },
        {
          icon: Bell,
          title: "Aktualisierungen dieser Richtlinie",
          content: `Wir können diese Richtlinie aktualisieren, um Änderungen in unseren Praktiken oder gesetzlichen Anforderungen widerzuspiegeln. Wir werden dich über wesentliche Änderungen informieren über:

• In-App-Benachrichtigung
• E-Mail (wenn du dich angemeldet hast)

Die weitere Nutzung von Soulvay nach Änderungen gilt als Akzeptanz der aktualisierten Richtlinie.`
        }
      ],
      contact: {
        title: "Kontakt",
        content: "Für datenschutzbezogene Fragen oder Bedenken kontaktiere uns bitte unter:",
        email: "joni.jansen00@gmail.com"
      }
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 safe-top">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
            <p className="text-sm text-muted-foreground">{t.lastUpdated}</p>
          </div>
        </div>

        {/* Intro */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-muted-foreground mb-8 text-lg leading-relaxed"
        >
          {t.intro}
        </motion.p>

        {/* Sections */}
        <div className="space-y-8">
          {t.sections.map((section, index) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border/40 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line prose prose-sm dark:prose-invert max-w-none">
                {section.content.split('**').map((part, i) => 
                  i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
                )}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Contact */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-primary/5 rounded-2xl p-6 border border-primary/10"
        >
          <h2 className="text-lg font-semibold text-foreground mb-2">{t.contact.title}</h2>
          <p className="text-muted-foreground text-sm mb-2">{t.contact.content}</p>
          <a href={`mailto:${t.contact.email}`} className="text-primary font-medium hover:underline">
            {t.contact.email}
          </a>
        </motion.section>
      </div>
    </div>
  );
}

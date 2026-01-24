import { motion } from "framer-motion";
import { ArrowLeft, FileText, AlertTriangle, CreditCard, Scale, Ban, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export default function Terms() {
  const navigate = useNavigate();
  const { language } = useTranslation();

  const content = {
    en: {
      title: "Terms of Service",
      lastUpdated: "Last updated: January 2026",
      intro: "Welcome to MindMate. By using our service, you agree to these terms. Please read them carefully.",
      sections: [
        {
          icon: FileText,
          title: "1. About MindMate",
          content: `MindMate is an AI-powered mental wellness companion designed to help you reflect, journal, and develop emotional awareness. 

**Important Disclaimer**: MindMate is NOT a substitute for professional mental health care, therapy, or medical advice. It is a supportive tool, not a licensed healthcare provider.

If you are experiencing a mental health crisis, please contact emergency services or a crisis hotline immediately.`
        },
        {
          icon: AlertTriangle,
          title: "2. Eligibility & Acceptable Use",
          content: `**Age Requirement**: You must be at least 16 years old to use MindMate. Users under 18 should have parental consent.

**Acceptable Use**: You agree to:
• Use MindMate for personal, non-commercial purposes only
• Not share content that is illegal, harmful, or violates others' rights
• Not attempt to reverse-engineer or exploit our systems
• Not use the service to harm yourself or others

**Content Responsibility**: You are responsible for the content you create in MindMate. We do not monitor individual content but may take action if we become aware of violations.`
        },
        {
          icon: CreditCard,
          title: "3. Subscriptions & Payments",
          content: `**Free Tier**: MindMate offers a free tier with limited features (5 messages per day, basic journaling).

**Plus Subscription**: Premium features are available through a monthly subscription (€9.99/month or €89.99/year).

**Billing**: 
• Subscriptions are billed in advance on a recurring basis
• Payments are processed securely through Stripe
• You can cancel anytime from Settings

**Refunds**: 
• We offer a 7-day money-back guarantee for new subscribers
• Refund requests after 7 days are handled on a case-by-case basis
• Contact support@mindmate.app for refund inquiries`
        },
        {
          icon: Scale,
          title: "4. Intellectual Property",
          content: `**Your Content**: You retain ownership of all content you create (journal entries, chat messages). By using MindMate, you grant us a limited license to process this content to provide our services.

**Our Content**: The MindMate app, including its design, code, AI models, and exercises, is our intellectual property. You may not copy, modify, or distribute it without permission.

**Feedback**: If you provide feedback or suggestions, we may use them to improve MindMate without compensation.`
        },
        {
          icon: Ban,
          title: "5. Limitations & Disclaimers",
          content: `**No Medical Advice**: MindMate provides general wellness support, not medical, psychological, or psychiatric advice. Always consult qualified professionals for health concerns.

**AI Limitations**: Our AI may occasionally provide inaccurate or unhelpful responses. It cannot diagnose conditions or prescribe treatments.

**Service Availability**: We strive for high availability but cannot guarantee uninterrupted service. We may modify or discontinue features with notice.

**Liability Limitation**: To the maximum extent permitted by law, MindMate is not liable for any indirect, incidental, or consequential damages arising from your use of the service.`
        },
        {
          icon: RefreshCw,
          title: "6. Changes & Termination",
          content: `**Changes to Terms**: We may update these terms. Significant changes will be communicated via in-app notification or email. Continued use after changes constitutes acceptance.

**Account Termination**: 
• You may delete your account at any time from Settings
• We may suspend or terminate accounts that violate these terms
• Upon termination, your data will be deleted per our Privacy Policy

**Governing Law**: These terms are governed by the laws of Germany. Disputes will be resolved in German courts.`
        }
      ],
      contact: {
        title: "Questions?",
        content: "If you have questions about these terms, please contact us at:",
        email: "legal@mindmate.app"
      },
      agreement: "By using MindMate, you acknowledge that you have read, understood, and agree to these Terms of Service."
    },
    de: {
      title: "Nutzungsbedingungen",
      lastUpdated: "Zuletzt aktualisiert: Januar 2026",
      intro: "Willkommen bei MindMate. Durch die Nutzung unseres Dienstes stimmst du diesen Bedingungen zu. Bitte lies sie sorgfältig durch.",
      sections: [
        {
          icon: FileText,
          title: "1. Über MindMate",
          content: `MindMate ist ein KI-gestützter Begleiter für mentales Wohlbefinden, der dir hilft zu reflektieren, Tagebuch zu führen und emotionales Bewusstsein zu entwickeln.

**Wichtiger Hinweis**: MindMate ist KEIN Ersatz für professionelle psychische Gesundheitsversorgung, Therapie oder medizinische Beratung. Es ist ein unterstützendes Werkzeug, kein zugelassener Gesundheitsdienstleister.

Wenn du eine psychische Krise erlebst, kontaktiere bitte sofort den Notdienst oder eine Krisenhotline.`
        },
        {
          icon: AlertTriangle,
          title: "2. Berechtigung & Akzeptable Nutzung",
          content: `**Altersanforderung**: Du musst mindestens 16 Jahre alt sein, um MindMate zu nutzen. Nutzer unter 18 Jahren sollten die Zustimmung der Eltern haben.

**Akzeptable Nutzung**: Du stimmst zu:
• MindMate nur für persönliche, nicht-kommerzielle Zwecke zu nutzen
• Keine illegalen, schädlichen oder die Rechte anderer verletzenden Inhalte zu teilen
• Nicht zu versuchen, unsere Systeme zu reverse-engineeren oder auszunutzen
• Den Dienst nicht zu nutzen, um dir selbst oder anderen zu schaden

**Inhaltsverantwortung**: Du bist für die von dir in MindMate erstellten Inhalte verantwortlich. Wir überwachen keine individuellen Inhalte, können aber bei Bekanntwerden von Verstößen Maßnahmen ergreifen.`
        },
        {
          icon: CreditCard,
          title: "3. Abonnements & Zahlungen",
          content: `**Kostenlose Stufe**: MindMate bietet eine kostenlose Stufe mit eingeschränkten Funktionen (5 Nachrichten pro Tag, Basis-Tagebuch).

**Plus-Abonnement**: Premium-Funktionen sind über ein monatliches Abonnement verfügbar (€9,99/Monat oder €89,99/Jahr).

**Abrechnung**: 
• Abonnements werden im Voraus auf wiederkehrender Basis abgerechnet
• Zahlungen werden sicher über Stripe abgewickelt
• Du kannst jederzeit in den Einstellungen kündigen

**Erstattungen**: 
• Wir bieten eine 7-tägige Geld-zurück-Garantie für neue Abonnenten
• Erstattungsanfragen nach 7 Tagen werden im Einzelfall behandelt
• Kontaktiere support@mindmate.app für Erstattungsanfragen`
        },
        {
          icon: Scale,
          title: "4. Geistiges Eigentum",
          content: `**Deine Inhalte**: Du behältst das Eigentum an allen von dir erstellten Inhalten (Tagebucheinträge, Chat-Nachrichten). Durch die Nutzung von MindMate gewährst du uns eine begrenzte Lizenz zur Verarbeitung dieser Inhalte zur Bereitstellung unserer Dienste.

**Unsere Inhalte**: Die MindMate-App, einschließlich ihres Designs, Codes, ihrer KI-Modelle und Übungen, ist unser geistiges Eigentum. Du darfst sie ohne Erlaubnis nicht kopieren, modifizieren oder verbreiten.

**Feedback**: Wenn du Feedback oder Vorschläge gibst, können wir diese ohne Vergütung zur Verbesserung von MindMate nutzen.`
        },
        {
          icon: Ban,
          title: "5. Einschränkungen & Haftungsausschlüsse",
          content: `**Keine medizinische Beratung**: MindMate bietet allgemeine Wellness-Unterstützung, keine medizinische, psychologische oder psychiatrische Beratung. Konsultiere immer qualifizierte Fachleute bei gesundheitlichen Bedenken.

**KI-Einschränkungen**: Unsere KI kann gelegentlich ungenaue oder nicht hilfreiche Antworten geben. Sie kann keine Erkrankungen diagnostizieren oder Behandlungen verschreiben.

**Dienstverfügbarkeit**: Wir streben hohe Verfügbarkeit an, können aber keinen ununterbrochenen Dienst garantieren. Wir können Funktionen mit Vorankündigung ändern oder einstellen.

**Haftungsbeschränkung**: Im gesetzlich zulässigen Umfang haftet MindMate nicht für indirekte, zufällige oder Folgeschäden, die aus deiner Nutzung des Dienstes entstehen.`
        },
        {
          icon: RefreshCw,
          title: "6. Änderungen & Kündigung",
          content: `**Änderungen der Bedingungen**: Wir können diese Bedingungen aktualisieren. Wesentliche Änderungen werden per In-App-Benachrichtigung oder E-Mail mitgeteilt. Die weitere Nutzung nach Änderungen gilt als Akzeptanz.

**Kontokündigung**: 
• Du kannst dein Konto jederzeit in den Einstellungen löschen
• Wir können Konten, die gegen diese Bedingungen verstoßen, sperren oder kündigen
• Bei Kündigung werden deine Daten gemäß unserer Datenschutzrichtlinie gelöscht

**Anwendbares Recht**: Diese Bedingungen unterliegen deutschem Recht. Streitigkeiten werden vor deutschen Gerichten beigelegt.`
        }
      ],
      contact: {
        title: "Fragen?",
        content: "Wenn du Fragen zu diesen Bedingungen hast, kontaktiere uns bitte unter:",
        email: "legal@mindmate.app"
      },
      agreement: "Durch die Nutzung von MindMate bestätigst du, dass du diese Nutzungsbedingungen gelesen und verstanden hast und ihnen zustimmst."
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
              <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                {section.content.split('**').map((part, i) => 
                  i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
                )}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Agreement Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground text-center"
        >
          {t.agreement}
        </motion.div>

        {/* Contact */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
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

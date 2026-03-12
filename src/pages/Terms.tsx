import { motion } from "framer-motion";
import { ArrowLeft, FileText, AlertTriangle, CreditCard, Scale, Ban, RefreshCw, Bot, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { StandalonePage } from "@/components/layout/StandalonePage";

export default function Terms() {
  const navigate = useNavigate();
  const { language } = useTranslation();

  const content = {
    en: {
      title: "Terms of Service",
      lastUpdated: "Last updated: March 2026",
      intro: "Welcome to Soulvay. By using our service, you agree to these terms. Please read them carefully.",
      sections: [
        {
          icon: FileText,
          title: "1. About Soulvay",
          content: `Soulvay is an AI-powered mental wellness companion designed to help you reflect, journal, and develop emotional awareness. The service is operated by:

**Soulvay**
Jonathan Jansen
Petersbergstraße 11, 53604 Bad Honnef, Germany
Email: service@soulvay.com

**Important Disclaimer**: Soulvay is NOT a substitute for professional mental health care, therapy, or medical advice. It is a supportive tool, not a licensed healthcare provider. Soulvay does not diagnose, treat, or cure any medical or psychological condition.

If you are experiencing a mental health crisis, please contact emergency services or a crisis hotline immediately.`
        },
        {
          icon: Bot,
          title: "2. AI Transparency & Disclosure",
          content: `**You are interacting with an AI system, not a human being.** All companions in Soulvay are powered by artificial intelligence. This disclosure is made in accordance with EU transparency requirements.

**AI System Details**:
• Soulvay uses large language models (LLMs) to generate conversational responses
• The AI companions simulate empathetic, supportive conversations but do not possess consciousness, emotions, or genuine understanding
• Voice features use AI-generated speech synthesis
• AI responses are generated in real-time and may vary between conversations

**AI Limitations**:
• The AI may occasionally produce inaccurate, incomplete, or unhelpful responses
• The AI cannot diagnose medical or psychological conditions
• The AI cannot prescribe treatments or medications
• The AI does not have access to real-time information or external databases
• The AI is not a substitute for human professional judgment

**No Emergency Support**: Soulvay's AI is not capable of handling emergencies. In a crisis, contact emergency services (112 in Germany/EU) immediately.`
        },
        {
          icon: AlertTriangle,
          title: "3. Eligibility & Acceptable Use",
          content: `**Age Requirement**: You must be at least 16 years old to use Soulvay. Users under 18 should have parental or guardian consent. We do not knowingly collect personal data from persons under 16 years of age. If we become aware that a user is under 16, we will promptly delete their account and data.

**Acceptable Use**: You agree to:
• Use Soulvay for personal, non-commercial purposes only
• Not share content that is illegal, harmful, or violates others' rights
• Not attempt to reverse-engineer or exploit our systems
• Not use the service to harm yourself or others
• Not misrepresent Soulvay's AI responses as professional advice

**Content Responsibility**: You are responsible for the content you create in Soulvay. We do not monitor individual content but may take action if we become aware of violations.`
        },
        {
          icon: CreditCard,
          title: "4. Subscriptions & Payments",
          content: `**Free Tier**: Soulvay offers a free tier with limited features (5 messages per day, basic journaling).

**Soulvay Plus Subscription**: Premium features are available through a paid subscription:
• **Monthly**: €9.99/month (including a 7-day free trial for first-time subscribers)
• **Yearly**: €79.00/year (no trial period)

**Billing**: 
• Subscriptions are billed in advance on a recurring basis
• Monthly subscriptions renew automatically every month; yearly subscriptions renew automatically every year
• Payments are processed securely through the respective platform's payment system
• You can cancel at any time from Settings; cancellation takes effect at the end of the current billing period

**Automatic Renewal**: Your subscription renews automatically unless cancelled at least 24 hours before the end of the current billing period. The renewal price corresponds to the then-current price of the plan.

**Right of Withdrawal**: As an EU consumer, you have a 14-day statutory right of withdrawal. See our separate Withdrawal Policy (/cancellation) for full details. By subscribing and consenting to immediate performance, you acknowledge that you may lose this right once digital content has been fully provided.

**Refunds**: 
• We additionally offer a voluntary 7-day money-back guarantee for new subscribers, independent of your statutory withdrawal rights
• Refund requests after 7 days are handled on a case-by-case basis
• Contact service@soulvay.com for refund inquiries

**Price Changes**: We reserve the right to change subscription prices. Existing subscribers will be notified at least 30 days before any price increase takes effect. Continued use after the price change constitutes acceptance.`
        },
        {
          icon: Scale,
          title: "5. Intellectual Property",
          content: `**Your Content**: You retain ownership of all content you create (journal entries, mood check-ins, chat messages). By using Soulvay, you grant us a limited, non-exclusive license to process this content solely for the purpose of providing and improving our services.

**Our Content**: The Soulvay app, including its design, code, AI models, exercises, and all associated materials, is the intellectual property of Soulvay / Jonathan Jansen. You may not copy, modify, distribute, or create derivative works without prior written permission.

**Feedback**: If you voluntarily provide feedback or suggestions, we may use them to improve Soulvay without compensation or attribution obligations.`
        },
        {
          icon: Ban,
          title: "6. Limitations & Disclaimers",
          content: `**No Medical Advice**: Soulvay provides general wellness support, not medical, psychological, or psychiatric advice. It is not a licensed healthcare service. Always consult qualified professionals for health concerns.

**No Guarantee of Results**: We do not guarantee specific outcomes from using Soulvay. Individual experiences may vary.

**Service Availability**: We strive for high availability but cannot guarantee uninterrupted or error-free service. We may modify, suspend, or discontinue features with reasonable notice where possible.

**Liability Limitation**: To the maximum extent permitted by applicable law, Soulvay's total liability is limited to the amount you have paid for the service in the 12 months preceding the claim. Soulvay is not liable for indirect, incidental, special, or consequential damages arising from your use of the service. This limitation does not apply to liability for intent or gross negligence, or to mandatory statutory liability (e.g., under the German Product Liability Act).

**Force Majeure**: Soulvay is not liable for delays or failures in performance resulting from circumstances beyond our reasonable control.`
        },
        {
          icon: Shield,
          title: "7. Data Protection",
          content: `The processing of your personal data is governed by our Privacy Policy (/privacy), which forms an integral part of these Terms. By using Soulvay, you acknowledge and agree to the data processing described therein.

Key points:
• Your data is encrypted and stored securely
• We do not sell your data to third parties
• You can delete your account and all data at any time
• Full details are available in our Privacy Policy`
        },
        {
          icon: RefreshCw,
          title: "8. Changes, Termination & Final Provisions",
          content: `**Changes to Terms**: We may update these terms to reflect changes in our services or legal requirements. Significant changes will be communicated via in-app notification or email at least 14 days before taking effect. Continued use after the effective date constitutes acceptance. If you disagree with the changes, you may terminate your account before the effective date.

**Account Termination**: 
• You may delete your account at any time from Settings > Account
• We may suspend or terminate accounts that violate these terms, after providing notice and an opportunity to remedy the violation where reasonable
• Upon termination, your data will be deleted per our Privacy Policy

**Severability**: If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect. The invalid provision shall be replaced by a valid provision that comes closest to the economic intent of the invalid provision.

**Entire Agreement**: These Terms, together with the Privacy Policy and Withdrawal Policy, constitute the entire agreement between you and Soulvay regarding the use of the service.

**Governing Law**: These terms are governed by the laws of the Federal Republic of Germany, excluding the UN Convention on Contracts for the International Sale of Goods (CISG). For consumers within the EU, mandatory consumer protection provisions of the country of habitual residence also apply.

**Jurisdiction**: The courts of Bonn, Germany, shall have jurisdiction for disputes with merchants. For consumers, the courts at the consumer's place of habitual residence or Bad Honnef shall have jurisdiction.

**Online Dispute Resolution**: The European Commission provides a platform for online dispute resolution: https://ec.europa.eu/consumers/odr/. We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board.`
        }
      ],
      contact: {
        title: "Questions?",
        content: "If you have questions about these terms, please contact us at:",
        email: "service@soulvay.com"
      },
      agreement: "By using Soulvay, you acknowledge that you have read, understood, and agree to these Terms of Service."
    },
    de: {
      title: "Nutzungsbedingungen",
      lastUpdated: "Zuletzt aktualisiert: März 2026",
      intro: "Willkommen bei Soulvay. Durch die Nutzung unseres Dienstes stimmst du diesen Bedingungen zu. Bitte lies sie sorgfältig durch.",
      sections: [
        {
          icon: FileText,
          title: "1. Über Soulvay",
          content: `Soulvay ist ein KI-gestützter Begleiter für mentales Wohlbefinden, der dir hilft zu reflektieren, Tagebuch zu führen und emotionales Bewusstsein zu entwickeln. Der Dienst wird betrieben von:

**Soulvay**
Jonathan Jansen
Petersbergstraße 11, 53604 Bad Honnef, Deutschland
E-Mail: service@soulvay.com

**Wichtiger Hinweis**: Soulvay ist KEIN Ersatz für professionelle psychische Gesundheitsversorgung, Therapie oder medizinische Beratung. Es ist ein unterstützendes Werkzeug, kein zugelassener Gesundheitsdienstleister. Soulvay diagnostiziert, behandelt oder heilt keine medizinischen oder psychologischen Erkrankungen.

Wenn du eine psychische Krise erlebst, kontaktiere bitte sofort den Notdienst oder eine Krisenhotline.`
        },
        {
          icon: Bot,
          title: "2. KI-Transparenz & Offenlegung",
          content: `**Du interagierst mit einem KI-System, nicht mit einem Menschen.** Alle Begleiter in Soulvay werden durch künstliche Intelligenz gesteuert. Diese Offenlegung erfolgt gemäß den EU-Transparenzanforderungen.

**KI-System-Details**:
• Soulvay verwendet große Sprachmodelle (LLMs) zur Generierung von Gesprächsantworten
• Die KI-Begleiter simulieren einfühlsame, unterstützende Gespräche, besitzen aber kein Bewusstsein, keine Emotionen und kein echtes Verständnis
• Sprachfunktionen verwenden KI-generierte Sprachsynthese
• KI-Antworten werden in Echtzeit generiert und können zwischen Gesprächen variieren

**KI-Einschränkungen**:
• Die KI kann gelegentlich ungenaue, unvollständige oder nicht hilfreiche Antworten geben
• Die KI kann keine medizinischen oder psychologischen Erkrankungen diagnostizieren
• Die KI kann keine Behandlungen oder Medikamente verschreiben
• Die KI hat keinen Zugang zu Echtzeitinformationen oder externen Datenbanken
• Die KI ist kein Ersatz für professionelles menschliches Urteil

**Keine Notfallunterstützung**: Die KI von Soulvay ist nicht in der Lage, Notfälle zu handhaben. In einer Krise kontaktiere sofort den Notdienst (112 in Deutschland/EU).`
        },
        {
          icon: AlertTriangle,
          title: "3. Berechtigung & Akzeptable Nutzung",
          content: `**Altersanforderung**: Du musst mindestens 16 Jahre alt sein, um Soulvay zu nutzen. Nutzer unter 18 Jahren sollten die Zustimmung der Eltern oder Erziehungsberechtigten haben. Wir erheben wissentlich keine personenbezogenen Daten von Personen unter 16 Jahren. Wenn uns bekannt wird, dass ein Nutzer unter 16 ist, werden wir sein Konto und seine Daten umgehend löschen.

**Akzeptable Nutzung**: Du stimmst zu:
• Soulvay nur für persönliche, nicht-kommerzielle Zwecke zu nutzen
• Keine illegalen, schädlichen oder die Rechte anderer verletzenden Inhalte zu teilen
• Nicht zu versuchen, unsere Systeme zu reverse-engineeren oder auszunutzen
• Den Dienst nicht zu nutzen, um dir selbst oder anderen zu schaden
• KI-Antworten von Soulvay nicht als professionelle Beratung darzustellen

**Inhaltsverantwortung**: Du bist für die von dir in Soulvay erstellten Inhalte verantwortlich. Wir überwachen keine individuellen Inhalte, können aber bei Bekanntwerden von Verstößen Maßnahmen ergreifen.`
        },
        {
          icon: CreditCard,
          title: "4. Abonnements & Zahlungen",
          content: `**Kostenlose Stufe**: Soulvay bietet eine kostenlose Stufe mit eingeschränkten Funktionen (5 Nachrichten pro Tag, Basis-Tagebuch).

**Soulvay Plus-Abonnement**: Premium-Funktionen sind über ein kostenpflichtiges Abonnement verfügbar:
• **Monatlich**: €9,99/Monat (einschließlich einer 7-tägigen kostenlosen Testphase für Erstabonnenten)
• **Jährlich**: €79,00/Jahr (ohne Testphase)

**Abrechnung**: 
• Abonnements werden im Voraus auf wiederkehrender Basis abgerechnet
• Monatsabonnements verlängern sich automatisch jeden Monat; Jahresabonnements verlängern sich automatisch jedes Jahr
• Zahlungen werden sicher über das jeweilige Zahlungssystem der Plattform abgewickelt
• Du kannst jederzeit in den Einstellungen kündigen; die Kündigung wird zum Ende des aktuellen Abrechnungszeitraums wirksam

**Automatische Verlängerung**: Dein Abonnement verlängert sich automatisch, sofern es nicht mindestens 24 Stunden vor Ablauf des aktuellen Abrechnungszeitraums gekündigt wird. Der Verlängerungspreis entspricht dem dann gültigen Preis des Plans.

**Widerrufsrecht**: Als EU-Verbraucher hast du ein gesetzliches 14-tägiges Widerrufsrecht. Siehe unsere separate Widerrufsbelehrung (/cancellation) für alle Details. Mit dem Abonnement und der Zustimmung zur sofortigen Ausführung nimmst du zur Kenntnis, dass du dieses Recht verlieren kannst, sobald die digitalen Inhalte vollständig bereitgestellt wurden.

**Erstattungen**: 
• Wir bieten zusätzlich eine freiwillige 7-tägige Geld-zurück-Garantie für neue Abonnenten, unabhängig von deinen gesetzlichen Widerrufsrechten
• Erstattungsanfragen nach 7 Tagen werden im Einzelfall behandelt
• Kontaktiere service@soulvay.com für Erstattungsanfragen

**Preisänderungen**: Wir behalten uns das Recht vor, Abonnementpreise zu ändern. Bestehende Abonnenten werden mindestens 30 Tage vor Inkrafttreten einer Preiserhöhung informiert. Die weitere Nutzung nach der Preisänderung gilt als Akzeptanz.`
        },
        {
          icon: Scale,
          title: "5. Geistiges Eigentum",
          content: `**Deine Inhalte**: Du behältst das Eigentum an allen von dir erstellten Inhalten (Tagebucheinträge, Stimmungs-Check-ins, Chat-Nachrichten). Durch die Nutzung von Soulvay gewährst du uns eine begrenzte, nicht-exklusive Lizenz zur Verarbeitung dieser Inhalte ausschließlich zum Zweck der Bereitstellung und Verbesserung unserer Dienste.

**Unsere Inhalte**: Die Soulvay-App, einschließlich ihres Designs, Codes, KI-Modelle, Übungen und aller zugehörigen Materialien, ist geistiges Eigentum von Soulvay / Jonathan Jansen. Du darfst sie ohne vorherige schriftliche Genehmigung nicht kopieren, modifizieren, verbreiten oder abgeleitete Werke erstellen.

**Feedback**: Wenn du freiwillig Feedback oder Vorschläge gibst, können wir diese ohne Vergütungs- oder Namensnennungspflicht zur Verbesserung von Soulvay nutzen.`
        },
        {
          icon: Ban,
          title: "6. Einschränkungen & Haftungsausschlüsse",
          content: `**Keine medizinische Beratung**: Soulvay bietet allgemeine Wellness-Unterstützung, keine medizinische, psychologische oder psychiatrische Beratung. Es handelt sich nicht um einen zugelassenen Gesundheitsdienst. Konsultiere immer qualifizierte Fachleute bei gesundheitlichen Bedenken.

**Keine Ergebnisgarantie**: Wir garantieren keine bestimmten Ergebnisse durch die Nutzung von Soulvay. Individuelle Erfahrungen können variieren.

**Dienstverfügbarkeit**: Wir streben hohe Verfügbarkeit an, können aber keinen ununterbrochenen oder fehlerfreien Dienst garantieren. Wir können Funktionen mit angemessener Vorankündigung ändern, aussetzen oder einstellen.

**Haftungsbeschränkung**: Im gesetzlich zulässigen Umfang ist die Gesamthaftung von Soulvay auf den Betrag beschränkt, den du in den 12 Monaten vor dem Anspruch für den Dienst gezahlt hast. Soulvay haftet nicht für indirekte, zufällige, besondere oder Folgeschäden, die aus deiner Nutzung des Dienstes entstehen. Diese Beschränkung gilt nicht für die Haftung aus Vorsatz oder grober Fahrlässigkeit oder für gesetzliche Pflichthaftung (z.B. nach dem Produkthaftungsgesetz).

**Höhere Gewalt**: Soulvay haftet nicht für Verzögerungen oder Leistungsausfälle, die auf Umstände außerhalb unserer angemessenen Kontrolle zurückzuführen sind.`
        },
        {
          icon: Shield,
          title: "7. Datenschutz",
          content: `Die Verarbeitung deiner personenbezogenen Daten wird durch unsere Datenschutzerklärung (/privacy) geregelt, die integraler Bestandteil dieser Bedingungen ist. Durch die Nutzung von Soulvay nimmst du die darin beschriebene Datenverarbeitung zur Kenntnis und stimmst ihr zu.

Wesentliche Punkte:
• Deine Daten werden verschlüsselt und sicher gespeichert
• Wir verkaufen deine Daten nicht an Dritte
• Du kannst dein Konto und alle Daten jederzeit löschen
• Alle Details findest du in unserer Datenschutzerklärung`
        },
        {
          icon: RefreshCw,
          title: "8. Änderungen, Kündigung & Schlussbestimmungen",
          content: `**Änderungen der Bedingungen**: Wir können diese Bedingungen aktualisieren, um Änderungen unserer Dienste oder gesetzlicher Anforderungen widerzuspiegeln. Wesentliche Änderungen werden per In-App-Benachrichtigung oder E-Mail mindestens 14 Tage vor Inkrafttreten mitgeteilt. Die weitere Nutzung nach dem Inkrafttreten gilt als Akzeptanz. Wenn du mit den Änderungen nicht einverstanden bist, kannst du dein Konto vor dem Inkrafttreten kündigen.

**Kontokündigung**: 
• Du kannst dein Konto jederzeit unter Einstellungen > Konto löschen
• Wir können Konten, die gegen diese Bedingungen verstoßen, sperren oder kündigen, nachdem wir eine Benachrichtigung und eine angemessene Möglichkeit zur Behebung des Verstoßes gegeben haben
• Bei Kündigung werden deine Daten gemäß unserer Datenschutzrichtlinie gelöscht

**Salvatorische Klausel**: Sollte eine Bestimmung dieser Bedingungen unwirksam oder undurchsetzbar sein, bleiben die übrigen Bestimmungen in vollem Umfang wirksam. Die unwirksame Bestimmung wird durch eine wirksame Bestimmung ersetzt, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.

**Gesamte Vereinbarung**: Diese Bedingungen bilden zusammen mit der Datenschutzerklärung und der Widerrufsbelehrung die gesamte Vereinbarung zwischen dir und Soulvay über die Nutzung des Dienstes.

**Anwendbares Recht**: Diese Bedingungen unterliegen dem Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG). Für Verbraucher innerhalb der EU gelten zusätzlich die zwingenden Verbraucherschutzbestimmungen des Wohnsitzlandes.

**Gerichtsstand**: Für Streitigkeiten mit Kaufleuten sind die Gerichte in Bonn, Deutschland, zuständig. Für Verbraucher sind die Gerichte am Wohnsitz des Verbrauchers oder in Bad Honnef zuständig.

**Online-Streitbeilegung**: Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: https://ec.europa.eu/consumers/odr/. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.`
        }
      ],
      contact: {
        title: "Fragen?",
        content: "Wenn du Fragen zu diesen Bedingungen hast, kontaktiere uns bitte unter:",
        email: "service@soulvay.com"
      },
      agreement: "Durch die Nutzung von Soulvay bestätigst du, dass du diese Nutzungsbedingungen gelesen und verstanden hast und ihnen zustimmst."
    }
  };

  const t = content[language];

  return (
    <StandalonePage>
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
    </StandalonePage>
  );
}
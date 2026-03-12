import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Eye, Trash2, Download, Bell, Bot, Scale, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { StandalonePage } from "@/components/layout/StandalonePage";

export default function Privacy() {
  const navigate = useNavigate();
  const { language } = useTranslation();

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: March 2026",
      intro: "Your privacy matters to us. Soulvay is designed with your privacy and security as core principles. This policy explains how we handle your personal information in accordance with the EU General Data Protection Regulation (GDPR) and applicable German data protection law.",
      controller: {
        icon: Scale,
        title: "Data Controller",
        content: `The data controller responsible for processing your personal data is:

**Soulvay**
Jonathan Jansen
Petersbergstraße 11
53604 Bad Honnef, Germany
Email: service@soulvay.com
Phone: +49 176 44680467

As a small business with fewer than 250 employees that does not process special categories of data on a large scale, the appointment of a Data Protection Officer (DPO) is not required under Art. 37 GDPR. For all data protection inquiries, please contact us directly at the address above.`
      },
      sections: [
        {
          icon: Lock,
          title: "Data We Collect",
          content: `We collect only the information necessary to provide our services:

• **Account Information**: Email address and optional display name when you create an account (Art. 6(1)(b) GDPR — contract performance).
• **Usage Data**: Your journal entries, mood check-ins, and chat conversations to provide personalized support (Art. 6(1)(b) GDPR — contract performance).
• **Voice Data**: If you use the Face-to-Face voice mode, audio data is transmitted in real-time to our voice provider for speech synthesis. Audio data is processed transiently and not stored after the session ends.
• **Technical Data**: Device type, browser version, and anonymized usage patterns to improve the app (Art. 6(1)(f) GDPR — legitimate interest in service improvement).
• **Payment Data**: Payment information is processed directly by our payment providers (Stripe, Apple, Google) and is not stored by Soulvay.

We do NOT collect:
• Precise location data
• Contact lists
• Financial information (payments are handled securely by our payment processors)
• Data from other apps on your device
• Data from persons we know to be under 16 years of age`
        },
        {
          icon: Shield,
          title: "How We Protect Your Data",
          content: `Your mental wellness data deserves the highest protection:

• **Encryption**: All data is encrypted in transit using TLS 1.2+ and stored securely using enterprise-grade cloud infrastructure with encryption at rest.
• **Secure Infrastructure**: We use industry-standard security practices, including role-based access controls, regular security assessments, and trusted cloud providers.
• **Access Controls**: Only you can access your personal data through your authenticated account. Our technical team may access infrastructure logs for operational purposes but cannot read your journal entries or chat conversations in plain text.
• **No Third-Party Sharing**: We never sell or share your personal data with advertisers or data brokers.
• **Incident Response**: In the unlikely event of a data breach affecting your personal data, we will notify you and the relevant supervisory authority within 72 hours as required by Art. 33 GDPR.`
        },
        {
          icon: Eye,
          title: "Purposes of Processing",
          content: `Your data is used solely to:

• Provide personalized AI responses in chat (Art. 6(1)(b) — contract performance)
• Generate your mood insights and weekly recaps (Art. 6(1)(b) — contract performance)
• Improve our services using anonymized, aggregated patterns (Art. 6(1)(f) — legitimate interest)
• Send you service-related notifications such as password resets (Art. 6(1)(b) — contract performance)
• Send optional marketing communications (Art. 6(1)(a) — consent, revocable at any time)
• Ensure platform security and prevent abuse (Art. 6(1)(f) — legitimate interest)

We will NEVER use your data for:
• Targeted advertising
• Profiling for external parties
• Training AI models with identifiable personal content
• Selling or renting to any third party`
        },
        {
          icon: Bot,
          title: "Note on Wellness Data (Art. 9 GDPR)",
          content: `Soulvay processes data related to your emotional state and well-being (journal entries, mood check-ins, chat conversations about feelings). We want to be transparent about how we treat this data:

**Our position**: The self-reported mood values and general reflective journal content processed by Soulvay are treated as general personal data, not as "health data" within the strict meaning of Art. 9 GDPR. Soulvay does not perform medical diagnosis, treatment, or health assessments.

**Precautionary measures**: Nevertheless, we apply enhanced protection to all wellness-related data:
• We treat all emotional and reflective content with the same level of security as special category data
• We apply data minimization principles — we only process what is necessary
• We do not share identifiable wellness data with any third party
• We provide easy and immediate deletion upon request
• AI processing is limited to providing the contracted service

**Your control**: You can delete any or all of your data at any time through Settings > Account > Delete Account. Deletion is immediate and irreversible.`
        },
        {
          icon: Shield,
          title: "Legal Basis for Processing (Art. 6 GDPR)",
          content: `We process your data based on the following legal grounds:

• **Contract performance (Art. 6(1)(b))**: Processing necessary to provide the Soulvay service, including AI chat, journaling, mood tracking, and subscription management.
• **Consent (Art. 6(1)(a))**: For optional features like analytics cookies, marketing cookies, and newsletter communications. You can withdraw consent at any time via Settings or the Cookie Settings without affecting the lawfulness of prior processing.
• **Legitimate interest (Art. 6(1)(f))**: For service improvement using anonymized data, security monitoring, fraud prevention, and debugging. Our legitimate interest does not override your fundamental rights and freedoms.
• **Legal obligation (Art. 6(1)(c))**: For tax and accounting records related to subscription payments, as required by German tax law.`
        },
        {
          icon: Globe,
          title: "Third-Party Service Providers & International Transfers",
          content: `We use the following third-party processors (Art. 28 GDPR) to deliver our services. Some providers are based in the USA, which the European Commission does not consider to provide an adequate level of data protection. We have therefore implemented appropriate safeguards:

• **Google (Alphabet Inc., USA)**: AI language model provider (Gemini) for generating chat responses. Conversations are processed in real-time. Data transfer is secured under the EU-US Data Privacy Framework and supplementary Standard Contractual Clauses (SCCs).
• **Supabase (Supabase Inc., USA)**: Cloud infrastructure for data storage, authentication, and backend functions. Data processing agreement in place with SCCs for EU-US data transfer.
• **ElevenLabs (ElevenLabs Inc., USA)**: Voice synthesis for the Face-to-Face voice mode. Audio data is transmitted in real-time and processed transiently — not stored by ElevenLabs after the session. Data transfer secured under SCCs.
• **Stripe (Stripe Inc., USA)**: Payment processing for web subscriptions. Stripe processes payment data independently as a data controller under its own privacy policy. EU-US Data Privacy Framework certified.
• **Apple Inc. (USA) / RevenueCat Inc. (USA)**: In-app purchase processing for iOS subscriptions. Apple processes purchase data as an independent controller. RevenueCat acts as a processor under SCCs.
• **Resend (Resend Inc., USA)**: Transactional email delivery (welcome emails, weekly recaps, password resets). Data processing agreement with SCCs in place.

All providers are contractually obligated to process data exclusively for service delivery and maintain appropriate technical and organizational security measures. We regularly review and assess the adequacy of these safeguards.`
        },
        {
          icon: Bot,
          title: "Automated Decision-Making (Art. 22 GDPR)",
          content: `Soulvay uses AI to generate chat responses, mood insights, and weekly recaps. This processing involves automated analysis of your input, but:

• **No legally significant decisions**: The AI does not make decisions that produce legal effects or similarly significantly affect you. It provides conversational support and general wellness reflections only.
• **Human override**: All AI-generated content is presented as suggestions or reflections. You retain full control over how you interpret and act on AI responses.
• **Crisis detection**: The system includes automated pattern recognition for crisis indicators. If detected, the system provides resource links and crisis hotline information — it does not make decisions about your care or contact emergency services on your behalf.

You have the right to request human review of any automated processing that affects you.`
        },
        {
          icon: Download,
          title: "Your Rights (Art. 15–22 GDPR)",
          content: `You have the following rights regarding your personal data:

• **Right of Access (Art. 15)**: Request information about what personal data we process about you.
• **Right to Rectification (Art. 16)**: Update or correct your profile information at any time via Settings.
• **Right to Erasure (Art. 17)**: Delete your account and all associated data permanently via Settings > Account > Delete Account, or by emailing service@soulvay.com.
• **Right to Data Portability (Art. 20)**: Download your data in a structured, commonly used, machine-readable format (JSON).
• **Right to Object (Art. 21)**: Object to processing based on legitimate interests. You can opt out of analytics and non-essential data processing via Settings or Cookie Settings.
• **Right to Restriction (Art. 18)**: Request restriction of processing in certain circumstances.
• **Right to Withdraw Consent (Art. 7(3))**: Withdraw any given consent at any time without affecting the lawfulness of prior processing.

To exercise these rights, go to Settings > Account or contact us at service@soulvay.com. We will respond without undue delay and in any event within one month of receipt of your request, in accordance with Art. 12(3) GDPR.

**Right to Lodge a Complaint (Art. 77 GDPR)**: You have the right to lodge a complaint with a supervisory authority. The competent authority for Soulvay is:

Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW)
Postfach 20 04 44, 40102 Düsseldorf
https://www.ldi.nrw.de`
        },
        {
          icon: Trash2,
          title: "Data Retention",
          content: `• **Active Accounts**: Data is retained while your account is active and the service relationship exists.
• **Deleted Accounts**: All personal data is permanently deleted within 30 days of account deletion. Backup copies are purged within the standard backup rotation cycle.
• **Subscription Records**: Financial and tax-relevant records are retained for 10 years after the end of the business relationship, as required by German commercial and tax law (§ 147 AO, § 257 HGB).
• **Anonymized Data**: We may retain anonymized, aggregated insights (which cannot be linked back to you) indefinitely for service improvement.
• **Legal Requirements**: We may retain data longer if required by law or to establish, exercise, or defend legal claims.`
        },
        {
          icon: Bell,
          title: "Updates to This Policy",
          content: `We may update this policy to reflect changes in our practices, technology, or legal requirements. We will notify you of significant changes via:

• In-app notification
• Email (if you have an active account)

We will provide at least 14 days notice before material changes take effect. Continued use of Soulvay after changes constitutes acceptance of the updated policy. The latest version is always available at /privacy.`
        }
      ],
      contact: {
        title: "Contact Us",
        content: "For privacy-related questions, data subject requests, or concerns, please contact us at:",
        email: "service@soulvay.com"
      }
    },
    de: {
      title: "Datenschutzerklärung",
      lastUpdated: "Zuletzt aktualisiert: März 2026",
      intro: "Deine Privatsphäre ist uns wichtig. Soulvay wurde mit Datenschutz und Sicherheit als Grundprinzipien entwickelt. Diese Erklärung informiert dich gemäß der EU-Datenschutz-Grundverordnung (DSGVO) und dem geltenden deutschen Datenschutzrecht über den Umgang mit deinen personenbezogenen Daten.",
      controller: {
        icon: Scale,
        title: "Verantwortlicher",
        content: `Verantwortlicher für die Verarbeitung deiner personenbezogenen Daten ist:

**Soulvay**
Jonathan Jansen
Petersbergstraße 11
53604 Bad Honnef, Deutschland
E-Mail: service@soulvay.com
Telefon: +49 176 44680467

Als Kleinunternehmen mit weniger als 250 Mitarbeitern, das keine besonderen Datenkategorien in großem Umfang verarbeitet, ist die Bestellung eines Datenschutzbeauftragten nach Art. 37 DSGVO nicht erforderlich. Für alle datenschutzrechtlichen Anfragen wende dich bitte direkt an die oben genannte Adresse.`
      },
      sections: [
        {
          icon: Lock,
          title: "Daten, die wir erheben",
          content: `Wir erheben nur die Informationen, die für unsere Dienste notwendig sind:

• **Kontoinformationen**: E-Mail-Adresse und optionaler Anzeigename bei der Kontoerstellung (Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung).
• **Nutzungsdaten**: Deine Tagebucheinträge, Stimmungs-Check-ins und Chat-Gespräche für personalisierte Unterstützung (Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung).
• **Sprachdaten**: Wenn du den Face-to-Face-Sprachmodus nutzt, werden Audiodaten in Echtzeit an unseren Sprachanbieter zur Sprachsynthese übertragen. Audiodaten werden nur vorübergehend verarbeitet und nach der Sitzung nicht gespeichert.
• **Technische Daten**: Gerätetyp, Browserversion und anonymisierte Nutzungsmuster zur App-Verbesserung (Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse an Serviceverbesserung).
• **Zahlungsdaten**: Zahlungsinformationen werden direkt von unseren Zahlungsanbietern (Stripe, Apple, Google) verarbeitet und nicht von Soulvay gespeichert.

Wir erheben NICHT:
• Genaue Standortdaten
• Kontaktlisten
• Finanzinformationen (Zahlungen werden sicher über unsere Zahlungsabwickler abgewickelt)
• Daten von anderen Apps auf deinem Gerät
• Daten von Personen, von denen wir wissen, dass sie unter 16 Jahre alt sind`
        },
        {
          icon: Shield,
          title: "Wie wir deine Daten schützen",
          content: `Deine Wellness-Daten verdienen höchsten Schutz:

• **Verschlüsselung**: Alle Daten werden bei der Übertragung mit TLS 1.2+ verschlüsselt und sicher in einer Enterprise-Cloud-Infrastruktur mit Verschlüsselung im Ruhezustand gespeichert.
• **Sichere Infrastruktur**: Wir nutzen branchenübliche Sicherheitsstandards, einschließlich rollenbasierter Zugriffskontrollen, regelmäßiger Sicherheitsbewertungen und vertrauenswürdiger Cloud-Anbieter.
• **Zugriffskontrollen**: Nur du kannst über dein authentifiziertes Konto auf deine persönlichen Daten zugreifen. Unser technisches Team kann zu Betriebszwecken auf Infrastruktur-Logs zugreifen, aber deine Tagebucheinträge oder Chat-Gespräche nicht im Klartext lesen.
• **Keine Weitergabe an Dritte**: Wir verkaufen oder teilen deine persönlichen Daten niemals mit Werbetreibenden oder Datenhändlern.
• **Vorfallreaktion**: Im unwahrscheinlichen Fall einer Datenschutzverletzung, die deine personenbezogenen Daten betrifft, werden wir dich und die zuständige Aufsichtsbehörde innerhalb von 72 Stunden gemäß Art. 33 DSGVO benachrichtigen.`
        },
        {
          icon: Eye,
          title: "Zwecke der Verarbeitung",
          content: `Deine Daten werden ausschließlich verwendet für:

• Personalisierte KI-Antworten im Chat (Art. 6 Abs. 1 lit. b — Vertragserfüllung)
• Erstellung deiner Stimmungseinblicke und wöchentlichen Zusammenfassungen (Art. 6 Abs. 1 lit. b — Vertragserfüllung)
• Verbesserung unserer Dienste anhand anonymisierter, aggregierter Muster (Art. 6 Abs. 1 lit. f — berechtigtes Interesse)
• Versand dienstbezogener Benachrichtigungen wie Passwortzurücksetzungen (Art. 6 Abs. 1 lit. b — Vertragserfüllung)
• Versand optionaler Marketingkommunikation (Art. 6 Abs. 1 lit. a — Einwilligung, jederzeit widerrufbar)
• Gewährleistung der Plattformsicherheit und Missbrauchsprävention (Art. 6 Abs. 1 lit. f — berechtigtes Interesse)

Wir werden deine Daten NIEMALS verwenden für:
• Zielgerichtete Werbung
• Profilbildung für externe Parteien
• Training von KI-Modellen mit identifizierbaren persönlichen Inhalten
• Verkauf oder Vermietung an Dritte`
        },
        {
          icon: Bot,
          title: "Hinweis zu Wellness-Daten (Art. 9 DSGVO)",
          content: `Soulvay verarbeitet Daten, die sich auf deinen emotionalen Zustand und dein Wohlbefinden beziehen (Tagebucheinträge, Stimmungs-Check-ins, Chat-Gespräche über Gefühle). Wir möchten transparent darüber informieren, wie wir diese Daten behandeln:

**Unsere Position**: Die selbst berichteten Stimmungswerte und allgemeinen reflektiven Tagebuchinhalte, die von Soulvay verarbeitet werden, werden als allgemeine personenbezogene Daten behandelt, nicht als „Gesundheitsdaten" im strengen Sinne von Art. 9 DSGVO. Soulvay führt keine medizinische Diagnostik, Behandlung oder Gesundheitsbewertung durch.

**Vorsorgemaßnahmen**: Dennoch wenden wir einen erhöhten Schutz auf alle Wellness-bezogenen Daten an:
• Wir behandeln alle emotionalen und reflektiven Inhalte mit dem gleichen Sicherheitsniveau wie besondere Datenkategorien
• Wir wenden Datenminimierungsprinzipien an — wir verarbeiten nur das Notwendige
• Wir teilen keine identifizierbaren Wellness-Daten mit Dritten
• Wir ermöglichen einfache und sofortige Löschung auf Anfrage
• Die KI-Verarbeitung beschränkt sich auf die Erbringung des vertraglich vereinbarten Dienstes

**Deine Kontrolle**: Du kannst jederzeit alle deine Daten über Einstellungen > Konto > Konto löschen entfernen. Die Löschung ist sofort und unwiderruflich.`
        },
        {
          icon: Shield,
          title: "Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO)",
          content: `Wir verarbeiten deine Daten auf folgenden Rechtsgrundlagen:

• **Vertragserfüllung (Art. 6 Abs. 1 lit. b)**: Verarbeitung, die zur Erbringung des Soulvay-Dienstes erforderlich ist, einschließlich KI-Chat, Tagebuch, Stimmungstracking und Abonnementverwaltung.
• **Einwilligung (Art. 6 Abs. 1 lit. a)**: Für optionale Funktionen wie Analytics-Cookies, Marketing-Cookies und Newsletter-Kommunikation. Du kannst deine Einwilligung jederzeit über die Einstellungen oder die Cookie-Einstellungen widerrufen, ohne dass die Rechtmäßigkeit der vorherigen Verarbeitung berührt wird.
• **Berechtigtes Interesse (Art. 6 Abs. 1 lit. f)**: Zur Serviceverbesserung mit anonymisierten Daten, Sicherheitsüberwachung, Betrugsprävention und Fehlerbehebung. Unser berechtigtes Interesse überwiegt nicht deine Grundrechte und Grundfreiheiten.
• **Gesetzliche Verpflichtung (Art. 6 Abs. 1 lit. c)**: Für steuerliche und buchhalterische Aufzeichnungen im Zusammenhang mit Abonnementzahlungen, wie nach deutschem Steuerrecht erforderlich.`
        },
        {
          icon: Globe,
          title: "Drittanbieter und internationale Datenübermittlung",
          content: `Wir nutzen folgende Auftragsverarbeiter (Art. 28 DSGVO) zur Erbringung unserer Dienste. Einige Anbieter haben ihren Sitz in den USA, für die die Europäische Kommission kein angemessenes Datenschutzniveau festgestellt hat. Wir haben daher geeignete Garantien implementiert:

• **Google (Alphabet Inc., USA)**: KI-Sprachmodell-Anbieter (Gemini) zur Generierung von Chat-Antworten. Gespräche werden in Echtzeit verarbeitet. Der Datentransfer ist über den EU-US Data Privacy Framework und ergänzende Standardvertragsklauseln (SCCs) abgesichert.
• **Supabase (Supabase Inc., USA)**: Cloud-Infrastruktur für Datenspeicherung, Authentifizierung und Backend-Funktionen. Auftragsverarbeitungsvertrag mit SCCs für den EU-US-Datentransfer abgeschlossen.
• **ElevenLabs (ElevenLabs Inc., USA)**: Sprachsynthese für den Face-to-Face-Sprachmodus. Audiodaten werden in Echtzeit übertragen und nur vorübergehend verarbeitet — nach der Sitzung nicht von ElevenLabs gespeichert. Datentransfer durch SCCs abgesichert.
• **Stripe (Stripe Inc., USA)**: Zahlungsabwicklung für Web-Abonnements. Stripe verarbeitet Zahlungsdaten eigenständig als Verantwortlicher unter seiner eigenen Datenschutzerklärung. EU-US Data Privacy Framework zertifiziert.
• **Apple Inc. (USA) / RevenueCat Inc. (USA)**: Verarbeitung von In-App-Käufen für iOS-Abonnements. Apple verarbeitet Kaufdaten als eigenständiger Verantwortlicher. RevenueCat agiert als Auftragsverarbeiter unter SCCs.
• **Resend (Resend Inc., USA)**: Versand transaktionaler E-Mails (Willkommens-E-Mails, Wochenrückblicke, Passwortzurücksetzungen). Auftragsverarbeitungsvertrag mit SCCs abgeschlossen.

Alle Anbieter sind vertraglich verpflichtet, Daten ausschließlich zur Diensterbringung zu verarbeiten und angemessene technische und organisatorische Sicherheitsmaßnahmen einzuhalten. Wir überprüfen und bewerten regelmäßig die Angemessenheit dieser Garantien.`
        },
        {
          icon: Bot,
          title: "Automatisierte Entscheidungsfindung (Art. 22 DSGVO)",
          content: `Soulvay verwendet KI zur Generierung von Chat-Antworten, Stimmungseinblicken und Wochenrückblicken. Diese Verarbeitung umfasst automatisierte Analyse deiner Eingaben, aber:

• **Keine rechtlich erheblichen Entscheidungen**: Die KI trifft keine Entscheidungen, die rechtliche Wirkungen entfalten oder dich in ähnlicher Weise erheblich beeinträchtigen. Sie bietet lediglich gesprächsbasierte Unterstützung und allgemeine Wellness-Reflexionen.
• **Menschliche Überprüfung**: Alle KI-generierten Inhalte werden als Vorschläge oder Reflexionen präsentiert. Du behältst die volle Kontrolle darüber, wie du KI-Antworten interpretierst und darauf reagierst.
• **Krisenerkennung**: Das System enthält automatisierte Mustererkennung für Krisenindikatoren. Bei Erkennung stellt das System Ressourcen-Links und Krisenhotline-Informationen bereit — es trifft keine Entscheidungen über deine Versorgung und kontaktiert nicht eigenständig Notdienste.

Du hast das Recht, eine menschliche Überprüfung jeder automatisierten Verarbeitung zu verlangen, die dich betrifft.`
        },
        {
          icon: Download,
          title: "Deine Rechte (Art. 15–22 DSGVO)",
          content: `Du hast folgende Rechte bezüglich deiner personenbezogenen Daten:

• **Auskunftsrecht (Art. 15)**: Auskunft darüber, welche personenbezogenen Daten wir über dich verarbeiten.
• **Recht auf Berichtigung (Art. 16)**: Aktualisierung oder Korrektur deiner Profilinformationen jederzeit über die Einstellungen.
• **Recht auf Löschung (Art. 17)**: Löschung deines Kontos und aller zugehörigen Daten dauerhaft über Einstellungen > Konto > Konto löschen oder per E-Mail an service@soulvay.com.
• **Recht auf Datenübertragbarkeit (Art. 20)**: Download deiner Daten in einem strukturierten, gängigen, maschinenlesbaren Format (JSON).
• **Widerspruchsrecht (Art. 21)**: Widerspruch gegen die Verarbeitung auf Basis berechtigter Interessen. Du kannst Analytics und nicht-essentielle Datenverarbeitung über die Einstellungen oder Cookie-Einstellungen deaktivieren.
• **Recht auf Einschränkung (Art. 18)**: Einschränkung der Verarbeitung unter bestimmten Umständen.
• **Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3)**: Widerruf jeder erteilten Einwilligung jederzeit, ohne dass die Rechtmäßigkeit der vorherigen Verarbeitung berührt wird.

Um diese Rechte auszuüben, gehe zu Einstellungen > Konto oder kontaktiere uns unter service@soulvay.com. Wir antworten unverzüglich, in jedem Fall aber innerhalb eines Monats nach Eingang deiner Anfrage, gemäß Art. 12 Abs. 3 DSGVO.

**Beschwerderecht (Art. 77 DSGVO)**: Du hast das Recht, Beschwerde bei einer Aufsichtsbehörde einzulegen. Die für Soulvay zuständige Behörde ist:

Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW)
Postfach 20 04 44, 40102 Düsseldorf
https://www.ldi.nrw.de`
        },
        {
          icon: Trash2,
          title: "Datenspeicherung",
          content: `• **Aktive Konten**: Daten werden gespeichert, solange dein Konto aktiv ist und die Dienstbeziehung besteht.
• **Gelöschte Konten**: Alle persönlichen Daten werden innerhalb von 30 Tagen nach der Kontolöschung dauerhaft gelöscht. Sicherungskopien werden im Rahmen des regulären Backup-Rotationszyklus bereinigt.
• **Abonnement-Aufzeichnungen**: Finanz- und steuerrelevante Aufzeichnungen werden gemäß deutschem Handels- und Steuerrecht 10 Jahre nach Ende der Geschäftsbeziehung aufbewahrt (§ 147 AO, § 257 HGB).
• **Anonymisierte Daten**: Wir können anonymisierte, aggregierte Erkenntnisse (die nicht auf dich zurückgeführt werden können) unbegrenzt für die Serviceverbesserung aufbewahren.
• **Gesetzliche Anforderungen**: Wir können Daten länger aufbewahren, wenn dies gesetzlich erforderlich ist oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.`
        },
        {
          icon: Bell,
          title: "Aktualisierungen dieser Erklärung",
          content: `Wir können diese Datenschutzerklärung aktualisieren, um Änderungen in unseren Praktiken, Technologien oder gesetzlichen Anforderungen widerzuspiegeln. Wir werden dich über wesentliche Änderungen informieren über:

• In-App-Benachrichtigung
• E-Mail (wenn du ein aktives Konto hast)

Wir gewähren mindestens 14 Tage Vorlauf vor Inkrafttreten wesentlicher Änderungen. Die weitere Nutzung von Soulvay nach den Änderungen gilt als Akzeptanz der aktualisierten Erklärung. Die jeweils aktuelle Version ist immer unter /privacy verfügbar.`
        }
      ],
      contact: {
        title: "Kontakt",
        content: "Für datenschutzbezogene Fragen, Betroffenenrechte-Anfragen oder Bedenken kontaktiere uns bitte unter:",
        email: "service@soulvay.com"
      }
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

        {/* Data Controller */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-6 border border-border/40 shadow-soft mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <t.controller.icon className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t.controller.title}</h2>
          </div>
          <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line prose prose-sm dark:prose-invert max-w-none">
            {t.controller.content.split('**').map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
            )}
          </div>
        </motion.section>

        {/* Sections */}
        <div className="space-y-8">
          {t.sections.map((section, index) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
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
    </StandalonePage>
  );
}
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Mail, Phone, Globe, Scale, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function Impressum() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<"en" | "de">("de");

  useEffect(() => {
    const stored = localStorage.getItem("mindmate_language") || "de";
    setLanguage(stored as "en" | "de");
  }, []);

  const texts = {
    de: {
      title: "Impressum",
      subtitle: "Angaben gemäß § 5 TMG",
      provider: "Anbieter",
      companyName: "MindMade",
      businessType: "Kleingewerbe",
      address: "Petersbergstraße 11",
      city: "53604 Bad Honnef",
      country: "Deutschland",
      contact: "Kontakt",
      email: "joni.jansen00@gmail.com",
      phone: "+49 176 44680467",
      website: "www.mindmate.app",
      representative: "Inhaber",
      representativeDesc: "Jonathan Jansen",
      responsibility: "Verantwortlich für den Inhalt",
      responsibilityDesc: "Verantwortlich gemäß § 55 Abs. 2 RStV:",
      responsiblePerson: "Jonathan Jansen",
      responsibleAddress: "Petersbergstraße 11, 53604 Bad Honnef",
      disputeResolution: "Streitschlichtung",
      disputeResolutionDesc: "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:",
      disputeLink: "https://ec.europa.eu/consumers/odr/",
      disputeNote: "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
      liability: "Haftung für Inhalte",
      liabilityDesc: "Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.",
      liabilityLinks: "Haftung für Links",
      liabilityLinksDesc: "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.",
      copyright: "Urheberrecht",
      copyrightDesc: "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.",
      medicalDisclaimer: "Medizinischer Hinweis",
      medicalDisclaimerDesc: "MindMate Assistant ist kein Ersatz für professionelle psychologische oder medizinische Beratung, Diagnose oder Behandlung. Die App dient ausschließlich zur Unterstützung des persönlichen Wohlbefindens und der Selbstreflexion. Bei psychischen Problemen oder Erkrankungen wenden Sie sich bitte an qualifizierte Fachpersonen.",
      lastUpdate: "Stand: Januar 2025",
    },
    en: {
      title: "Legal Notice",
      subtitle: "Information according to § 5 TMG (German Telemedia Act)",
      provider: "Provider",
      companyName: "MindMade",
      businessType: "Small Business",
      address: "Petersbergstraße 11",
      city: "53604 Bad Honnef",
      country: "Germany",
      contact: "Contact",
      email: "joni.jansen00@gmail.com",
      phone: "+49 176 44680467",
      website: "www.mindmate.app",
      representative: "Owner",
      representativeDesc: "Jonathan Jansen",
      responsibility: "Responsible for Content",
      responsibilityDesc: "Responsible according to § 55 para. 2 RStV:",
      responsiblePerson: "Jonathan Jansen",
      responsibleAddress: "Petersbergstraße 11, 53604 Bad Honnef",
      disputeResolution: "Dispute Resolution",
      disputeResolutionDesc: "The European Commission provides a platform for online dispute resolution (ODR):",
      disputeLink: "https://ec.europa.eu/consumers/odr/",
      disputeNote: "We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board.",
      liability: "Liability for Content",
      liabilityDesc: "As a service provider, we are responsible for our own content on these pages in accordance with general laws pursuant to § 7 para. 1 TMG. However, according to §§ 8 to 10 TMG, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity. Obligations to remove or block the use of information under general laws remain unaffected. However, liability in this regard is only possible from the time of knowledge of a specific legal violation. Upon becoming aware of such violations, we will remove this content immediately.",
      liabilityLinks: "Liability for Links",
      liabilityLinksDesc: "Our offer contains links to external websites of third parties, over whose contents we have no influence. Therefore, we cannot assume any liability for these external contents. The respective provider or operator of the pages is always responsible for the contents of the linked pages. The linked pages were checked for possible legal violations at the time of linking. Illegal contents were not recognizable at the time of linking. However, permanent monitoring of the contents of the linked pages is not reasonable without concrete evidence of an infringement. Upon becoming aware of legal violations, we will remove such links immediately.",
      copyright: "Copyright",
      copyrightDesc: "The content and works created by the site operators on these pages are subject to German copyright law. Duplication, processing, distribution, and any kind of exploitation outside the limits of copyright law require the written consent of the respective author or creator. Downloads and copies of this page are only permitted for private, non-commercial use. Insofar as the content on this page was not created by the operator, the copyrights of third parties are respected. In particular, third-party content is marked as such. Should you nevertheless become aware of a copyright infringement, please inform us accordingly. Upon becoming aware of legal violations, we will remove such content immediately.",
      medicalDisclaimer: "Medical Disclaimer",
      medicalDisclaimerDesc: "MindMate Assistant is not a substitute for professional psychological or medical advice, diagnosis, or treatment. The app is intended solely to support personal well-being and self-reflection. If you are experiencing mental health problems or conditions, please consult qualified professionals.",
      lastUpdate: "Last updated: January 2025",
    },
  };

  const t = texts[language];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">{t.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Subtitle */}
          <p className="text-muted-foreground">{t.subtitle}</p>

          {/* Provider Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">{t.provider}</h2>
            </div>
            <div className="pl-12 space-y-1 text-foreground">
              <p className="font-medium">{t.companyName}</p>
              <p>{t.address}</p>
              <p>{t.city}</p>
              <p>{t.country}</p>
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">{t.contact}</h2>
            </div>
            <div className="pl-12 space-y-2">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${t.email}`} className="text-primary hover:underline">{t.email}</a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{t.phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span>{t.website}</span>
              </p>
            </div>
          </section>

          {/* Representative */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t.representative}</h2>
            <p className="text-foreground">{t.representativeDesc}</p>
          </section>

          {/* Responsible for Content */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t.responsibility}</h2>
            <div className="space-y-1 text-foreground">
              <p>{t.responsibilityDesc}</p>
              <p>{t.responsiblePerson}</p>
              <p>{t.responsibleAddress}</p>
            </div>
          </section>

          {/* Dispute Resolution */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">{t.disputeResolution}</h2>
            </div>
            <div className="pl-12 space-y-2">
              <p className="text-foreground">{t.disputeResolutionDesc}</p>
              <a 
                href={t.disputeLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline block"
              >
                {t.disputeLink}
              </a>
              <p className="text-muted-foreground text-sm">{t.disputeNote}</p>
            </div>
          </section>

          {/* Liability for Content */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t.liability}</h2>
            <p className="text-foreground text-sm leading-relaxed">{t.liabilityDesc}</p>
          </section>

          {/* Liability for Links */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t.liabilityLinks}</h2>
            <p className="text-foreground text-sm leading-relaxed">{t.liabilityLinksDesc}</p>
          </section>

          {/* Copyright */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t.copyright}</h2>
            <p className="text-foreground text-sm leading-relaxed">{t.copyrightDesc}</p>
          </section>

          {/* Medical Disclaimer */}
          <section className="space-y-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-300">{t.medicalDisclaimer}</h2>
            </div>
            <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">{t.medicalDisclaimerDesc}</p>
          </section>

          {/* Last Update */}
          <p className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
            {t.lastUpdate}
          </p>
        </motion.div>
      </main>
    </div>
  );
}

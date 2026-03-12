import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, AlertCircle, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { StandalonePage } from "@/components/layout/StandalonePage";

export default function Cancellation() {
  const navigate = useNavigate();
  const { language } = useTranslation();

  const content = {
    en: {
      title: "Right of Withdrawal",
      lastUpdated: "Last updated: January 2026",
      intro: "As a consumer in the European Union, you have specific rights regarding the cancellation of contracts concluded at a distance.",
      sections: [
        {
          icon: RotateCcw,
          title: "Right of Withdrawal",
          content: `You have the right to withdraw from this contract within 14 days without giving any reason.

The withdrawal period will expire after **14 days from the day of the conclusion of the contract**.

To exercise the right of withdrawal, you must inform us of your decision to withdraw from this contract by an unequivocal statement (e.g., a letter sent by post or email).

**Contact for withdrawal:**
Soulvay
Jonathan Jansen
Petersbergstraße 11
53604 Bad Honnef
Germany
Email: service@soulvay.com
Phone: +49 176 44680467

You may use the model withdrawal form below, but it is not obligatory.

To meet the withdrawal deadline, it is sufficient for you to send your communication concerning your exercise of the right of withdrawal before the withdrawal period has expired.`
        },
        {
          icon: AlertCircle,
          title: "Effects of Withdrawal",
          content: `If you withdraw from this contract, we shall reimburse to you all payments received from you, including the costs of delivery (with the exception of the supplementary costs resulting from your choice of a type of delivery other than the least expensive type of standard delivery offered by us), without undue delay and in any event not later than **14 days from the day on which we are informed about your decision to withdraw from this contract**.

We will carry out such reimbursement using the same means of payment as you used for the initial transaction, unless you have expressly agreed otherwise; in any event, you will not incur any fees as a result of such reimbursement.`
        },
        {
          icon: Calendar,
          title: "Exception for Digital Content",
          content: `**Important Notice regarding digital content:**

If you have requested that the provision of digital content (such as access to Soulvay Plus features) begins during the withdrawal period, you acknowledge that:

1. You will lose your right of withdrawal once the digital content has been fully provided, provided that the performance has begun with your prior express consent and your acknowledgment that you thereby lose your right of withdrawal.

2. If you have given your consent and acknowledgment, but the digital content has not been fully provided when you withdraw, you may still be entitled to a partial refund proportional to what has been provided up to the time you informed us of your withdrawal, compared to the full coverage of the contract.

**By subscribing to Soulvay Plus, you explicitly consent to the immediate performance of the service and acknowledge that you lose your right of withdrawal once the digital content has been fully provided.**`
        },
        {
          icon: FileText,
          title: "Model Withdrawal Form",
          content: `(Complete and return this form only if you wish to withdraw from the contract)

---

**To:**
Soulvay
Jonathan Jansen
Petersbergstraße 11
53604 Bad Honnef
Germany
Email: service@soulvay.com

I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the provision of the following service:

**Soulvay Plus Subscription**

Ordered on (*) / received on (*): _______________

Name of consumer(s): _______________

Address of consumer(s): _______________

Signature of consumer(s) (only if this form is notified on paper): _______________

Date: _______________

(*) Delete as appropriate.

---`
        }
      ],
      additionalInfo: {
        title: "Additional Information",
        content: "For any questions regarding your right of withdrawal, please contact us at service@soulvay.com. We are committed to ensuring a smooth and fair process for all our customers."
      }
    },
    de: {
      title: "Widerrufsbelehrung",
      lastUpdated: "Zuletzt aktualisiert: Januar 2026",
      intro: "Als Verbraucher in der Europäischen Union haben Sie bestimmte Rechte bezüglich des Widerrufs von Fernabsatzverträgen.",
      sections: [
        {
          icon: RotateCcw,
          title: "Widerrufsrecht",
          content: `Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.

Die Widerrufsfrist beträgt **vierzehn Tage ab dem Tag des Vertragsabschlusses**.

Um Ihr Widerrufsrecht auszuüben, müssen Sie uns mittels einer eindeutigen Erklärung (z.B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.

**Kontakt für den Widerruf:**
MindMade
Jonathan Jansen
Petersbergstraße 11
53604 Bad Honnef
Deutschland
E-Mail: service@soulvay.com
Telefon: +49 176 44680467

Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.

Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.`
        },
        {
          icon: AlertCircle,
          title: "Folgen des Widerrufs",
          content: `Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen **vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist**.

Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.`
        },
        {
          icon: Calendar,
          title: "Ausnahme für digitale Inhalte",
          content: `**Wichtiger Hinweis zu digitalen Inhalten:**

Wenn Sie verlangt haben, dass die Bereitstellung digitaler Inhalte (wie der Zugang zu Soulvay Plus-Funktionen) während der Widerrufsfrist beginnt, nehmen Sie zur Kenntnis, dass:

1. Sie Ihr Widerrufsrecht bei vollständiger Vertragserfüllung verlieren, wenn die Ausführung mit Ihrer ausdrücklichen vorherigen Zustimmung und Ihrer Kenntnisnahme begonnen hat, dass Sie damit Ihr Widerrufsrecht verlieren.

2. Wenn Sie Ihre Zustimmung und Kenntnisnahme erteilt haben, aber die digitalen Inhalte zum Zeitpunkt Ihres Widerrufs noch nicht vollständig bereitgestellt wurden, haben Sie möglicherweise Anspruch auf eine anteilige Rückerstattung entsprechend dem, was bis zum Zeitpunkt Ihrer Widerrufsmitteilung bereitgestellt wurde.

**Mit dem Abschluss eines Soulvay Plus-Abonnements stimmen Sie ausdrücklich der sofortigen Ausführung der Dienstleistung zu und nehmen zur Kenntnis, dass Sie Ihr Widerrufsrecht verlieren, sobald die digitalen Inhalte vollständig bereitgestellt wurden.**`
        },
        {
          icon: FileText,
          title: "Muster-Widerrufsformular",
          content: `(Füllen Sie dieses Formular nur aus und senden Sie es zurück, wenn Sie den Vertrag widerrufen wollen)

---

**An:**
MindMade
Jonathan Jansen
Petersbergstraße 11
53604 Bad Honnef
Deutschland
E-Mail: service@soulvay.com

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung:

**Soulvay Plus-Abonnement**

Bestellt am (*) / erhalten am (*): _______________

Name des/der Verbraucher(s): _______________

Anschrift des/der Verbraucher(s): _______________

Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): _______________

Datum: _______________

(*) Unzutreffendes streichen.

---`
        }
      ],
      additionalInfo: {
        title: "Weitere Informationen",
        content: "Bei Fragen zu Ihrem Widerrufsrecht kontaktieren Sie uns bitte unter service@soulvay.com. Wir sind bestrebt, einen reibungslosen und fairen Prozess für alle unsere Kunden zu gewährleisten."
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

        {/* Additional Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-primary/5 rounded-2xl p-6 border border-primary/10"
        >
          <h2 className="text-lg font-semibold text-foreground mb-2">{t.additionalInfo.title}</h2>
          <p className="text-muted-foreground text-sm">{t.additionalInfo.content}</p>
        </motion.section>
      </div>
    </div>
    </StandalonePage>
  );
}

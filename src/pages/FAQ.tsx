import { motion } from "framer-motion";
import { ArrowLeft, HelpCircle, Shield, CreditCard, Smartphone, Bot, Heart, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { StandalonePage } from "@/components/layout/StandalonePage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQCategory {
  icon: React.ElementType;
  title: string;
  questions: { q: string; a: string }[];
}

export default function FAQ() {
  const navigate = useNavigate();
  const { language, t } = useTranslation();

  const content = {
    en: {
      title: "Frequently Asked Questions",
      subtitle: "Find answers to common questions about Soulvay",
      categories: [
        {
          icon: Shield,
          title: "Privacy & Data",
          questions: [
            {
              q: "Is my data secure?",
              a: "Yes, absolutely. All your data is encrypted in transit (TLS) and stored securely using enterprise-grade cloud infrastructure with industry-standard security practices."
            },
            {
              q: "Can anyone else see my journal entries or chats?",
              a: "No. Your journal entries and chat conversations are private and can only be accessed by you. Our team cannot read your personal content."
            },
            {
              q: "Do you sell my data to third parties?",
              a: "Never. We do not sell, share, or provide your personal data to advertisers, data brokers, or any third parties. Your mental health data stays private."
            },
            {
              q: "How can I delete my data?",
              a: "You can delete your account and all associated data anytime from Settings > Account > Delete Account. All data is permanently removed within 30 days."
            },
            {
              q: "Can I export my data?",
              a: "Yes! Go to Settings > Account to export all your journal entries, mood check-ins, and chat history in JSON format."
            }
          ]
        },
        {
          icon: CreditCard,
          title: "Subscriptions & Billing",
          questions: [
            {
              q: "What's included in the free version?",
              a: "The free version includes 5 AI chat messages per day, basic journaling, mood tracking, and access to our toolbox exercises."
            },
            {
              q: "What does Soulvay Plus include?",
              a: "Soulvay Plus offers unlimited AI conversations, voice chat, AI-powered journal reflections, weekly recaps, and priority support for €9.99/month or €79/year."
            },
            {
              q: "How do I cancel my subscription?",
              a: "You can cancel anytime from Settings > Subscription. Your Plus features remain active until the end of your billing period."
            },
            {
              q: "Is there a refund policy?",
              a: "Yes, we offer a 7-day money-back guarantee for new subscribers. After 7 days, refunds are handled on a case-by-case basis. Contact us at service@soulvay.com."
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major credit cards (Visa, Mastercard, American Express) and some local payment methods through our secure payment provider Stripe."
            }
          ]
        },
        {
          icon: Bot,
          title: "AI & Chat",
          questions: [
            {
              q: "Is Soulvay a replacement for therapy?",
              a: "No. Soulvay is a supportive wellness tool, not a substitute for professional mental health care. If you're experiencing a crisis or need professional help, please contact a licensed therapist or emergency services."
            },
            {
              q: "How does the AI work?",
              a: "Soulvay uses advanced AI models to provide empathetic, supportive responses inspired by psychological principles. The AI does not store your personal conversations for training purposes."
            },
            {
              q: "Can I trust the AI's advice?",
              a: "The AI provides general wellness support and reflective prompts. While it's designed with psychological insights in mind, it cannot diagnose conditions or provide medical advice. Always consult professionals for health concerns."
            },
            {
              q: "What happens if I share something serious?",
              a: "Soulvay is designed to recognize crisis situations and will provide appropriate resources and hotline numbers. For immediate emergencies, always contact emergency services (112 in Germany/EU)."
            }
          ]
        },
        {
          icon: Smartphone,
          title: "App Usage",
          questions: [
            {
              q: "Can I use Soulvay offline?",
              a: "Basic features like reviewing past journal entries work offline, but AI chat and syncing require an internet connection."
            },
            {
              q: "Is there a mobile app?",
              a: "Soulvay is available as a mobile app on iOS and Android, as well as a progressive web app (PWA)."
            },
            {
              q: "How do I change the language?",
              a: "Go to Settings > Language to switch between English and German."
            },
            {
              q: "Can I use Soulvay on multiple devices?",
              a: "Yes! Your account syncs across all devices. Just log in with the same account on any device."
            }
          ]
        },
        {
          icon: Heart,
          title: "Support & Contact",
          questions: [
            {
              q: "How can I contact support?",
              a: "Email us at service@soulvay.com for any questions, feedback, or issues. We typically respond within 24-48 hours."
            },
            {
              q: "I found a bug. How do I report it?",
              a: "Please email us at service@soulvay.com with a description of the issue, your device type, and browser. Screenshots help!"
            },
            {
              q: "Can I suggest new features?",
              a: "Absolutely! We love hearing from users. Send your ideas to service@soulvay.com."
            }
          ]
        }
      ] as FAQCategory[]
    },
    de: {
      title: "Häufig gestellte Fragen",
      subtitle: "Finde Antworten auf häufige Fragen zu Soulvay",
      categories: [
        {
          icon: Shield,
          title: "Datenschutz & Daten",
          questions: [
            {
              q: "Sind meine Daten sicher?",
              a: "Ja, absolut. Alle deine Daten werden bei der Übertragung (TLS) verschlüsselt und sicher in einer Enterprise-Cloud-Infrastruktur mit branchenüblichen Sicherheitsstandards gespeichert."
            },
            {
              q: "Kann jemand anderes meine Tagebucheinträge oder Chats sehen?",
              a: "Nein. Deine Tagebucheinträge und Chat-Gespräche sind privat und können nur von dir eingesehen werden. Unser Team kann deine persönlichen Inhalte nicht lesen."
            },
            {
              q: "Verkauft ihr meine Daten an Dritte?",
              a: "Niemals. Wir verkaufen, teilen oder stellen deine persönlichen Daten nicht an Werbetreibende, Datenhändler oder Dritte zur Verfügung. Deine mentalen Gesundheitsdaten bleiben privat."
            },
            {
              q: "Wie kann ich meine Daten löschen?",
              a: "Du kannst dein Konto und alle zugehörigen Daten jederzeit unter Einstellungen > Konto > Konto löschen entfernen. Alle Daten werden innerhalb von 30 Tagen dauerhaft gelöscht."
            },
            {
              q: "Kann ich meine Daten exportieren?",
              a: "Ja! Gehe zu Einstellungen > Konto, um alle deine Tagebucheinträge, Stimmungs-Check-ins und Chat-Verläufe im JSON-Format zu exportieren."
            }
          ]
        },
        {
          icon: CreditCard,
          title: "Abonnements & Abrechnung",
          questions: [
            {
              q: "Was ist in der kostenlosen Version enthalten?",
              a: "Die kostenlose Version beinhaltet 5 KI-Chat-Nachrichten pro Tag, Basis-Tagebuch, Stimmungstracking und Zugang zu unseren Toolbox-Übungen."
            },
            {
              q: "Was beinhaltet Soulvay Plus?",
              a: "Soulvay Plus bietet unbegrenzte KI-Gespräche, Sprach-Chat, KI-gestützte Tagebuch-Reflexionen, wöchentliche Zusammenfassungen und Priority-Support für €9,99/Monat oder €79/Jahr."
            },
            {
              q: "Wie kündige ich mein Abonnement?",
              a: "Du kannst jederzeit unter Einstellungen > Abonnement kündigen. Deine Plus-Funktionen bleiben bis zum Ende deines Abrechnungszeitraums aktiv."
            },
            {
              q: "Gibt es eine Rückerstattungsrichtlinie?",
              a: "Ja, wir bieten eine 7-tägige Geld-zurück-Garantie für neue Abonnenten. Nach 7 Tagen werden Erstattungen im Einzelfall behandelt. Kontaktiere uns unter service@soulvay.com."
            },
            {
              q: "Welche Zahlungsmethoden akzeptiert ihr?",
              a: "Wir akzeptieren alle gängigen Kreditkarten (Visa, Mastercard, American Express) und einige lokale Zahlungsmethoden über unseren sicheren Zahlungsanbieter Stripe."
            }
          ]
        },
        {
          icon: Bot,
          title: "KI & Chat",
          questions: [
            {
              q: "Ist Soulvay ein Ersatz für Therapie?",
              a: "Nein. Soulvay ist ein unterstützendes Wellness-Tool, kein Ersatz für professionelle psychische Gesundheitsversorgung. Wenn du eine Krise erlebst oder professionelle Hilfe benötigst, kontaktiere bitte einen zugelassenen Therapeuten oder Notdienste."
            },
            {
              q: "Wie funktioniert die KI?",
              a: "Soulvay verwendet fortschrittliche KI-Modelle, um einfühlsame, unterstützende Antworten zu geben, die von psychologischen Prinzipien inspiriert sind. Die KI speichert deine persönlichen Gespräche nicht zu Trainingszwecken."
            },
            {
              q: "Kann ich den Ratschlägen der KI vertrauen?",
              a: "Die KI bietet allgemeine Wellness-Unterstützung und reflektierende Impulse. Obwohl sie mit psychologischen Erkenntnissen gestaltet ist, kann sie keine Erkrankungen diagnostizieren oder medizinische Ratschläge geben. Konsultiere immer Fachleute bei gesundheitlichen Bedenken."
            },
            {
              q: "Was passiert, wenn ich etwas Ernstes teile?",
              a: "Soulvay ist darauf ausgelegt, Krisensituationen zu erkennen und wird entsprechende Ressourcen und Hotline-Nummern bereitstellen. Bei sofortigen Notfällen kontaktiere immer den Notdienst (112 in Deutschland/EU)."
            }
          ]
        },
        {
          icon: Smartphone,
          title: "App-Nutzung",
          questions: [
            {
              q: "Kann ich Soulvay offline nutzen?",
              a: "Grundfunktionen wie das Anzeigen vergangener Tagebucheinträge funktionieren offline, aber KI-Chat und Synchronisierung erfordern eine Internetverbindung."
            },
            {
              q: "Gibt es eine mobile App?",
              a: "Soulvay ist als mobile App für iOS und Android verfügbar, sowie als Progressive Web App (PWA)."
            },
            {
              q: "Wie ändere ich die Sprache?",
              a: "Gehe zu Einstellungen > Sprache, um zwischen Englisch und Deutsch zu wechseln."
            },
            {
              q: "Kann ich Soulvay auf mehreren Geräten nutzen?",
              a: "Ja! Dein Konto synchronisiert sich über alle Geräte. Melde dich einfach mit demselben Konto auf jedem Gerät an."
            }
          ]
        },
        {
          icon: Heart,
          title: "Support & Kontakt",
          questions: [
            {
              q: "Wie kann ich den Support kontaktieren?",
              a: "Schreibe uns eine E-Mail an service@soulvay.com für alle Fragen, Feedback oder Probleme. Wir antworten normalerweise innerhalb von 24-48 Stunden."
            },
            {
              q: "Ich habe einen Fehler gefunden. Wie melde ich ihn?",
              a: "Bitte schreibe uns eine E-Mail an service@soulvay.com mit einer Beschreibung des Problems, deinem Gerätetyp und Browser. Screenshots helfen!"
            },
            {
              q: "Kann ich neue Funktionen vorschlagen?",
              a: "Absolut! Wir freuen uns über Feedback von Nutzern. Sende deine Ideen an service@soulvay.com."
            }
          ]
        }
      ] as FAQCategory[]
    }
  };

  const localT = content[language];

  return (
    <StandalonePage>
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 safe-top">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{localT.title}</h1>
            <p className="text-sm text-muted-foreground">{localT.subtitle}</p>
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6">
          {localT.categories.map((category, categoryIndex) => (
            <motion.section
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="bg-card rounded-2xl border border-border/40 shadow-soft overflow-hidden"
            >
              <div className="flex items-center gap-3 p-4 border-b border-border/40 bg-muted/30">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{category.title}</h2>
              </div>
              
              <Accordion type="single" collapsible className="px-4">
                {category.questions.map((faq, faqIndex) => (
                  <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`} className="border-border/40">
                    <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm pb-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.section>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-primary/5 rounded-2xl p-6 border border-primary/10 text-center"
        >
          <HelpCircle className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-2">
            {t("faq.stillQuestions")}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {t("faq.happyToHelp")}
          </p>
          <a
            href="mailto:service@soulvay.com"
            className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            {t("faq.contactUs")}
          </a>
        </motion.div>
      </div>
    </div>
    </StandalonePage>
  );
}

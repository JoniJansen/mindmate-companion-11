import { forwardRef } from "react";
import { motion } from "framer-motion";
import { 
  Phone, 
  MessageCircle, 
  ExternalLink, 
  Heart, 
  AlertTriangle,
  Clock,
  MapPin,
  User
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface CrisisLine {
  name: string;
  number: string;
  tel: string;
  description: string;
  available: string;
  isText?: boolean;
  isLink?: boolean;
}

interface Resource {
  title: string;
  description: string;
  icon: typeof MapPin;
}

const Safety = forwardRef<HTMLDivElement>((_, ref) => {
  const { t, language } = useTranslation();

  // Jutta Jansen - Psychologin M.Sc., Heilpraktikerin für Psychotherapie
  const professionalContact = {
    name: "Jutta Jansen",
    role: language === "de" ? "Psychologin M.Sc., Heilpraktikerin für Psychotherapie" : "Psychologist M.Sc., Psychotherapist",
    description: language === "de" 
      ? "Über 24 Jahre Erfahrung in Psychiatrie und Psychosomatik. Spezialisiert auf Trauma, Angst, Burnout und Beziehungsberatung."
      : "Over 24 years experience in psychiatry and psychosomatic medicine. Specialized in trauma, anxiety, burnout and relationship counseling.",
    number: "+49 177 6536493",
    tel: "tel:+491776536493",
    website: "https://www.juttajansen.com",
    available: language === "de" ? "Mo–Fr 9:00–15:00 Uhr" : "Mon–Fri 9am–3pm",
  };

  // German crisis lines
  const germanCrisisLines: CrisisLine[] = [
    {
      name: t("crisis.telefonseelsorge"),
      number: t("crisis.telefonseelsorgeNum"),
      tel: "tel:0800-111-0-111",
      description: t("crisis.telefonseelsorgeDesc"),
      available: t("safety.24_7"),
      isText: false,
    },
    {
      name: t("crisis.telefonseelsorge2"),
      number: t("crisis.telefonseelsorge2Num"),
      tel: "tel:0800-111-0-222",
      description: t("crisis.telefonseelsorgeDesc"),
      available: t("safety.24_7"),
      isText: false,
    },
    {
      name: t("crisis.nummerGegenKummer"),
      number: t("crisis.nummerGegenKummerNum"),
      tel: "tel:116-111",
      description: t("crisis.nummerGegenKummerDesc"),
      available: t("crisis.nummerGegenKummerHours"),
      isText: false,
    },
    {
      name: t("crisis.international"),
      number: t("crisis.findLocalResources"),
      tel: "https://www.iasp.info/resources/Crisis_Centres/",
      description: t("crisis.crisisCentersWorldwide"),
      available: t("safety.variesByLocation"),
      isText: false,
      isLink: true,
    },
  ];

  // English crisis lines
  const englishCrisisLines: CrisisLine[] = [
    {
      name: "National Suicide Prevention Lifeline",
      number: "988",
      tel: "tel:988",
      description: "24/7, free and confidential support",
      available: "24/7",
      isText: false,
    },
    {
      name: "Crisis Text Line",
      number: "Text HOME to 741741",
      tel: "sms:741741?body=HOME",
      description: "Free, 24/7 crisis support via text",
      available: "24/7",
      isText: true,
    },
    {
      name: "SAMHSA National Helpline",
      number: "1-800-662-4357",
      tel: "tel:1-800-662-4357",
      description: "Treatment referrals and information",
      available: "24/7",
      isText: false,
    },
    {
      name: t("crisis.international"),
      number: t("crisis.findLocalResources"),
      tel: "https://www.iasp.info/resources/Crisis_Centres/",
      description: t("crisis.crisisCentersWorldwide"),
      available: t("safety.variesByLocation"),
      isText: false,
      isLink: true,
    },
  ];

  const crisisLines = language === "de" ? germanCrisisLines : englishCrisisLines;

  const resources: Resource[] = [
    {
      title: t("resource.findTherapist"),
      description: t("resource.findTherapistDesc"),
      icon: MapPin,
    },
    {
      title: t("resource.understandingSigns"),
      description: t("resource.understandingSignsDesc"),
      icon: AlertTriangle,
    },
    {
      title: t("resource.selfCare"),
      description: t("resource.selfCareDesc"),
      icon: Heart,
    },
  ];

  const emergencyNumber = language === "de" ? "112" : "911";

  return (
    <div ref={ref} className="min-h-screen bg-background pb-24">
      <PageHeader 
        title={t("safety.title")} 
        subtitle={t("safety.subtitle")}
        showBack 
        backTo="/chat"
      />

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* Emergency banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  {t("safety.immediateDANGER")}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("safety.callEmergency")}
                </p>
                <Button variant="destructive" size="sm" asChild>
                  <a href={`tel:${emergencyNumber}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    {t("safety.call112")}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Professional Contact - Jutta Jansen */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {language === "de" ? "Persönliche Beratung" : "Professional Support"}
          </h2>
          
          <CalmCard variant="gentle">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{professionalContact.name}</h3>
                  <p className="text-xs text-primary font-medium leading-tight">{professionalContact.role}</p>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{professionalContact.description}</p>
                  <p className="text-lg font-bold text-foreground mt-2">{professionalContact.number}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {professionalContact.available}
                    </div>
                    <a 
                      href={professionalContact.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </a>
                  </div>
                </div>
              </div>
              <Button variant="calm" size="icon" asChild className="shrink-0">
                <a href={professionalContact.tel}>
                  <Phone className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </CalmCard>
        </motion.div>

        {/* Crisis lines */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {t("safety.crisisLines")}
          </h2>
          
          <div className="space-y-3">
            {crisisLines.map((line, index) => (
              <motion.div
                key={line.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <CalmCard variant="elevated">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-1">{line.name}</h3>
                      <p className="text-lg font-bold text-primary mb-1">{line.number}</p>
                      <p className="text-sm text-muted-foreground">{line.description}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {line.available}
                      </div>
                    </div>
                    <Button variant="calm" size="icon" asChild>
                      <a href={line.tel} target={line.isLink ? "_blank" : undefined} rel={line.isLink ? "noopener noreferrer" : undefined}>
                        {line.isText ? (
                          <MessageCircle className="w-4 h-4" />
                        ) : line.isLink ? (
                          <ExternalLink className="w-4 h-4" />
                        ) : (
                          <Phone className="w-4 h-4" />
                        )}
                      </a>
                    </Button>
                  </div>
                </CalmCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reassurance message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <CalmCard variant="gentle">
            <div className="text-center py-2">
              <Heart className="w-8 h-8 text-gentle mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">
                {t("safety.okToAskForHelp")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("safety.reachingOut")}
              </p>
            </div>
          </CalmCard>
        </motion.div>

        {/* Additional resources */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {t("safety.additionalResources")}
          </h2>
          
          <div className="space-y-3">
            {resources.map((resource) => {
              const Icon = resource.icon;
              return (
                <CalmCard 
                  key={resource.title}
                  variant="default" 
                  className="cursor-pointer hover:shadow-card transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </CalmCard>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
});

Safety.displayName = "Safety";

export default Safety;

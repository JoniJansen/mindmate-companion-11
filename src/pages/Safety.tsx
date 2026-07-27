import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  MessageCircle,
  ExternalLink,
  Heart,
  AlertTriangle,
  Clock,
  User,
  Globe,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { StandalonePage } from "@/components/layout/StandalonePage";
import {
  detectCrisisRegion,
  getEmergencyNumbers,
  getSafetyResources,
  type CrisisContact,
  type CrisisSection,
} from "@/lib/crisisResources";

/**
 * Safety page — crisis helplines follow the DETECTED REGION (time zone, then
 * locale), never the UI language. An English UI in Germany must never show a
 * US-only number. Whatever the guess, international resources stay visible and
 * the other countries are one visible tap away.
 */

function ContactIcon({ kind }: { kind: CrisisContact["kind"] }) {
  if (kind === "text") return <MessageCircle className="w-4 h-4" />;
  if (kind === "link") return <ExternalLink className="w-4 h-4" />;
  return <Phone className="w-4 h-4" />;
}

function CrisisContactCard({ contact }: { contact: CrisisContact }) {
  const { t } = useTranslation();
  const name = t(contact.nameKey);
  const displayValue = contact.value ?? (contact.valueKey ? t(contact.valueKey) : "");
  const isExternal = contact.kind === "link";

  return (
    <CalmCard variant="elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground mb-1">{name}</h3>
          <p className="text-lg font-bold text-primary mb-1 break-words">{displayValue}</p>
          <p className="text-sm text-muted-foreground">{t(contact.descriptionKey)}</p>
          <div className="flex items-start gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mt-0.5 shrink-0" />
            <span>{t(contact.availabilityKey)}</span>
          </div>
        </div>
        <Button variant="calm" size="icon" asChild className="shrink-0">
          <a
            href={contact.href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            aria-label={`${name} — ${displayValue}`}
          >
            <ContactIcon kind={contact.kind} />
          </a>
        </Button>
      </div>
    </CalmCard>
  );
}

function CrisisSectionBlock({ section }: { section: CrisisSection }) {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {t(section.headingKey)}
      </h3>
      <div className="space-y-3">
        {section.contacts.map((contact) => (
          <CrisisContactCard key={contact.id} contact={contact} />
        ))}
      </div>
    </div>
  );
}

export default function Safety() {
  const { t } = useTranslation();
  const [showOtherRegions, setShowOtherRegions] = useState(false);

  const region = useMemo(() => detectCrisisRegion(), []);
  const { primary, others, noticeKey } = useMemo(() => getSafetyResources(region), [region]);
  const emergencyNumbers = useMemo(() => getEmergencyNumbers(region), [region]);

  // Professional contact
  const professionalContact = {
    name: "Jutta Jansen",
    role: t("safety.professional.role"),
    description: t("safety.professional.description"),
    number: "+49 177 6536493",
    tel: "tel:+491776536493",
    website: "https://www.juttajansen.com",
    available: t("safety.professional.available"),
  };

  return (
    <StandalonePage>
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <PageHeader
        title={t("safety.title")}
        subtitle={t("safety.subtitle")}
        showBack
        backTo="/chat"
      />

      <div className="px-4 py-4 max-w-lg mx-auto" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
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
                <div className="flex flex-wrap gap-2">
                  {emergencyNumbers.map((emergency) => (
                    <Button key={emergency.value} variant="destructive" size="sm" asChild>
                      <a href={`tel:${emergency.value}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        {t(emergency.labelKey)}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Crisis lines — ordered by detected region, international always visible */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {t("safety.crisisLines")}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{t(noticeKey)}</p>

          <div className="space-y-6">
            {primary.map((section) => (
              <CrisisSectionBlock key={section.id} section={section} />
            ))}
          </div>

          {others.length > 0 && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => setShowOtherRegions((open) => !open)}
                aria-expanded={showOtherRegions}
              >
                <span className="flex items-center gap-2 text-left">
                  <Globe className="w-4 h-4 shrink-0" />
                  {showOtherRegions ? t("safety.region.hideOthers") : t("safety.region.showOthers")}
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform ${showOtherRegions ? "rotate-180" : ""}`}
                />
              </Button>

              {showOtherRegions && (
                <div className="space-y-6 mt-4">
                  {others.map((section) => (
                    <CrisisSectionBlock key={section.id} section={section} />
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Professional Contact - Jutta Jansen */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {t("safety.professionalSupportHeading")}
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
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{professionalContact.available}</span>
                    </div>
                    <a
                      href={professionalContact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
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

        {/* Reassurance message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <CalmCard variant="gentle">
            <div className="text-center py-2">
              <Heart className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">
                {t("safety.okToAskForHelp")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("safety.reachingOut")}
              </p>
            </div>
          </CalmCard>
        </motion.div>

      </div>
    </div>
    </StandalonePage>
  );
}

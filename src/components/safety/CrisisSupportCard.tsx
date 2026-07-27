import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Phone, ArrowRight, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { detectCrisisRegion, getSafetyResources } from "@/lib/crisisResources";

interface CrisisSupportCardProps {
  /** Called when the user closes the card. Omit to render it non-dismissible. */
  onDismiss?: () => void;
  className?: string;
}

/**
 * Inline crisis support, shown wherever the deterministic detector fires.
 *
 * Deliberately quiet in tone. Somebody who has just written that they do not
 * want to live is not helped by a red alert box — it reads as alarm and
 * shame. This is a soft card that says someone is reachable, gives the number
 * for the user's region, and gets out of the way.
 *
 * Renders entirely from local data: no network call, no model, works offline
 * and without an account. That is the whole point — see `src/lib/crisisDetection.ts`.
 */
export function CrisisSupportCard({ onDismiss, className = "" }: CrisisSupportCardProps) {
  const { t } = useTranslation();

  // Phone contacts of the primary region, capped at two so the card stays calm.
  const contacts = useMemo(() => {
    const { primary } = getSafetyResources(detectCrisisRegion());
    return primary
      .flatMap((section) => section.contacts)
      .filter((contact) => contact.kind === "phone")
      .slice(0, 2);
  }, []);

  return (
    <div
      role="complementary"
      aria-label={t("crisis.card.title")}
      className={`rounded-2xl border border-primary/25 bg-primary-soft/40 p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{t("crisis.card.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("crisis.card.body")}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t("crisis.card.dismiss")}
            className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {contacts.map((contact) => (
          <a
            key={contact.id}
            href={contact.href}
            className="flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2 text-sm transition-colors hover:bg-background"
          >
            <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="font-medium text-foreground">{contact.value}</span>
            <span className="truncate text-xs text-muted-foreground">
              {t(contact.availabilityKey)}
            </span>
          </a>
        ))}

        <Link
          to="/safety"
          className="inline-flex items-center gap-1.5 px-1 py-1 text-sm text-primary transition-opacity hover:opacity-80"
        >
          {t("crisis.card.moreOptions")}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

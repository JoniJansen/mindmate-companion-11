import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalmCard } from "@/components/shared/CalmCard";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Lucide icon shown in a soft circle above the text */
  icon: LucideIcon;
  /** Optional short heading */
  title?: string;
  /** One calm sentence explaining the empty state (pass a t() result) */
  description: string;
  /** Optional CTA — rendered only when both label and handler are provided */
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Quiet, reusable empty state for lists and views without data yet.
 * Design language: CalmCard "gentle" + soft icon circle + one sentence
 * + optional outline CTA. All copy comes from the emptyStates i18n
 * namespace (src/translations/emptyStates.ts) via the caller.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <CalmCard variant="gentle" className={cn("text-center py-8 px-6", className)}>
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-primary/70" aria-hidden="true" />
      </div>
      {title && <h3 className="font-medium text-foreground mb-1">{title}</h3>}
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </CalmCard>
  );
}

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

// Trust Layer: Calm, static skeleton loading states instead of spinners
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "rounded-lg bg-muted/40",
        "bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30",
        "bg-[length:200%_100%]",
        "animate-[skeleton-shimmer_2s_ease-in-out_infinite]",
        className
      )} 
    />
  );
}

// Message skeleton for chat loading
export function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={cn(
        "rounded-2xl px-4 py-3",
        isUser 
          ? "bg-primary/20 rounded-br-lg" 
          : "bg-muted/30 border border-border/30 rounded-bl-lg"
      )}>
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

// Card skeleton for lists
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/30 bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

// Text skeleton for loading text content
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4",
            i === lines - 1 ? "w-2/3" : "w-full"
          )} 
        />
      ))}
    </div>
  );
}

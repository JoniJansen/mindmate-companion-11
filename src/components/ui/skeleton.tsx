import { cn } from "@/lib/utils";

// Trust Layer: Calm, gentle skeleton for loading states
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "rounded-md bg-muted/50",
        "bg-gradient-to-r from-muted/30 via-muted/60 to-muted/30",
        "bg-[length:200%_100%]",
        "animate-pulse",
        className
      )} 
      {...props} 
    />
  );
}

export { Skeleton };

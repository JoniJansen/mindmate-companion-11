import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface CalmCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "accent" | "gentle" | "calm";
  onClick?: () => void;
  animate?: boolean;
}

export const CalmCard = React.forwardRef<HTMLDivElement, CalmCardProps>(
  ({ children, className, variant = "default", onClick, animate = true, ...props }, ref) => {
    const baseStyles = "rounded-2xl p-4 transition-all duration-200";
    
    const variantStyles = {
      default: "bg-card border border-border/50 shadow-soft",
      elevated: "bg-card border border-border/40 shadow-card",
      accent: "bg-accent-soft/50 border border-accent/12",
      gentle: "bg-primary-soft/50 border border-primary/12",
      calm: "bg-primary-soft/50 border border-primary/12",
    };

    const hoverStyles = onClick ? "cursor-pointer hover:shadow-card hover:border-border/60 active:scale-[0.99]" : "";

    if (!animate) {
      return (
        <div
          ref={ref}
          className={cn(baseStyles, variantStyles[variant], hoverStyles, className)}
          onClick={onClick}
        >
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], hoverStyles, className)}
        onClick={onClick}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        whileTap={onClick ? { scale: 0.99 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

CalmCard.displayName = "CalmCard";

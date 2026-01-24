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
    const baseStyles = "rounded-2xl p-4 transition-all duration-300";
    
    const variantStyles = {
      default: "bg-card border border-border/40 shadow-soft",
      elevated: "bg-card border border-border/25 shadow-card",
      accent: "bg-accent-soft/60 border border-accent/15",
      gentle: "bg-gentle-soft/60 border border-gentle/15",
      calm: "bg-calm-soft/60 border border-calm/15",
    };

    if (!animate) {
      return (
        <div
          ref={ref}
          className={cn(baseStyles, variantStyles[variant], onClick && "cursor-pointer active:scale-[0.98]", className)}
          onClick={onClick}
        >
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], onClick && "cursor-pointer active:scale-[0.98]", className)}
        onClick={onClick}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileTap={onClick ? { scale: 0.98 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

CalmCard.displayName = "CalmCard";

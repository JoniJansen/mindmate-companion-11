import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CalmCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "accent" | "gentle" | "calm";
  onClick?: () => void;
  animate?: boolean;
}

export function CalmCard({ 
  children, 
  className, 
  variant = "default",
  onClick,
  animate = true
}: CalmCardProps) {
  const baseStyles = "rounded-2xl p-4 transition-all duration-200";
  
  const variantStyles = {
    default: "bg-card border border-border/50 shadow-soft",
    elevated: "bg-card border border-border/30 shadow-card",
    accent: "bg-accent-soft border border-accent/20",
    gentle: "bg-gentle-soft border border-gentle/20",
    calm: "bg-calm-soft border border-calm/20",
  };

  const Component = animate ? motion.div : "div";
  const animateProps = animate ? {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
    whileTap: onClick ? { scale: 0.98 } : undefined,
  } : {};

  return (
    <Component
      className={cn(baseStyles, variantStyles[variant], onClick && "cursor-pointer active:scale-[0.98]", className)}
      onClick={onClick}
      {...animateProps}
    >
      {children}
    </Component>
  );
}

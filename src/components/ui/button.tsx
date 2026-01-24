import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-primary/90 text-primary-foreground hover:bg-primary/80 shadow-soft",
        destructive: "bg-destructive/90 text-destructive-foreground hover:bg-destructive/80",
        outline: "border border-border/60 bg-background hover:bg-muted/50 hover:border-primary/25",
        secondary: "bg-secondary/80 text-secondary-foreground hover:bg-secondary/60",
        ghost: "hover:bg-muted/50 hover:text-foreground/90",
        link: "text-primary/90 underline-offset-4 hover:underline hover:text-primary",
        calm: "bg-calm/90 text-calm-foreground hover:bg-calm/80 shadow-soft",
        gentle: "bg-gentle-soft/70 text-gentle border border-gentle/15 hover:bg-gentle/15",
        accent: "bg-accent/90 text-accent-foreground hover:bg-accent/80 shadow-soft",
        soft: "bg-primary-soft/70 text-primary hover:bg-primary/8",
        floating: "bg-card text-foreground shadow-card hover:shadow-elevated border border-border/40",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3.5",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10 rounded-xl",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

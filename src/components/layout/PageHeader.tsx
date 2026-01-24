import * as React from "react";
import { ChevronLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo.png";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  rightElement?: React.ReactNode;
  showSettings?: boolean;
  showLogo?: boolean;
  className?: string;
}

export const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({ title, subtitle, showBack = false, backTo, rightElement, showSettings = true, showLogo = false, className = "" }, ref) => {
    const navigate = useNavigate();

    const handleBack = () => {
      if (backTo) {
        navigate(backTo);
      } else {
        navigate(-1);
      }
    };

    return (
      <header 
        ref={ref}
        className={`sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/20 safe-top ${className}`}
      >
        <div className="flex items-center justify-between px-4 py-3.5 max-w-lg mx-auto">
          <div className="flex items-center gap-3 flex-1">
            {showBack && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground/80 -ml-2"
              >
                <ChevronLeft className="w-5 h-5 stroke-[1.8]" />
              </Button>
            )}
            {showLogo && (
              <img 
                src={logoImage} 
                alt="MindMate" 
                className="w-8 h-8 object-contain rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-foreground/90 tracking-tight truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground/80 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          {rightElement || (showSettings && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground/70 hover:text-foreground/70 hover:bg-muted/40"
              onClick={() => navigate("/settings")}
            >
              <Settings className="w-[18px] h-[18px] stroke-[1.8]" />
            </Button>
          ))}
        </div>
      </header>
    );
  }
);

PageHeader.displayName = "PageHeader";

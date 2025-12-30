import * as React from "react";
import { ChevronLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  rightElement?: React.ReactNode;
  showSettings?: boolean;
  className?: string;
}

export const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({ title, subtitle, showBack = false, backTo, rightElement, showSettings = true, className = "" }, ref) => {
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
        className={`sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30 safe-top ${className}`}
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-3 flex-1">
            {showBack && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground -ml-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>
          {rightElement || (showSettings && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/settings")}
            >
              <Settings className="w-5 h-5" />
            </Button>
          ))}
        </div>
      </header>
    );
  }
);

PageHeader.displayName = "PageHeader";

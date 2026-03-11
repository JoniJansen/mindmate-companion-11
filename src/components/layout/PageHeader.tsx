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
  avatarElement?: React.ReactNode;
  showSettings?: boolean;
  showLogo?: boolean;
  className?: string;
}

export const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({ title, subtitle, showBack = false, backTo, rightElement, avatarElement, showSettings = true, showLogo = false, className = "" }, ref) => {
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
        className={`shrink-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/30 ${className}`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Reduced py from 3.5 to 2.5 for tighter header, safe-area handled above */}
        <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-2.5 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {showBack && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground -ml-2 shrink-0"
              >
                <ChevronLeft className="w-5 h-5 stroke-[1.8]" />
              </Button>
            )}
            {avatarElement}
            {showLogo && !avatarElement && (
              <img 
                src={logoImage} 
                alt="Soulvay" 
                className="w-9 h-9 object-contain rounded-xl shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-foreground tracking-tight truncate leading-tight">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 -mr-1.5">
            {rightElement || (showSettings && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/settings");
                }}
                aria-label="Settings"
              >
                <Settings className="w-[18px] h-[18px] stroke-[1.8]" />
              </Button>
            ))}
          </div>
        </div>
      </header>
    );
  }
);

PageHeader.displayName = "PageHeader";

import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MessageCircle, 
  BookOpen, 
  Compass, 
  BarChart3, 
  Sparkles 
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// Height exported for layout calculations (nav content only, safe area added separately)
export const BOTTOM_NAV_HEIGHT = 56;

export function BottomNav() {
  const location = useLocation();
  const { language } = useTranslation();

  const navItems = [
    { 
      to: "/chat", 
      icon: MessageCircle, 
      label: language === "de" ? "Chat" : "Chat",
      tourId: "chat",
    },
    { 
      to: "/journal", 
      icon: BookOpen, 
      label: language === "de" ? "Tagebuch" : "Journal",
      tourId: "journal",
    },
    { 
      to: "/topics", 
      icon: Compass, 
      label: language === "de" ? "Themen" : "Topics",
      tourId: "topics",
    },
    { 
      to: "/mood", 
      icon: BarChart3, 
      label: language === "de" ? "Stimmung" : "Mood",
      tourId: "mood",
    },
    { 
      to: "/toolbox", 
      icon: Sparkles, 
      label: language === "de" ? "Übungen" : "Toolbox",
      tourId: "toolbox",
    },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50"
      style={{ 
        // Safe area fills the space below home indicator
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Nav content - fixed height */}
      <div 
        className="flex items-center justify-around px-2 max-w-lg md:max-w-xl mx-auto"
        style={{ height: `${BOTTOM_NAV_HEIGHT}px` }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== "/" && location.pathname.startsWith(item.to));
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              data-tour={item.tourId}
              className="relative flex flex-col items-center justify-center flex-1 h-full"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-150 ${
                  isActive 
                    ? "bg-primary/12 text-primary" 
                    : "text-muted-foreground active:bg-muted/50"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 font-medium transition-colors duration-150 ${
                isActive ? "text-primary" : "text-muted-foreground/60"
              }`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

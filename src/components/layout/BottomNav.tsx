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
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/40"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="flex items-center justify-around px-1 py-1.5 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== "/" && location.pathname.startsWith(item.to));
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              data-tour={item.tourId}
              className="relative flex flex-col items-center justify-center min-w-[60px] py-1.5"
            >
              <motion.div
                className={`flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2]' : 'stroke-[1.6]'}`} />
              </motion.div>
              <span className={`text-[10px] mt-0.5 font-medium tracking-wide transition-colors duration-200 ${
                isActive ? "text-primary" : "text-muted-foreground/70"
              }`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary/60"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

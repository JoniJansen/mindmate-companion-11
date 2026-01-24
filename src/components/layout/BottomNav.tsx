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
      label: language === "de" ? "Journal" : "Journal",
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/30 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2.5 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== "/" && location.pathname.startsWith(item.to));
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              data-tour={item.tourId}
              className="relative flex flex-col items-center justify-center min-w-[56px] py-1"
            >
              <motion.div
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? "bg-primary/12 text-primary" 
                    : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/40"
                }`}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              </motion.div>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/70"
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                />
              )}
              <span className={`text-[10px] mt-0.5 font-medium tracking-wide transition-colors duration-300 ${
                isActive ? "text-primary" : "text-muted-foreground/80"
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

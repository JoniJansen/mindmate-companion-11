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
    },
    { 
      to: "/journal", 
      icon: BookOpen, 
      label: language === "de" ? "Journal" : "Journal",
    },
    { 
      to: "/topics", 
      icon: Compass, 
      label: language === "de" ? "Themen" : "Topics",
    },
    { 
      to: "/mood", 
      icon: BarChart3, 
      label: language === "de" ? "Stimmung" : "Mood",
    },
    { 
      to: "/toolbox", 
      icon: Sparkles, 
      label: language === "de" ? "Übungen" : "Toolbox",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== "/" && location.pathname.startsWith(item.to));
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center min-w-[56px] py-1"
            >
              <motion.div
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-200 ${
                  isActive 
                    ? "bg-primary/15 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className={`text-[10px] mt-0.5 font-medium transition-colors duration-200 ${
                isActive ? "text-primary" : "text-muted-foreground"
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

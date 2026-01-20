import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Calendar, Home } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function BottomNav() {
  const location = useLocation();
  const { language } = useTranslation();

  const navItems = [
    { 
      to: "/", 
      icon: Home, 
      label: language === "de" ? "Space" : "Space",
    },
    { 
      to: "/chat", 
      icon: MessageCircle, 
      label: language === "de" ? "Chat" : "Chat",
      isCenter: true,
    },
    { 
      to: "/timeline", 
      icon: Calendar, 
      label: language === "de" ? "Timeline" : "Timeline",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around px-4 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.to === "/" 
            ? location.pathname === "/" 
            : location.pathname.startsWith(item.to);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center min-w-[70px] py-1"
            >
              <div className="relative">
                {item.isCenter ? (
                  <motion.div
                    className={`flex items-center justify-center w-14 h-14 rounded-2xl -mt-6 shadow-card ${
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-calm text-calm-foreground"
                    }`}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-200 ${
                      isActive 
                        ? "bg-primary-soft text-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                )}
                {isActive && !item.isCenter && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${
                item.isCenter ? "mt-2" : ""
              } ${
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

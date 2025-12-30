import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MessageCircle, 
  BookOpen, 
  Smile, 
  ListTodo, 
  Sparkles 
} from "lucide-react";

const navItems = [
  { to: "/journal", icon: BookOpen, label: "Journal" },
  { to: "/mood", icon: Smile, label: "Mood" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/topics", icon: ListTodo, label: "Topics" },
  { to: "/toolbox", icon: Sparkles, label: "Toolbox" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          const isCenterItem = item.to === "/chat";

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center min-w-[60px] py-1"
            >
              <div className="relative">
                {isCenterItem ? (
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
                {isActive && !isCenterItem && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${
                isCenterItem ? "mt-2" : ""
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

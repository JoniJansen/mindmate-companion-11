import { NavLink, useLocation } from "react-router-dom";
import { 
  MessageCircle, 
  BookOpen, 
  Compass, 
  BarChart3, 
  Home
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { BOTTOM_NAV_HEIGHT } from "@/lib/safeArea";

export function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { to: "/home", icon: Home, labelKey: "nav.home", tourId: "home" },
    { to: "/chat", icon: MessageCircle, labelKey: "nav.chat", tourId: "chat" },
    { to: "/journal", icon: BookOpen, labelKey: "nav.journal", tourId: "journal" },
    { to: "/topics", icon: Compass, labelKey: "nav.topics", tourId: "topics" },
    { to: "/mood", icon: BarChart3, labelKey: "nav.mood", tourId: "mood" },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
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
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 font-medium transition-colors duration-150 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}>
                {t(item.labelKey)}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { AppFooter } from "./AppFooter";
import { useBackupReminder } from "@/hooks/useBackupReminder";

export function AppLayout() {
  const location = useLocation();
  
  // Initialize backup reminder
  useBackupReminder();
  
  // Pages that should NOT show the bottom nav and footer
  const hideNavRoutes = ["/settings", "/safety", "/summary"];
  const shouldHideNav = hideNavRoutes.some(route => location.pathname.startsWith(route));
  
  // Chat page manages its own height/padding
  const isChat = location.pathname === "/chat" || location.pathname.startsWith("/chat");
  
  // Calculate bottom padding for nav
  const bottomNavHeight = 68; // Slightly smaller, more refined
  
  return (
    <div 
      className="flex flex-col bg-background"
      style={{ 
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: shouldHideNav ? 'env(safe-area-inset-bottom, 0px)' : '0px'
      }}
    >
      <main 
        className="flex-1 scroll-stable"
        style={!shouldHideNav && !isChat ? { 
          paddingBottom: `calc(${bottomNavHeight}px + env(safe-area-inset-bottom, 0px))` 
        } : {}}
      >
        <Outlet />
      </main>
      {!shouldHideNav && (
        <>
          <AppFooter />
          <BottomNav />
        </>
      )}
    </div>
  );
}

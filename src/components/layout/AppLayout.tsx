import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "@/components/system/OfflineBanner";

// Fixed bottom nav height - must match BottomNav component
const BOTTOM_NAV_HEIGHT = 56; // Compact: 56px nav content

export function AppLayout() {
  const location = useLocation();
  
  // Pages that should NOT show the bottom nav
  const hideNavRoutes = ["/settings", "/safety", "/summary"];
  const shouldHideNav = hideNavRoutes.some(route => location.pathname.startsWith(route));
  
  // Chat page manages its own layout completely
  const isChat = location.pathname === "/chat" || location.pathname.startsWith("/chat");
  
  return (
    <div 
      className="flex flex-col bg-background"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: shouldHideNav ? 'env(safe-area-inset-bottom, 0px)' : '0px'
      }}
    >
      {/* Global offline banner */}
      <OfflineBanner />

      {/* Main content area */}
      <main 
        className={`flex-1 min-h-0 ${!shouldHideNav && !isChat ? 'scroll-container' : ''}`}
        style={!shouldHideNav && !isChat ? { 
          paddingBottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))` 
        } : (shouldHideNav ? { overflowY: 'auto' } : {})}
      >
        <Outlet />
      </main>
      
      {/* Bottom nav - fixed, never scroll */}
      {!shouldHideNav && <BottomNav />}
    </div>
  );
}

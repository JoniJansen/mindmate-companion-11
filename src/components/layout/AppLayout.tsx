import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { AppFooter } from "./AppFooter";
import { useBackupReminder } from "@/hooks/useBackupReminder";

export function AppLayout() {
  const location = useLocation();
  
  // Initialize backup reminder - this will show notification if overdue
  useBackupReminder();
  
  // Pages that should NOT show the bottom nav and footer (Chat keeps nav visible)
  const hideNavRoutes = ["/settings", "/safety", "/summary"];
  const shouldHideNav = hideNavRoutes.some(route => location.pathname.startsWith(route));
  
  // Chat page manages its own height/padding
  const isChat = location.pathname === "/chat" || location.pathname.startsWith("/chat");
  
  return (
    <div 
      className="min-h-screen bg-background flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <main className={`flex-1 ${shouldHideNav || isChat ? "" : "pb-24"}`} style={!shouldHideNav && !isChat ? { paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' } : {}}>
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

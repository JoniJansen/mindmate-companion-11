import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { AppFooter } from "./AppFooter";
import { useBackupReminder } from "@/hooks/useBackupReminder";

export function AppLayout() {
  const location = useLocation();
  
  // Initialize backup reminder - this will show notification if overdue
  useBackupReminder();
  
  // Pages that should NOT show the bottom nav and footer
  const hideNavRoutes = ["/settings", "/safety", "/summary", "/chat"];
  const shouldHideNav = hideNavRoutes.some(route => location.pathname.startsWith(route));
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className={`flex-1 ${shouldHideNav ? "" : "pb-24"}`}>
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

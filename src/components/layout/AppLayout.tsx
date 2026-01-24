import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { useBackupReminder } from "@/hooks/useBackupReminder";

export function AppLayout() {
  const location = useLocation();
  
  // Initialize backup reminder - this will show notification if overdue
  useBackupReminder();
  
  // Pages that should NOT show the bottom nav
  const hideNavRoutes = ["/settings", "/safety", "/summary"];
  const shouldHideNav = hideNavRoutes.some(route => location.pathname.startsWith(route));

  return (
    <div className="min-h-screen bg-background">
      <main className={shouldHideNav ? "" : "pb-24"}>
        <Outlet />
      </main>
      {!shouldHideNav && <BottomNav />}
    </div>
  );
}

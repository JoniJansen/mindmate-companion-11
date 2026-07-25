import { useState } from "react";
import { Outlet, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "@/components/system/OfflineBanner";
import { BOTTOM_NAV_HEIGHT } from "@/lib/safeArea";

/**
 * Freezes the outlet element at mount time so the *exiting* page keeps
 * rendering its own content during the AnimatePresence exit transition.
 * (A plain <Outlet /> would re-resolve to the NEW route while fading out.)
 */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return <>{frozen}</>;
}

export function AppLayout() {
  const location = useLocation();
  // Hard requirement: users with prefers-reduced-motion get NO route
  // transition at all (vestibular safety — this is a mental-health app).
  const prefersReducedMotion = useReducedMotion();

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
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
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
        {prefersReducedMotion ? (
          <Outlet />
        ) : (
          /* Soft cross-fade between the main tab screens. Opacity-only on
             purpose: a transform here would turn this wrapper into the
             containing block for position:fixed children (journal mic,
             modals) and make them jump during the transition. */
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeIn" } }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <FrozenOutlet />
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Bottom nav - fixed, never scroll */}
      {!shouldHideNav && <BottomNav />}
    </div>
  );
}

import { ReactNode, useEffect } from "react";

/**
 * Wrapper for standalone pages (not inside AppLayout).
 *
 * iOS Capacitor WKWebView quirk: a `fixed inset-0 overflow-y-auto`
 * container does not reliably receive touch-scroll events on iPad,
 * which left the /upgrade paywall unscrollable (Apple Review reject
 * risk under 3.1.2(a)).
 *
 * Fix: render in normal document flow with `min-h-[100dvh]` and let
 * the WebView's native scroll handle the gesture. Because the global
 * `body` and `#root` are locked to `position:fixed; overflow:hidden`
 * (required by AppLayout's internal scroll containers), we toggle a
 * `standalone-scroll` body class while this wrapper is mounted that
 * releases that lock so native body scroll works.
 */
export function StandalonePage({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add("standalone-scroll");
    // Debug instrumentation — verify class application + computed style on iPad WebView.
    console.log("[StandalonePage] Mounted, body classes:", document.body.className);
    console.log(
      "[StandalonePage] Body computed overflow:",
      window.getComputedStyle(document.body).overflow,
    );
    return () => {
      document.body.classList.remove("standalone-scroll");
      console.log("[StandalonePage] Unmounted, body classes:", document.body.className);
    };
  }, []);

  return (
    <div
      className="min-h-[100dvh] w-full bg-background"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
      }}
    >
      {children}
    </div>
  );
}

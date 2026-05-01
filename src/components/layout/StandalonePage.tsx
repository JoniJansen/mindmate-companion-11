import { ReactNode } from "react";

/**
 * Wrapper for standalone pages (not inside AppLayout).
 *
 * Previously used `fixed inset-0 overflow-y-auto` to bypass the #root
 * `overflow:hidden` constraint. That approach is fragile inside the iOS
 * Capacitor WKWebView — touch events do not reliably reach the scroll
 * handler of a fixed-positioned overflow container, leaving the page
 * unscrollable on iPad (Apple Review reject risk under 3.1.2(a)).
 *
 * New approach: render in normal document flow with `min-h-[100dvh]` so
 * the WebView's native body scroll handles touch gestures. Pages that
 * need a sticky header should use `position: sticky` themselves.
 */
export function StandalonePage({ children }: { children: ReactNode }) {
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

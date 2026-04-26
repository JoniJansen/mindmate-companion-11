import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { migrateLegacyKeys } from "./lib/migrateLegacyKeys";

// Self-hosted Plus Jakarta Sans — no Google Fonts network request (DSGVO-safe).
import "@fontsource/plus-jakarta-sans/300.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";

// Run localStorage migration before anything else
migrateLegacyKeys();

// DEV-only: Suppress known React 18 forwardRef warnings caused by ErrorBoundary class component.
// These are false positives — ErrorBoundary doesn't pass refs, but React 18 DEV mode validates
// all function component children of class components. Safe to suppress; does NOT appear in production.
if (import.meta.env.DEV) {
  const origConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (msg.includes("Function components cannot be given refs")) {
      // Suppress all forwardRef warnings — they're caused by ErrorBoundary class component
      // and React 18 DEV mode ref validation. Harmless, don't appear in production.
      return;
    }
    origConsoleError.apply(console, args);
  };
}

// Detect Capacitor (native iOS/Android) — used to skip browser-only features.
const isCapacitorNative = (): boolean => {
  try {
    return typeof window !== "undefined" &&
      "Capacitor" in window &&
      typeof (window as any).Capacitor?.isNativePlatform === "function" &&
      (window as any).Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

// Global unhandled error capture — defensive only. Logs in DEV, swallows in
// production to prevent silent crashes from killing the WebView (iOS Capacitor).
// We deliberately do NOT throw, exit, or rethrow inside these handlers.
window.addEventListener("unhandledrejection", (event) => {
  if (import.meta.env.DEV) console.error("[UnhandledRejection]", event.reason);
  // Swallow on native to prevent the WebView from showing its default crash UI.
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  if (import.meta.env.DEV) console.error("[GlobalError]", event.error || event.message);
  // Do not call preventDefault for runtime errors — let React's ErrorBoundary
  // and the dev overlay still receive them. We just refuse to crash the bundle.
});

// Service Worker — register only on real browsers, NEVER inside Capacitor.
// VitePWA injects the registration glue automatically; on Capacitor that glue
// produces noisy warnings and (in some cases) interferes with native bridge
// initialization. Best practice: actively unregister any existing SW when
// running natively.
if (isCapacitorNative()) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister().catch(() => {})))
      .catch(() => {});
  }
}

createRoot(document.getElementById("root")!).render(<App />);

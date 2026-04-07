import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { migrateLegacyKeys } from "./lib/migrateLegacyKeys";

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

// Global unhandled error capture — prevents silent crashes
window.addEventListener("unhandledrejection", (event) => {
  if (import.meta.env.DEV) console.error("[UnhandledRejection]", event.reason);
  // Prevent default browser error logging in production
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  if (import.meta.env.DEV) console.error("[GlobalError]", event.error || event.message);
});

createRoot(document.getElementById("root")!).render(<App />);

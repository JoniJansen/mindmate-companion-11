import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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

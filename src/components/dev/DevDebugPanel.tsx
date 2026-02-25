import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, X, Trash2, Database, WifiOff, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { supabase } from "@/integrations/supabase/client";

export function DevDebugPanel() {
  // ALL hooks unconditionally at the top — no early returns before hooks
  const [isOpen, setIsOpen] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [monkeyRunning, setMonkeyRunning] = useState(false);
  const [monkeyErrors, setMonkeyErrors] = useState<string[]>([]);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const monkeyRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const monkeyErrorHandler = useRef<((e: ErrorEvent) => void) | null>(null);

  const { language } = useTranslation();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Listen for unhandled errors
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      setLastError(`${e.message} at ${e.filename}:${e.lineno}`);
    };
    const rejHandler = (e: PromiseRejectionEvent) => {
      setLastError(`Unhandled: ${e.reason?.message || e.reason}`);
    };
    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", rejHandler);
    return () => {
      window.removeEventListener("error", handler);
      window.removeEventListener("unhandledrejection", rejHandler);
    };
  }, []);

  // Cleanup monkey test on unmount
  useEffect(() => {
    return () => {
      if (monkeyRef.current) clearInterval(monkeyRef.current);
      if (monkeyErrorHandler.current) {
        window.removeEventListener("error", monkeyErrorHandler.current);
      }
    };
  }, []);

  const clearStorage = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const seedDemoData = useCallback(async () => {
    if (!user) return;
    const moods = [1, 2, 3, 4, 5, 3, 4];
    const entries = [
      "Heute war ein guter Tag. Ich habe viel geschafft.",
      "Ich fühle mich gestresst wegen der Arbeit.",
      "Ein ruhiger Abend. Dankbar für die kleine Dinge.",
    ];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      await supabase.from("mood_checkins").insert({
        user_id: user.id,
        user_session_id: user.id,
        mood_value: moods[i],
        feelings: ["calm", "grateful"],
        created_at: date.toISOString(),
      } as any);
    }

    for (const content of entries) {
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        user_session_id: user.id,
        content,
        source: "free",
        tags: ["calm"],
      } as any);
    }

    alert("Demo data seeded!");
  }, [user]);

  const stopMonkey = useCallback(() => {
    if (monkeyRef.current) clearInterval(monkeyRef.current);
    monkeyRef.current = null;
    setMonkeyRunning(false);
    if (monkeyErrorHandler.current) {
      window.removeEventListener("error", monkeyErrorHandler.current);
      monkeyErrorHandler.current = null;
    }
  }, []);

  const startMonkey = useCallback(() => {
    if (monkeyRunning) { stopMonkey(); return; }
    setMonkeyRunning(true);
    setMonkeyErrors([]);
    const routes = ["/chat", "/journal", "/mood", "/toolbox", "/topics", "/settings"];
    let elapsed = 0;

    const errHandler = (e: ErrorEvent) => {
      setMonkeyErrors(prev => [...prev, e.message]);
    };
    monkeyErrorHandler.current = errHandler;
    window.addEventListener("error", errHandler);

    monkeyRef.current = setInterval(() => {
      elapsed += 2;
      if (elapsed >= 60) { stopMonkey(); return; }
      
      // Random navigation
      const route = routes[Math.floor(Math.random() * routes.length)];
      window.history.pushState({}, "", route);
      window.dispatchEvent(new PopStateEvent("popstate"));

      // Random button click
      const buttons = document.querySelectorAll("button:not([disabled])");
      if (buttons.length > 0) {
        const btn = buttons[Math.floor(Math.random() * buttons.length)] as HTMLElement;
        try { btn.click(); } catch {}
      }
    }, 2000);
  }, [monkeyRunning, stopMonkey]);

  // Conditional rendering AFTER all hooks
  if (import.meta.env.PROD) return null;

  const prefs = (() => {
    try { return JSON.parse(localStorage.getItem("mindmate-preferences") || "{}"); } catch { return {}; }
  })();

  const route = window.location.pathname;
  const theme = (() => {
    try { return JSON.parse(localStorage.getItem("mindmate-theme") || "{}").mode || "light"; } catch { return "light"; }
  })();
  const accent = (() => {
    try { return JSON.parse(localStorage.getItem("mindmate-theme") || "{}").accentColor || "default"; } catch { return "default"; }
  })();
  const onboardingDone = localStorage.getItem("mindmate-onboarding-done") === "true";

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 z-[999] w-8 h-8 rounded-full bg-card/80 border border-border shadow-elevated flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
      >
        <Bug className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed top-12 left-3 z-[999] w-72 bg-card border border-border rounded-xl shadow-elevated p-3 text-xs space-y-2 max-h-[60vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">🔧 Dev Debug</span>
              <button onClick={() => setIsOpen(false)}><X className="w-3.5 h-3.5" /></button>
            </div>

            <div className="space-y-1 text-muted-foreground">
              <p><strong>Route:</strong> {route}</p>
              <p><strong>Auth:</strong> {user ? `✅ ${user.email}` : "❌ Not signed in"}</p>
              <p><strong>Onboarding:</strong> {onboardingDone ? "✅" : "❌"}</p>
              <p><strong>Language:</strong> {language}</p>
              <p><strong>Theme:</strong> {theme}</p>
              <p><strong>Accent:</strong> {accent}</p>
              <p className="flex items-center gap-1">
                <strong>Network:</strong> {(isOnline && !simulateOffline) ? "✅ Online" : <><WifiOff className="w-3 h-3 text-destructive" /> Offline</>}
              </p>
              {lastError && (
                <p className="text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {lastError.slice(0, 80)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={clearStorage}>
                <Trash2 className="w-3 h-3" /> Clear Storage
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={seedDemoData} disabled={!user}>
                <Database className="w-3 h-3" /> Seed Data
              </Button>
              <Button 
                variant={simulateOffline ? "destructive" : "outline"} 
                size="sm" className="text-xs h-7 gap-1" 
                onClick={() => setSimulateOffline(!simulateOffline)}
              >
                <WifiOff className="w-3 h-3" /> {simulateOffline ? "Go Online" : "Sim Offline"}
              </Button>
              <Button 
                variant={monkeyRunning ? "destructive" : "outline"} 
                size="sm" className="text-xs h-7 gap-1" 
                onClick={startMonkey}
              >
                <Zap className="w-3 h-3" /> {monkeyRunning ? "Stop Monkey" : "Monkey Test"}
              </Button>
            </div>

            {monkeyErrors.length > 0 && (
              <div className="bg-destructive/10 rounded p-2 text-destructive">
                <p className="font-medium mb-1">Monkey Errors ({monkeyErrors.length}):</p>
                {monkeyErrors.slice(-3).map((e, i) => (
                  <p key={i} className="truncate">{e}</p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

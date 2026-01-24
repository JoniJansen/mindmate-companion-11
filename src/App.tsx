import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

// Layout
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CookieConsent } from "@/components/gdpr/CookieConsent";

// Pages
import Landing from "@/pages/Landing";
import Chat from "@/pages/Chat";
import Journal from "@/pages/Journal";
import Topics from "@/pages/Topics";
import Mood from "@/pages/Mood";
import Toolbox from "@/pages/Toolbox";
import Onboarding from "@/pages/Onboarding";
import Settings from "@/pages/Settings";
import Safety from "@/pages/Safety";
import Summary from "@/pages/Summary";
import Install from "@/pages/Install";
import Upgrade from "@/pages/Upgrade";
import Auth from "@/pages/Auth";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Impressum from "@/pages/Impressum";
import FAQ from "@/pages/FAQ";
import Cancellation from "@/pages/Cancellation";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Initialize theme from localStorage
function ThemeInitializer() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mindmate-theme");
      if (stored) {
        const theme = JSON.parse(stored);
        const root = document.documentElement;
        
        // Determine actual mode
        let actualMode: "light" | "dark" = theme.mode === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
          : theme.mode;

        // Apply dark/light class
        if (actualMode === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    } catch {
      // Use defaults
    }
  }, []);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeInitializer />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CookieConsent />
        <Routes>
          {/* Landing Page */}
          <Route path="/landing" element={<Landing />} />
          
          {/* Auth */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Onboarding */}
          <Route path="/welcome" element={<Onboarding />} />
          
          {/* Main app with bottom navigation - Protected */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/mood" element={<Mood />} />
            <Route path="/toolbox" element={<Toolbox />} />
          </Route>
          
          {/* Standalone protected pages */}
          <Route path="/summary" element={<ProtectedRoute><Summary /></ProtectedRoute>} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/install" element={<Install />} />
          <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/cancellation" element={<Cancellation />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

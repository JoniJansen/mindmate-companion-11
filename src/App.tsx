import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";

// Layout & Providers
import { AppLayout } from "@/components/layout/AppLayout";
import { OnboardingGuard } from "@/components/routing/OnboardingGuard";
import { CookieConsent } from "@/components/gdpr/CookieConsent";
import { TourProvider } from "@/components/tour/TourProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";

// Hooks
import { usePremium } from "@/hooks/usePremium";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useAuth } from "@/hooks/useAuth";

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
import Contact from "@/pages/Contact";
import About from "@/pages/About";
import Admin from "@/pages/Admin";
import DeleteAccount from "@/pages/DeleteAccount";
import NotFound from "@/pages/NotFound";
import AudioLibrary from "@/pages/AudioLibrary";
import ReviewInstructions from "@/pages/ReviewInstructions";
import ReviewStatus from "@/pages/ReviewStatus";

// DEV-ONLY: Device QA screen (lazy load to exclude from prod bundle)
const DevQA = lazy(() => import("@/pages/DevQA"));

const queryClient = new QueryClient();

// Initialize theme from localStorage
function ThemeInitializer() {
  useEffect(() => {
    const root = document.documentElement;
    try {
      const stored = localStorage.getItem("mindmate-theme");
      if (stored) {
        const theme = JSON.parse(stored);
        
        // Determine actual mode - default to light
        let actualMode: "light" | "dark" = theme.mode === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
          : (theme.mode || "light");

        if (actualMode === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      } else {
        // No stored theme - ensure light mode
        root.classList.remove("dark");
      }
    } catch {
      // Default to light mode
      root.classList.remove("dark");
    }
  }, []);

  return null;
}

// RevenueCat subscription restore on app start
function SubscriptionRestoreInitializer() {
  const { isRevenueCatAvailable, restorePurchases, checkSubscriptionStatus } = usePremium();

  useEffect(() => {
    // Auto-check subscription status on app start
    // RevenueCat handles restore internally when checking entitlements
    if (isRevenueCatAvailable) {
      checkSubscriptionStatus();
    }
  }, [isRevenueCatAvailable, checkSubscriptionStatus]);

  return null;
}

// Root redirect handler - decides where to send users
function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasCompletedOnboarding } = useOnboardingStatus();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // If authenticated, go to chat
  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }
  
  // If completed onboarding but not authenticated, go to auth
  if (hasCompletedOnboarding()) {
    return <Navigate to="/auth" replace />;
  }
  
  // New user - go to welcome/onboarding
  return <Navigate to="/welcome" replace />;
}

// Cookie consent wrapper - delays until after onboarding
function DelayedCookieConsent() {
  const { hasCompletedOnboarding } = useOnboardingStatus();
  
  // Only show cookie consent after onboarding is complete
  if (!hasCompletedOnboarding()) {
    return null;
  }
  
  return <CookieConsent />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeInitializer />
          <SubscriptionRestoreInitializer />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <TourProvider>
              <DelayedCookieConsent />
              <Routes>
                {/* Root - intelligent redirect */}
                <Route path="/" element={<RootRedirect />} />
                
                {/* Landing Page - marketing/info */}
                <Route path="/landing" element={<Landing />} />
                
                {/* Auth */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Onboarding - accessible without auth */}
                <Route path="/welcome" element={<Onboarding />} />
                
                {/* Main app with bottom navigation - Protected with OnboardingGuard */}
                <Route element={<OnboardingGuard><AppLayout /></OnboardingGuard>}>
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/topics" element={<Topics />} />
                  <Route path="/mood" element={<Mood />} />
                  <Route path="/toolbox" element={<Toolbox />} />
                </Route>
                
                {/* Standalone protected pages */}
                <Route path="/summary" element={<OnboardingGuard><Summary /></OnboardingGuard>} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/settings" element={<OnboardingGuard><Settings /></OnboardingGuard>} />
                <Route path="/install" element={<Install />} />
                <Route path="/upgrade" element={<OnboardingGuard><Upgrade /></OnboardingGuard>} />
                <Route path="/audio" element={<OnboardingGuard><AudioLibrary /></OnboardingGuard>} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/cancellation" element={<Cancellation />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/delete-account" element={<DeleteAccount />} />
                <Route path="/admin" element={<OnboardingGuard><Admin /></OnboardingGuard>} />
                
                {/* Review Mode Pages - accessible without OnboardingGuard for Apple Review */}
                <Route path="/review-instructions" element={<ReviewInstructions />} />
                <Route path="/review-status" element={<ReviewStatus />} />
                
                {/* DEV-ONLY: Device QA screen */}
                {import.meta.env.DEV && (
                  <Route path="/dev-qa" element={
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>}>
                      <OnboardingGuard><DevQA /></OnboardingGuard>
                    </Suspense>
                  } />
                )}
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TourProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

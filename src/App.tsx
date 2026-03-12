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
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";

// Hooks
import { usePremium } from "@/hooks/usePremium";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useAuth } from "@/hooks/useAuth";

// Critical pages (eagerly loaded for instant navigation)
import Chat from "@/pages/Chat";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";

// Lazy-loaded pages (code-split for faster initial load)
const Landing = lazy(() => import("@/pages/Landing"));
const Journal = lazy(() => import("@/pages/Journal"));
const Topics = lazy(() => import("@/pages/Topics"));
const Mood = lazy(() => import("@/pages/Mood"));
const Toolbox = lazy(() => import("@/pages/Toolbox"));
const Settings = lazy(() => import("@/pages/Settings"));
const Safety = lazy(() => import("@/pages/Safety"));
const Summary = lazy(() => import("@/pages/Summary"));
const Install = lazy(() => import("@/pages/Install"));
const Upgrade = lazy(() => import("@/pages/Upgrade"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Impressum = lazy(() => import("@/pages/Impressum"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Cancellation = lazy(() => import("@/pages/Cancellation"));
const Contact = lazy(() => import("@/pages/Contact"));
const About = lazy(() => import("@/pages/About"));
const Admin = lazy(() => import("@/pages/Admin"));
const DeleteAccount = lazy(() => import("@/pages/DeleteAccount"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AudioLibrary = lazy(() => import("@/pages/AudioLibrary"));
const Timeline = lazy(() => import("@/pages/Timeline"));
const ChatHistory = lazy(() => import("@/pages/ChatHistory"));
const ReviewInstructions = lazy(() => import("@/pages/ReviewInstructions"));
const ReviewStatus = lazy(() => import("@/pages/ReviewStatus"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const DevQA = lazy(() => import("@/pages/DevQA"));
const Diagnostics = lazy(() => import("@/pages/Diagnostics"));
const CompanionSettings = lazy(() => import("@/pages/CompanionSettings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min – avoid redundant refetches
      gcTime: 10 * 60 * 1000,   // 10 min garbage-collection window
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize theme from localStorage
function ThemeInitializer() {
  useEffect(() => {
    const root = document.documentElement;
    try {
      const stored = localStorage.getItem("soulvay-theme") || localStorage.getItem("mindmate-theme");
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
    return <Navigate to="/home" replace />;
  }
  
  // If completed onboarding but not authenticated, go to auth
  if (hasCompletedOnboarding()) {
    return <Navigate to="/auth" replace />;
  }
  
  // New user - show landing page
  return <Navigate to="/landing" replace />;
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

// Shared loading fallback for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function AppContent() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeInitializer />
          <SubscriptionRestoreInitializer />
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <TourProvider>
              <DelayedCookieConsent />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Root - intelligent redirect */}
                  <Route path="/" element={<RootRedirect />} />
                  
                  {/* Landing Page - marketing/info */}
                  <Route path="/landing" element={<Landing />} />
                  
                  {/* Auth */}
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Onboarding - accessible without auth */}
                  <Route path="/welcome" element={<Onboarding />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  
                  {/* Main app with bottom navigation - Protected with OnboardingGuard */}
                  <Route element={<OnboardingGuard><AppLayout /></OnboardingGuard>}>
                    <Route path="/home" element={<SectionErrorBoundary section="home"><Home /></SectionErrorBoundary>} />
                    <Route path="/chat" element={<SectionErrorBoundary section="chat"><Chat /></SectionErrorBoundary>} />
                    <Route path="/journal" element={<SectionErrorBoundary section="journal"><Journal /></SectionErrorBoundary>} />
                    <Route path="/topics" element={<SectionErrorBoundary section="topics"><Topics /></SectionErrorBoundary>} />
                    <Route path="/mood" element={<SectionErrorBoundary section="mood"><Mood /></SectionErrorBoundary>} />
                    <Route path="/toolbox" element={<SectionErrorBoundary section="toolbox"><Toolbox /></SectionErrorBoundary>} />
                  </Route>
                  
                  {/* Standalone protected pages */}
                  <Route path="/summary" element={<OnboardingGuard><Summary /></OnboardingGuard>} />
                  <Route path="/safety" element={<Safety />} />
                  <Route path="/settings" element={<OnboardingGuard><Settings /></OnboardingGuard>} />
                  <Route path="/install" element={<Install />} />
                  <Route path="/upgrade" element={<OnboardingGuard><Upgrade /></OnboardingGuard>} />
                  <Route path="/audio" element={<OnboardingGuard><AudioLibrary /></OnboardingGuard>} />
                  <Route path="/timeline" element={<OnboardingGuard><Timeline /></OnboardingGuard>} />
                  <Route path="/chat-history" element={<OnboardingGuard><ChatHistory /></OnboardingGuard>} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/impressum" element={<Impressum />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/cancellation" element={<Cancellation />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/delete-account" element={<DeleteAccount />} />
                  <Route path="/admin" element={<OnboardingGuard><Admin /></OnboardingGuard>} />
                  <Route path="/companion" element={<OnboardingGuard><CompanionSettings /></OnboardingGuard>} />
                  
                  {/* Review Mode Pages */}
                  <Route path="/review-instructions" element={<ReviewInstructions />} />
                  <Route path="/review-status" element={<ReviewStatus />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* DEV-ONLY */}
                  {import.meta.env.DEV && (
                    <>
                      <Route path="/dev-qa" element={<OnboardingGuard><DevQA /></OnboardingGuard>} />
                      <Route path="/diagnostics" element={<Diagnostics />} />
                    </>
                  )}
                  
                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </TourProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

const App = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;

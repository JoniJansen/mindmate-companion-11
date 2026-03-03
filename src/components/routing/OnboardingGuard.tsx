import { forwardRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * OnboardingGuard handles the first-time user flow:
 * 
 * 1. New user (no session, no onboarding): → /welcome
 * 2. Onboarded but not logged in: → /auth
 * 3. Logged in: → children (app content)
 * 
 * CRITICAL: This guard MUST block access until authentication is confirmed.
 */
export const OnboardingGuard = forwardRef<HTMLDivElement, OnboardingGuardProps>(function OnboardingGuard({ children }, _ref) {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasCompletedOnboarding } = useOnboardingStatus();
  const location = useLocation();

  // Show loading while checking auth state - CRITICAL: Don't render children until auth is confirmed
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // CRITICAL: Check authentication FIRST before anything else
  // If authenticated, allow access
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated - determine where to redirect
  const onboardingCompleted = hasCompletedOnboarding();
  
  // If completed onboarding but not authenticated, redirect to auth
  if (onboardingCompleted) {
    const redirectPath = encodeURIComponent(location.pathname);
    return <Navigate to={`/auth?redirect=${redirectPath}`} replace />;
  }

  // If not authenticated and haven't completed onboarding, redirect to welcome
  return <Navigate to="/welcome" replace />;
});

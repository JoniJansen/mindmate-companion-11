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
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasCompletedOnboarding } = useOnboardingStatus();
  const location = useLocation();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If authenticated, allow access
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated but completed onboarding, redirect to auth
  if (hasCompletedOnboarding()) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // If not authenticated and haven't completed onboarding, redirect to welcome
  return <Navigate to="/welcome" replace />;
}

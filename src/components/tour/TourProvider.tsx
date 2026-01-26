import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from "react";
import { useAppTour } from "@/hooks/useAppTour";
import { AppTour } from "./AppTour";
import { useLocation } from "react-router-dom";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

const TOUR_TRIGGERED_KEY = "mindmate_tour_auto_triggered";

interface TourContextValue {
  startTour: () => void;
  resetTour: () => void;
  hasCompletedTour: boolean;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within TourProvider");
  }
  return context;
}

interface TourProviderProps {
  children: ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const tour = useAppTour();
  const location = useLocation();
  const { hasCompletedOnboarding } = useOnboardingStatus();
  const [hasAutoTriggered, setHasAutoTriggered] = useState(() => {
    return localStorage.getItem(TOUR_TRIGGERED_KEY) === "true";
  });

  // Check if we should auto-trigger the tour
  const shouldAutoTrigger = useCallback(() => {
    // Only trigger if:
    // 1. On /chat page
    // 2. Onboarding is complete
    // 3. Tour hasn't been completed
    // 4. Tour isn't currently active
    // 5. Haven't already auto-triggered this session
    return (
      location.pathname === "/chat" &&
      hasCompletedOnboarding() &&
      !tour.hasCompletedTour &&
      !tour.isActive &&
      !hasAutoTriggered
    );
  }, [location.pathname, hasCompletedOnboarding, tour.hasCompletedTour, tour.isActive, hasAutoTriggered]);

  // Auto-start tour for users who just completed onboarding
  useEffect(() => {
    if (shouldAutoTrigger()) {
      // Mark as triggered to prevent re-triggering
      localStorage.setItem(TOUR_TRIGGERED_KEY, "true");
      setHasAutoTriggered(true);
      
      // Small delay to let the page render and stabilize
      const timer = setTimeout(() => {
        tour.startTour();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [shouldAutoTrigger, tour]);

  const handleResetTour = useCallback(() => {
    localStorage.removeItem(TOUR_TRIGGERED_KEY);
    setHasAutoTriggered(false);
    tour.resetTour();
  }, [tour]);

  return (
    <TourContext.Provider
      value={{
        startTour: tour.startTour,
        resetTour: handleResetTour,
        hasCompletedTour: tour.hasCompletedTour,
      }}
    >
      {children}
      <AppTour />
    </TourContext.Provider>
  );
}

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useAppTour } from "@/hooks/useAppTour";
import { AppTour } from "./AppTour";
import { useLocation } from "react-router-dom";

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
  const [hasCheckedTour, setHasCheckedTour] = useState(false);

  // Auto-start tour for new users on first visit to /chat
  useEffect(() => {
    if (
      location.pathname === "/chat" && 
      !tour.hasCompletedTour && 
      !tour.isActive &&
      !hasCheckedTour
    ) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        tour.startTour();
        setHasCheckedTour(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, tour.hasCompletedTour, tour.isActive, hasCheckedTour]);

  return (
    <TourContext.Provider
      value={{
        startTour: tour.startTour,
        resetTour: tour.resetTour,
        hasCompletedTour: tour.hasCompletedTour,
      }}
    >
      {children}
      <AppTour />
    </TourContext.Provider>
  );
}

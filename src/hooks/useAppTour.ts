import { useState, useEffect, useCallback } from "react";

export interface TourStep {
  id: string;
  target: string; // CSS selector or element ID
  title: { en: string; de: string };
  description: { en: string; de: string };
  position?: "top" | "bottom" | "left" | "right" | "center";
}

const TOUR_COMPLETED_KEY = "mindmate_tour_completed";

export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    target: "center",
    title: { en: "Welcome to MindMate! 👋", de: "Willkommen bei MindMate! 👋" },
    description: {
      en: "Let me show you around. This quick tour will help you get the most out of your mental wellness companion.",
      de: "Lass mich dir alles zeigen. Diese kurze Tour hilft dir, das Beste aus deinem Begleiter für mentales Wohlbefinden herauszuholen.",
    },
    position: "center",
  },
  {
    id: "chat",
    target: "[data-tour='chat']",
    title: { en: "Chat with MindMate", de: "Chatte mit MindMate" },
    description: {
      en: "This is your safe space. Share what's on your mind, and I'll listen and help you reflect. Everything stays private.",
      de: "Das ist dein sicherer Raum. Teile, was dich beschäftigt, und ich höre zu und helfe dir beim Reflektieren. Alles bleibt privat.",
    },
    position: "top",
  },
  {
    id: "journal",
    target: "[data-tour='journal']",
    title: { en: "Your Journal", de: "Dein Tagebuch" },
    description: {
      en: "Write down your thoughts freely or use guided prompts. Your journal helps you track patterns over time.",
      de: "Schreibe deine Gedanken frei auf oder nutze geführte Impulse. Dein Tagebuch hilft dir, Muster über die Zeit zu erkennen.",
    },
    position: "top",
  },
  {
    id: "topics",
    target: "[data-tour='topics']",
    title: { en: "Explore Topics", de: "Themen entdecken" },
    description: {
      en: "Learn about anxiety, stress, self-care, and more. Each topic includes practical exercises and insights.",
      de: "Lerne über Angst, Stress, Selbstfürsorge und mehr. Jedes Thema enthält praktische Übungen und Einblicke.",
    },
    position: "top",
  },
  {
    id: "mood",
    target: "[data-tour='mood']",
    title: { en: "Track Your Mood", de: "Verfolge deine Stimmung" },
    description: {
      en: "Quick check-ins help you understand your emotional patterns. It takes just a few seconds.",
      de: "Schnelle Check-ins helfen dir, deine emotionalen Muster zu verstehen. Es dauert nur wenige Sekunden.",
    },
    position: "top",
  },
  {
    id: "toolbox",
    target: "[data-tour='toolbox']",
    title: { en: "Your Toolbox", de: "Deine Toolbox" },
    description: {
      en: "Breathing exercises, grounding techniques, and more. Use these tools whenever you need a moment of calm.",
      de: "Atemübungen, Erdungstechniken und mehr. Nutze diese Werkzeuge, wann immer du einen Moment der Ruhe brauchst.",
    },
    position: "top",
  },
  {
    id: "complete",
    target: "center",
    title: { en: "You're all set! ✨", de: "Du bist startklar! ✨" },
    description: {
      en: "Start by sharing how you're feeling in the chat. Remember, this is your private space – take your time.",
      de: "Beginne damit, im Chat zu teilen, wie du dich fühlst. Denk dran, das ist dein privater Raum – nimm dir Zeit.",
    },
    position: "center",
  },
];

export function useAppTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
    setHasCompletedTour(completed === "true");
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    completeTour();
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setHasCompletedTour(true);
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    setHasCompletedTour(false);
  }, []);

  return {
    isActive,
    currentStep,
    totalSteps: tourSteps.length,
    currentStepData: tourSteps[currentStep],
    hasCompletedTour,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour,
  };
}

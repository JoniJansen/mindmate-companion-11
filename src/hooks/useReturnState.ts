import { useState, useEffect } from "react";

export type ReturnCategory = "same_day" | "short_absence" | "medium_absence" | "long_absence" | "first_visit" | null;

interface ReturnState {
  category: ReturnCategory;
  daysSinceLastVisit: number;
  welcomeMessage: string;
  dismiss: () => void;
}

const LAST_VISIT_KEY = "soulvay-last-visit";
const RETURN_DISMISSED_KEY = "soulvay-return-dismissed";

function getWelcomeMessage(category: ReturnCategory, language: string, companionName: string): string {
  const msgs: Record<NonNullable<ReturnCategory>, { de: string; en: string }> = {
    first_visit: {
      de: `Willkommen. ${companionName} freut sich, dich kennenzulernen.`,
      en: `Welcome. ${companionName} is looking forward to getting to know you.`,
    },
    same_day: {
      de: "Schön, dass du wieder da bist.",
      en: "Nice to see you again.",
    },
    short_absence: {
      de: "Schön, dass du wieder da bist. Dein sicherer Ort ist noch da.",
      en: "Welcome back. Your safe space is still here.",
    },
    medium_absence: {
      de: "Schön, dass du wieder da bist. Wir können einfach da weitermachen, wo du gerade bist.",
      en: "Good to see you. We can simply pick up wherever you are right now.",
    },
    long_absence: {
      de: "Es ist schön, dich wiederzusehen. Kein Druck — nimm dir so viel Zeit, wie du brauchst.",
      en: "It's lovely to see you again. No pressure — take all the time you need.",
    },
  };
  return msgs[category!]?.[language as "de" | "en"] || msgs[category!]?.en || "";
}

export function useReturnState(language: string, companionName: string): ReturnState {
  const [category, setCategory] = useState<ReturnCategory>(null);
  const [daysSince, setDaysSince] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const now = Date.now();
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const sessionDismissed = sessionStorage.getItem(RETURN_DISMISSED_KEY);

    if (sessionDismissed) {
      setDismissed(true);
      // Still update last visit
      localStorage.setItem(LAST_VISIT_KEY, now.toString());
      return;
    }

    if (!lastVisit) {
      setCategory("first_visit");
      setDaysSince(0);
    } else {
      const diff = now - parseInt(lastVisit, 10);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      setDaysSince(days);

      if (days < 1) setCategory("same_day");
      else if (days < 4) setCategory("short_absence");
      else if (days < 8) setCategory("medium_absence");
      else setCategory("long_absence");
    }

    localStorage.setItem(LAST_VISIT_KEY, now.toString());
  }, []);

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(RETURN_DISMISSED_KEY, "1");
  };

  // Only show for short_absence+ (not same_day or first_visit, to avoid noise)
  const showCategory = !dismissed && category && category !== "same_day" && category !== "first_visit"
    ? category
    : null;

  return {
    category: showCategory,
    daysSinceLastVisit: daysSince,
    welcomeMessage: showCategory ? getWelcomeMessage(showCategory, language, companionName) : "",
    dismiss,
  };
}

import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type AccentColor = "sage" | "ocean" | "lavender" | "rose" | "amber" | "mint";

interface ThemeConfig {
  mode: ThemeMode;
  accentColor: AccentColor;
}

const defaultTheme: ThemeConfig = {
  mode: "light",
  accentColor: "sage",
};

// Accent color CSS variable overrides
const accentColors: Record<AccentColor, { light: Record<string, string>; dark: Record<string, string> }> = {
  sage: {
    light: {
      "--primary": "150 30% 45%",
      "--primary-soft": "150 30% 92%",
      "--ring": "150 30% 45%",
    },
    dark: {
      "--primary": "150 35% 55%",
      "--primary-soft": "150 25% 20%",
      "--ring": "150 35% 55%",
    },
  },
  ocean: {
    light: {
      "--primary": "200 70% 45%",
      "--primary-soft": "200 60% 92%",
      "--ring": "200 70% 45%",
    },
    dark: {
      "--primary": "200 65% 55%",
      "--primary-soft": "200 50% 20%",
      "--ring": "200 65% 55%",
    },
  },
  lavender: {
    light: {
      "--primary": "270 50% 55%",
      "--primary-soft": "270 50% 92%",
      "--ring": "270 50% 55%",
    },
    dark: {
      "--primary": "270 45% 65%",
      "--primary-soft": "270 35% 22%",
      "--ring": "270 45% 65%",
    },
  },
  rose: {
    light: {
      "--primary": "340 65% 55%",
      "--primary-soft": "340 60% 92%",
      "--ring": "340 65% 55%",
    },
    dark: {
      "--primary": "340 55% 60%",
      "--primary-soft": "340 40% 22%",
      "--ring": "340 55% 60%",
    },
  },
  amber: {
    light: {
      "--primary": "35 85% 50%",
      "--primary-soft": "35 80% 92%",
      "--ring": "35 85% 50%",
    },
    dark: {
      "--primary": "35 75% 55%",
      "--primary-soft": "35 50% 20%",
      "--ring": "35 75% 55%",
    },
  },
  mint: {
    light: {
      "--primary": "165 55% 45%",
      "--primary-soft": "165 50% 92%",
      "--ring": "165 55% 45%",
    },
    dark: {
      "--primary": "165 50% 55%",
      "--primary-soft": "165 40% 20%",
      "--ring": "165 50% 55%",
    },
  },
};

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeConfig>(defaultTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mindmate-theme");
      if (stored) {
        setThemeState({ ...defaultTheme, ...JSON.parse(stored) });
      }
    } catch {
      // Use defaults
    }
  }, []);

  // Apply theme changes to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Determine actual mode (resolve "system" preference)
    let actualMode: "light" | "dark" = theme.mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme.mode;

    // Apply dark/light class
    if (actualMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply accent color CSS variables
    const colorVars = accentColors[theme.accentColor][actualMode];
    Object.entries(colorVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme.mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      // Trigger re-application of theme
      setThemeState(prev => ({ ...prev }));
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme.mode]);

  const setTheme = useCallback((updates: Partial<ThemeConfig>) => {
    setThemeState(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("mindmate-theme", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setMode = useCallback((mode: ThemeMode) => {
    setTheme({ mode });
  }, [setTheme]);

  const setAccentColor = useCallback((accentColor: AccentColor) => {
    setTheme({ accentColor });
  }, [setTheme]);

  return {
    mode: theme.mode,
    accentColor: theme.accentColor,
    setMode,
    setAccentColor,
    isDark: theme.mode === "dark" || 
      (theme.mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches),
  };
}

// Color options for UI
export const accentColorOptions: { value: AccentColor; label: string; labelDe: string; color: string }[] = [
  { value: "sage", label: "Sage Green", labelDe: "Salbeigrün", color: "bg-[hsl(150,30%,45%)]" },
  { value: "ocean", label: "Ocean Blue", labelDe: "Ozeanblau", color: "bg-[hsl(200,70%,45%)]" },
  { value: "lavender", label: "Lavender", labelDe: "Lavendel", color: "bg-[hsl(270,50%,55%)]" },
  { value: "rose", label: "Rose", labelDe: "Rosa", color: "bg-[hsl(340,65%,55%)]" },
  { value: "amber", label: "Amber", labelDe: "Bernstein", color: "bg-[hsl(35,85%,50%)]" },
  { value: "mint", label: "Mint", labelDe: "Minze", color: "bg-[hsl(165,55%,45%)]" },
];

export const themeModeOptions: { value: ThemeMode; label: string; labelDe: string }[] = [
  { value: "light", label: "Light", labelDe: "Hell" },
  { value: "dark", label: "Dark", labelDe: "Dunkel" },
  { value: "system", label: "System", labelDe: "System" },
];
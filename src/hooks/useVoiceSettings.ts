import { useState, useEffect, useCallback } from "react";

export type VoiceType = "female" | "male" | "neutral";
export type VoiceSpeed = 0.9 | 1.0 | 1.1;
export type VoiceLanguage = "auto" | "de" | "en";

export interface VoiceSettings {
  voiceType: VoiceType;
  speed: VoiceSpeed;
  language: VoiceLanguage;
  autoPlayReplies: boolean;
}

const defaultSettings: VoiceSettings = {
  voiceType: "female",
  speed: 1.0,
  language: "auto",
  autoPlayReplies: false,
};

const STORAGE_KEY = "mindmate-voice-settings";

// ElevenLabs voice IDs - premium quality voices
export const voiceIds: Record<VoiceLanguage, Record<VoiceType, string>> = {
  auto: {
    female: "EXAVITQu4vr4xnSDxMaL", // Sarah - works great for both DE/EN
    male: "JBFqnCBsd6RMkjVDRZzb", // George
    neutral: "SAz9YHcvj6GT2YYXdXww", // River
  },
  de: {
    female: "EXAVITQu4vr4xnSDxMaL", // Sarah
    male: "JBFqnCBsd6RMkjVDRZzb", // George
    neutral: "SAz9YHcvj6GT2YYXdXww", // River
  },
  en: {
    female: "EXAVITQu4vr4xnSDxMaL", // Sarah
    male: "JBFqnCBsd6RMkjVDRZzb", // George
    neutral: "SAz9YHcvj6GT2YYXdXww", // River
  },
};

export function useVoiceSettings() {
  const [settings, setSettings] = useState<VoiceSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (e) {
      console.warn("Failed to load voice settings:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = useCallback((newSettings: VoiceSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.warn("Failed to save voice settings:", e);
    }
  }, []);

  const updateSetting = useCallback(<K extends keyof VoiceSettings>(
    key: K,
    value: VoiceSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    saveSettings(updated);
  }, [settings, saveSettings]);

  const getVoiceId = useCallback((appLanguage: "en" | "de"): string => {
    const langKey = settings.language === "auto" ? appLanguage : settings.language;
    return voiceIds[langKey][settings.voiceType];
  }, [settings]);

  const getEffectiveLanguage = useCallback((appLanguage: "en" | "de"): "en" | "de" => {
    return settings.language === "auto" ? appLanguage : settings.language;
  }, [settings]);

  return {
    settings,
    isLoaded,
    updateSetting,
    getVoiceId,
    getEffectiveLanguage,
    voiceType: settings.voiceType,
    speed: settings.speed,
    language: settings.language,
    autoPlayReplies: settings.autoPlayReplies,
  };
}

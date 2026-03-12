import { useState, useEffect, useCallback } from "react";

export type VoiceType =
  | "female"
  | "femaleSoft"
  | "femaleBright"
  | "male"
  | "maleDeep"
  | "neutral"
  | "neutralWarm";
export type VoiceSpeed = 0.9 | 1.0 | 1.1;
export type VoiceLanguage = "auto" | "de" | "en";
export type AvatarStyle = "orb" | "wave" | "face";

export interface VoiceSettings {
  voiceType: VoiceType;
  speed: VoiceSpeed;
  language: VoiceLanguage;
  autoPlayReplies: boolean;
  avatarStyle: AvatarStyle;
}

const defaultSettings: VoiceSettings = {
  voiceType: "female",
  speed: 1.0,
  language: "auto",
  autoPlayReplies: false,
  avatarStyle: "orb",
};

const STORAGE_KEY = "soulvay-voice-settings";

export const voiceIds: Record<VoiceLanguage, Record<VoiceType, string>> = {
  auto: {
    female: "EXAVITQu4vr4xnSDxMaL", // Sarah
    femaleSoft: "XrExE9yKIg1WjnnlVkGX", // Matilda
    femaleBright: "pFZP5JQG7iQjIQuC4Bku", // Lily
    male: "JBFqnCBsd6RMkjVDRZzb", // George
    maleDeep: "TX3LPaxmHKxFdv7VOQHJ", // Liam
    neutral: "SAz9YHcvj6GT2YYXdXww", // River
    neutralWarm: "Xb7hH8MSUJpSbSDYk0k2", // Alice
  },
  de: {
    female: "EXAVITQu4vr4xnSDxMaL",
    femaleSoft: "XrExE9yKIg1WjnnlVkGX",
    femaleBright: "pFZP5JQG7iQjIQuC4Bku",
    male: "JBFqnCBsd6RMkjVDRZzb",
    maleDeep: "TX3LPaxmHKxFdv7VOQHJ",
    neutral: "SAz9YHcvj6GT2YYXdXww",
    neutralWarm: "Xb7hH8MSUJpSbSDYk0k2",
  },
  en: {
    female: "EXAVITQu4vr4xnSDxMaL",
    femaleSoft: "XrExE9yKIg1WjnnlVkGX",
    femaleBright: "pFZP5JQG7iQjIQuC4Bku",
    male: "JBFqnCBsd6RMkjVDRZzb",
    maleDeep: "TX3LPaxmHKxFdv7VOQHJ",
    neutral: "SAz9YHcvj6GT2YYXdXww",
    neutralWarm: "Xb7hH8MSUJpSbSDYk0k2",
  },
};

const validVoiceTypes = new Set<VoiceType>([
  "female",
  "femaleSoft",
  "femaleBright",
  "male",
  "maleDeep",
  "neutral",
  "neutralWarm",
]);
const validSpeeds = new Set<VoiceSpeed>([0.9, 1.0, 1.1]);
const validLanguages = new Set<VoiceLanguage>(["auto", "de", "en"]);
const validAvatarStyles = new Set<AvatarStyle>(["orb", "wave", "face"]);

function sanitizeSettings(value: unknown): VoiceSettings {
  const parsed = (value && typeof value === "object" ? value : {}) as Partial<VoiceSettings>;

  return {
    voiceType: validVoiceTypes.has(parsed.voiceType as VoiceType)
      ? (parsed.voiceType as VoiceType)
      : defaultSettings.voiceType,
    speed: validSpeeds.has(parsed.speed as VoiceSpeed)
      ? (parsed.speed as VoiceSpeed)
      : defaultSettings.speed,
    language: validLanguages.has(parsed.language as VoiceLanguage)
      ? (parsed.language as VoiceLanguage)
      : defaultSettings.language,
    autoPlayReplies:
      typeof parsed.autoPlayReplies === "boolean"
        ? parsed.autoPlayReplies
        : defaultSettings.autoPlayReplies,
    avatarStyle: validAvatarStyles.has(parsed.avatarStyle as AvatarStyle)
      ? (parsed.avatarStyle as AvatarStyle)
      : defaultSettings.avatarStyle,
  };
}

export function useVoiceSettings() {
  const [settings, setSettings] = useState<VoiceSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(sanitizeSettings(JSON.parse(stored)));
      }
    } catch {
      // Failed to load voice settings – use defaults
    }
    setIsLoaded(true);
  }, []);

  const saveSettings = useCallback((newSettings: VoiceSettings) => {
    const sanitized = sanitizeSettings(newSettings);
    setSettings(sanitized);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // localStorage unavailable
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

import { useState, useCallback, useMemo } from "react";
import { companions, defaultCompanion, getCompanionById, type Companion } from "@/data/companions";

const STORAGE_KEY = "soulvay-companion";

function loadCompanionId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || defaultCompanion.id;
  } catch {
    return defaultCompanion.id;
  }
}

export function useCompanion() {
  const [companionId, setCompanionIdState] = useState<string>(loadCompanionId);

  const companion: Companion = useMemo(
    () => getCompanionById(companionId) ?? defaultCompanion,
    [companionId]
  );

  const setCompanion = useCallback((id: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
    setCompanionIdState(id);
  }, []);

  /** Returns the correct system-prompt language variant */
  const getSystemPrompt = useCallback(
    (language: "en" | "de"): string => companion.systemPrompt[language],
    [companion]
  );

  /** Returns the ElevenLabs voice ID for the companion */
  const getVoiceId = useCallback(
    (language: "en" | "de"): string =>
      language === "de" ? companion.voiceIdDE : companion.voiceIdEN,
    [companion]
  );

  return {
    companion,
    companions,
    companionId,
    setCompanion,
    getSystemPrompt,
    getVoiceId,
  };
}

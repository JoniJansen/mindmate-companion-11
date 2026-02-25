import { useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "soulvay_last_state_v1";

export interface LastExercise {
  id: string;
  step?: number;
  completedAt?: number;
}

export interface LastTopic {
  topicId: string;
  stepIndex?: number;
}

export interface JournalDraft {
  updatedAt: number;
  hasContent: boolean;
}

interface LastState {
  schemaVersion: 1;
  updatedAt: number;
  lastExercise?: LastExercise;
  lastTopic?: LastTopic;
  journalDraft?: JournalDraft;
}

const DEFAULT_STATE: LastState = {
  schemaVersion: 1,
  updatedAt: 0,
};

function readState(): LastState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schemaVersion !== 1) {
      // Future migration placeholder
      return DEFAULT_STATE;
    }
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeState(state: LastState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, updatedAt: Date.now() }));
  } catch {
    // Storage full or unavailable — ignore
  }
}

export function useLastState() {
  const [state, setState] = useState<LastState>(readState);

  // Re-read on focus (tab switch)
  useEffect(() => {
    const handleFocus = () => setState(readState());
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const setLastExercise = useCallback((exercise: LastExercise | undefined) => {
    setState(prev => {
      const next = { ...prev, lastExercise: exercise };
      writeState(next);
      return next;
    });
  }, []);

  const setLastTopic = useCallback((topic: LastTopic | undefined) => {
    setState(prev => {
      const next = { ...prev, lastTopic: topic };
      writeState(next);
      return next;
    });
  }, []);

  const setJournalDraft = useCallback((draft: JournalDraft | undefined) => {
    setState(prev => {
      const next = { ...prev, journalDraft: draft };
      writeState(next);
      return next;
    });
  }, []);

  const clearPart = useCallback((part: "lastExercise" | "lastTopic" | "journalDraft") => {
    setState(prev => {
      const next = { ...prev, [part]: undefined };
      writeState(next);
      return next;
    });
  }, []);

  const hasAnyContinuation = useMemo(() => {
    return !!(state.lastExercise && !state.lastExercise.completedAt) 
      || !!state.lastTopic 
      || !!(state.journalDraft?.hasContent);
  }, [state]);

  return {
    lastExercise: state.lastExercise,
    lastTopic: state.lastTopic,
    journalDraft: state.journalDraft,
    hasAnyContinuation,
    setLastExercise,
    setLastTopic,
    setJournalDraft,
    clearPart,
  };
}

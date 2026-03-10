import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, RotateCcw, Check, ChevronRight, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Exercise } from "@/data/exercises";
import { useTranslation } from "@/hooks/useTranslation";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useVoiceSettings } from "@/hooks/useVoiceSettings";
import { fullScreenOverlay } from "@/lib/safeArea";

interface ExercisePlayerProps {
  exercise: Exercise;
  onClose: () => void;
  onComplete: () => void;
}

export function ExercisePlayer({ exercise, onClose, onComplete }: ExercisePlayerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true); // Auto-start
  const [stepProgress, setStepProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isCurrentStepSpeaking, setIsCurrentStepSpeaking] = useState(false);
  const [isCurrentStepMinDurationMet, setIsCurrentStepMinDurationMet] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { t, language, getExerciseDisplay } = useTranslation();
  const { getVoiceId, speed } = useVoiceSettings();
  const exerciseVoiceSpeed = (exercise.category === "breathing" || exercise.category === "grounding") ? 0.9 as const : (Math.min(speed, 1.0) as 0.9 | 1.0);

  
  const { speak, stop, isSpeaking, isLoading } = useElevenLabsTTS({
    onStart: () => {
      setIsCurrentStepSpeaking(true);
    },
    onEnd: () => {
      setIsCurrentStepSpeaking(false);
    },
    onError: () => {
      // Silently degrade - exercise still works without voice
      setIsCurrentStepSpeaking(false);
    }
  });

  // Hide BottomNav while exercise player is open
  useEffect(() => {
    document.body.classList.add('exercise-player-open');
    return () => document.body.classList.remove('exercise-player-open');
  }, []);

  // Single source of truth for exercise display strings
  const display = getExerciseDisplay(exercise.id, {
    title: exercise.title,
    description: exercise.description,
    longDescription: exercise.longDescription,
    duration: exercise.duration,
    steps: exercise.steps,
    prompts: exercise.prompts,
  });

  const step = exercise.steps[currentStep];
  const totalSteps = exercise.steps.length;
  const overallProgress = ((currentStep + stepProgress / 100) / totalSteps) * 100;

  // Helper to get step instruction from display
  const getStepInstruction = (index: number) => display.steps[index] || exercise.steps[index]?.instruction || "";
  
  // Helper to get prompt from display
  const getPrompt = (index: number) => display.prompts[index % display.prompts.length] || "";

  // Get effective language for TTS
  const effectiveLang = (language === "de" ? "de" : "en") as "en" | "de";

  // Spoken overrides per exercise: no counting, just calm cues with enough silent time
  const speechOverrides: Record<string, { en: string[]; de: string[] }> = {
    "breathing-60": {
      en: [
        "Find a comfortable position, and gently close your eyes.",
        "Breathe in through your nose, slowly and deeply.",
        "And hold.",
        "Now breathe out through your mouth, slowly, all the way.",
        "Breathe in again, let the calm fill your body.",
        "And hold.",
        "Breathe out, releasing any tension.",
        "Breathe in, deep and slow.",
        "Hold.",
        "And let it all go.",
        "One last breath in.",
        "Hold.",
        "And release, completely.",
        "Gently open your eyes, and notice how you feel.",
      ],
      de: [
        "Finde eine bequeme Position und schließe sanft die Augen.",
        "Atme langsam und tief durch die Nase ein.",
        "Und halte.",
        "Atme jetzt langsam durch den Mund aus, ganz gleichmäßig.",
        "Atme wieder ein, lass die Ruhe deinen Körper füllen.",
        "Und halte.",
        "Atme aus, und lass jede Anspannung los.",
        "Atme ein, tief und langsam.",
        "Halte.",
        "Und lass alles los.",
        "Ein letztes Mal einatmen.",
        "Halte.",
        "Und loslassen, vollständig.",
        "Öffne langsam die Augen und spüre nach, wie du dich fühlst.",
      ],
    },
    "thought-reframing": {
      en: [
        "Think of a situation that's been on your mind lately.",
        "What thought comes up when you think about it?",
        "How does this thought make you feel? Notice the intensity.",
        "What evidence supports this thought? Take your time.",
        "Now consider, what evidence goes against it?",
        "Is there another way to look at this situation?",
        "What would you say to a close friend who had this same thought?",
        "Now try to form a more balanced thought about this situation.",
        "How do you feel now? Notice any shift.",
        "Even small changes matter. Well done.",
      ],
      de: [
        "Denke an eine Situation, die dich in letzter Zeit beschäftigt hat.",
        "Welcher Gedanke kommt dabei auf?",
        "Wie fühlt sich dieser Gedanke an? Achte auf die Intensität.",
        "Was spricht für diesen Gedanken? Nimm dir Zeit.",
        "Und was spricht dagegen?",
        "Gibt es eine andere Sichtweise auf diese Situation?",
        "Was würdest du einem guten Freund sagen, der diesen Gedanken hätte?",
        "Versuche jetzt, einen ausgewogeneren Gedanken zu formulieren.",
        "Wie fühlst du dich jetzt? Achte auf jede Veränderung.",
        "Auch kleine Veränderungen zählen. Gut gemacht.",
      ],
    },
    "journaling-prompts": {
      en: [
        "Find a quiet space, and something to write with.",
        "Take a few deep breaths to center yourself.",
        "Choose a prompt that speaks to you.",
        "Now write freely, without judging. Let the words come as they are.",
        "Read what you've written, with kindness.",
        "Notice any insights or patterns.",
        "Write down one thing you want to remember from this.",
      ],
      de: [
        "Finde einen ruhigen Ort und etwas zum Schreiben.",
        "Nimm ein paar tiefe Atemzüge, um bei dir anzukommen.",
        "Wähle eine Frage, die dich anspricht.",
        "Schreibe jetzt frei, ohne zu bewerten. Lass die Worte kommen, wie sie sind.",
        "Lies, was du geschrieben hast, mit Wohlwollen.",
        "Achte auf Erkenntnisse oder Muster.",
        "Schreibe eine Sache auf, die du dir merken möchtest.",
      ],
    },
    "values-clarification": {
      en: [
        "Think of a moment when you felt truly alive and fulfilled.",
        "What was happening? What values were you living?",
        "Now think of a time when you felt frustrated or out of balance.",
        "Which value might not have been honored?",
        "Look at the list and choose your top ten values.",
        "Now narrow it down to five.",
        "And finally, choose your three core values.",
        "For each one, think of a way to live it this week.",
        "How aligned does your life feel with these values right now?",
      ],
      de: [
        "Denke an einen Moment, in dem du dich wirklich lebendig und erfüllt gefühlt hast.",
        "Was war los? Welche Werte hast du dabei gelebt?",
        "Denke jetzt an eine Situation, in der du frustriert oder aus der Balance warst.",
        "Welcher Wert könnte dabei zu kurz gekommen sein?",
        "Schau dir die Liste an und wähle deine zehn wichtigsten Werte.",
        "Reduziere sie jetzt auf fünf.",
        "Und zum Schluss, wähle deine drei Kernwerte.",
        "Überlege für jeden einzelnen, wie du ihn diese Woche leben kannst.",
        "Wie sehr stimmt dein Leben gerade mit diesen Werten überein?",
      ],
    },
    "boundary-prep": {
      en: [
        "Think of a situation where you need to set a boundary.",
        "What exactly is happening that doesn't feel right?",
        "How does this affect you? Emotionally, physically, or in your daily life?",
        "What do you need instead?",
        "Try this: When this happens, I feel this way, and I need this.",
        "Say it out loud, calmly and clearly.",
        "Think about how the other person might respond. How will you stay firm?",
        "Remember, setting boundaries is an act of self-respect.",
        "Now picture the conversation going well.",
        "Notice how it feels to stand up for yourself.",
      ],
      de: [
        "Denke an eine Situation, in der du eine Grenze setzen möchtest.",
        "Was genau passiert, das sich nicht richtig anfühlt?",
        "Wie wirkt sich das auf dich aus? Emotional, körperlich oder im Alltag?",
        "Was brauchst du stattdessen?",
        "Probiere es so: Wenn das passiert, fühle ich mich so, und ich brauche das.",
        "Sprich es laut aus, ruhig und klar.",
        "Überlege, wie dein Gegenüber reagieren könnte. Wie bleibst du bei dir?",
        "Erinnere dich, Grenzen setzen ist ein Zeichen von Selbstachtung.",
        "Stell dir jetzt vor, wie das Gespräch gut verläuft.",
        "Spüre, wie es sich anfühlt, für dich selbst einzustehen.",
      ],
    },
    "grounding-54321": {
      en: [
        "Begin with a slow, deep breath.",
        "Look around you. Name five things you can see.",
        "Take your time, notice colors, shapes, and details.",
        "Now notice four things you can touch or feel.",
        "Explore the textures, the temperatures, the sensations.",
        "Listen carefully. Find three sounds around you.",
        "Let the sounds come to you, near and far.",
        "Notice two things you can smell.",
        "And finally, one thing you can taste.",
        "Take one more deep breath.",
        "You are here, in this moment, grounded and present.",
      ],
      de: [
        "Beginne mit einem langsamen, tiefen Atemzug.",
        "Schau dich um. Benenne fünf Dinge, die du sehen kannst.",
        "Nimm dir Zeit, achte auf Farben, Formen und Details.",
        "Bemerke jetzt vier Dinge, die du berühren oder spüren kannst.",
        "Erkunde die Oberflächen, die Temperaturen, die Empfindungen.",
        "Lausche aufmerksam. Finde drei Geräusche um dich herum.",
        "Lass die Klänge zu dir kommen, nah und fern.",
        "Nimm zwei Dinge wahr, die du riechen kannst.",
        "Und zum Schluss, eine Sache, die du schmecken kannst.",
        "Nimm noch einen tiefen Atemzug.",
        "Du bist hier, in diesem Moment, geerdet und gegenwärtig.",
      ],
    },
  };

  const getStepSpeechText = (index: number) => {
    const override = speechOverrides[exercise.id]?.[effectiveLang]?.[index];
    if (override) return override;

    // Generic fallback: spell out digits as words
    const instruction = getStepInstruction(index).trim();
    return instruction
      .replace(/\b10\b/g, effectiveLang === "de" ? "zehn" : "ten")
      .replace(/\b9\b/g, effectiveLang === "de" ? "neun" : "nine")
      .replace(/\b8\b/g, effectiveLang === "de" ? "acht" : "eight")
      .replace(/\b7\b/g, effectiveLang === "de" ? "sieben" : "seven")
      .replace(/\b6\b/g, effectiveLang === "de" ? "sechs" : "six")
      .replace(/\b5\b/g, effectiveLang === "de" ? "fünf" : "five")
      .replace(/\b4\b/g, effectiveLang === "de" ? "vier" : "four")
      .replace(/\b3\b/g, effectiveLang === "de" ? "drei" : "three")
      .replace(/\b2\b/g, effectiveLang === "de" ? "zwei" : "two")
      .replace(/\b1\b/g, effectiveLang === "de" ? "eins" : "one");
  };

  // Speak current step when it changes (only ElevenLabs, no browser TTS)
  useEffect(() => {
    clearAdvanceTimeout();
    setIsCurrentStepMinDurationMet(false);
    setIsCurrentStepSpeaking(false);
    setIsTransitioning(false);

    if (!voiceEnabled || !language || isComplete) return;

    const instruction = getStepSpeechText(currentStep).trim();
    if (!instruction) return;

    const voiceId = getVoiceId(effectiveLang);
    speak(instruction, voiceId, effectiveLang, exerciseVoiceSpeed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, voiceEnabled, language, isComplete]);

  const advanceTimeoutRef = useRef<number | null>(null);
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;
  const totalStepsRef = useRef(totalSteps);
  totalStepsRef.current = totalSteps;

  const clearAdvanceTimeout = useCallback(() => {
    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  const completeExercise = useCallback(() => {
    clearAdvanceTimeout();
    stop();
    setIsCurrentStepSpeaking(false);
    setIsCurrentStepMinDurationMet(false);
    setIsTransitioning(false);
    setIsComplete(true);
    setIsPlaying(false);
  }, [clearAdvanceTimeout, stop]);

  const queueAdvance = useCallback((delay = 900) => {
    clearAdvanceTimeout();
    setIsTransitioning(true);

    advanceTimeoutRef.current = window.setTimeout(() => {
      if (currentStepRef.current >= totalStepsRef.current - 1) {
        completeExercise();
        return;
      }

      setCurrentStep((prev) => prev + 1);
      setStepProgress(0);
      setIsCurrentStepMinDurationMet(false);
      setIsCurrentStepSpeaking(false);
      setIsTransitioning(false);
    }, delay);
  }, [clearAdvanceTimeout, completeExercise]);

  useEffect(() => {
    return () => {
      clearAdvanceTimeout();
    };
  }, [clearAdvanceTimeout]);

  // Handle next step
  const handleNextStep = () => {
    stop();
    setIsCurrentStepSpeaking(false);
    setIsCurrentStepMinDurationMet(false);

    if (currentStep >= totalSteps - 1) {
      completeExercise();
      return;
    }

    queueAdvance(450);
  };

  // Auto-progress after minimum duration; actual step change happens only once via queueAdvance
  useEffect(() => {
    if (!isPlaying || isComplete || !step) return;

    const stepDuration = step.duration || 10;
    const interval = setInterval(() => {
      setStepProgress((prev) => {
        if (prev >= 100) return 100;

        const increment = 100 / (stepDuration * 10);
        const nextProgress = Math.min(prev + increment, 100);

        if (nextProgress >= 100 && prev < 100) {
          setIsCurrentStepMinDurationMet(true);
        }

        return nextProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, step, isComplete]);

  useEffect(() => {
    if (!isPlaying || isComplete || isTransitioning || !isCurrentStepMinDurationMet) return;
    if (voiceEnabled && (isCurrentStepSpeaking || isLoading)) return;

    queueAdvance(900);
  }, [
    isCurrentStepMinDurationMet,
    isCurrentStepSpeaking,
    isLoading,
    isPlaying,
    isComplete,
    isTransitioning,
    voiceEnabled,
    queueAdvance,
  ]);

  const handleRestart = () => {
    clearAdvanceTimeout();
    stop();
    setCurrentStep(0);
    setStepProgress(0);
    setIsCurrentStepMinDurationMet(false);
    setIsCurrentStepSpeaking(false);
    setIsTransitioning(false);
    setIsComplete(false);
    setIsPlaying(true);
  };

  const handleFinish = () => {
    stop();
    onComplete();
    onClose();
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      stop();
    } else {
      const instruction = getStepSpeechText(currentStep);
      const voiceId = getVoiceId(effectiveLang);
      speak(instruction, voiceId, effectiveLang, exerciseVoiceSpeed);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  // Completion screen
  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-background z-[200] flex flex-col" style={fullScreenOverlay()}>
        <div className="flex items-center justify-between p-3 border-b border-border">
          <button type="button" onClick={handleClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        <span className="text-sm text-muted-foreground">{display.title}</span>
        <div className="w-10" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex-1 flex flex-col items-center justify-center p-6"
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("common.wellDone")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("toolbox.completedExercise")}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="px-6 py-3 rounded-xl border border-border hover:bg-muted flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {t("common.again")}
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t("common.finish")}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Exercise screen
  return (
    <div className="fixed inset-0 bg-background z-[200] flex flex-col" style={fullScreenOverlay()}>
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border">
        {/* Close button - 44px tap target */}
        <button 
          type="button" 
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }} 
          className="flex items-center justify-center w-11 h-11 hover:bg-muted rounded-xl shrink-0 transition-colors"
          aria-label="Close exercise"
        >
          <X className="w-5 h-5" />
        </button>
        
        <span className="text-sm text-muted-foreground truncate px-2">{display.title}</span>
        
        {/* Voice toggle - 44px tap target */}
        <button 
          type="button" 
          onClick={(e) => {
            e.stopPropagation();
            toggleVoice();
          }} 
          className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-colors ${voiceEnabled ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
          aria-label={voiceEnabled ? "Disable voice" : "Enable voice"}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-700 ease-in-out"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-md mx-auto text-center">
          {/* Speaking/Loading indicator */}
          <AnimatePresence>
            {voiceEnabled && (isSpeaking || isLoading) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-center gap-2 mb-4 text-primary"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
                <span className="text-sm">{isLoading ? (language === "de" ? "Einen Moment..." : "One moment...") : t("voice.speaking")}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Breathing circle */}
          {exercise.category === 'breathing' && (
            <motion.div
              animate={{ scale: isPlaying ? [1, 1.15, 1] : 1 }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: isPlaying ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="w-12 h-12 rounded-full bg-primary/40"
              />
            </motion.div>
          )}

          {/* Step counter */}
          <p className="text-sm text-muted-foreground mb-2">
            {t("common.step")} {currentStep + 1} {t("common.of")} {totalSteps}
          </p>

          {/* Instruction — smooth crossfade */}
          <div className="relative min-h-[4rem]">
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentStep}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="text-lg font-medium text-foreground leading-relaxed mb-4"
              >
                {getStepInstruction(currentStep)}
              </motion.h2>
            </AnimatePresence>
          </div>

          {/* Step progress */}
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-48 mx-auto mb-4"
              >
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary/50 rounded-full transition-all duration-300 ease-linear"
                    style={{ width: `${stepProgress}%` }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prompts */}
          {exercise.prompts && exercise.prompts.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`prompt-${currentStep}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-6 p-4 bg-muted/50 rounded-xl text-left"
              >
                <p className="text-xs text-muted-foreground mb-1">{t("common.helpfulPrompts")}:</p>
                <p className="text-sm text-foreground italic">
                  {getPrompt(currentStep)}
                </p>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* FIXED BOTTOM CONTROLS */}
      <div className="border-t border-border bg-background p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
        <p className="text-xs text-muted-foreground text-center mb-3">
          {voiceEnabled ? t("toolbox.autoProgress") : t("toolbox.autoProgress")}
        </p>
        
        <div className="flex justify-center gap-4">
          {/* Start/Pause */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex-1 max-w-40 h-14 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 font-medium text-base"
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5" />
                {t("common.pause")}
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {currentStep === 0 ? t("common.start") : t("common.resume")}
              </>
            )}
          </button>
          
          {/* NEXT BUTTON - Big and obvious */}
          <button
            type="button"
            onClick={handleNextStep}
            className="flex-1 max-w-40 h-14 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 font-medium text-base"
          >
            {t("common.next")}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

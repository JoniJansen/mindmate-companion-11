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
  const exerciseVoiceSpeed = exercise.category === "breathing" ? 0.9 : speed;

  
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
        "Find a comfortable position... and when you're ready... gently close your eyes.",
        "Now breathe in slowly through your nose... nice and deep... take all the time you need.",
        "And hold... softly.",
        "Now let the air flow out through your mouth... slowly... gently... all the way out.",
        "Breathe in again... feel the calm entering your body... let it fill you completely.",
        "Hold... just for a moment.",
        "And exhale... let the tension leave with the breath... nice and easy.",
        "Once more... breathe in... deep... and slow.",
        "Hold... gently.",
        "And exhale completely... letting everything go.",
        "One last deep breath in... savour it.",
        "Hold... just a moment longer.",
        "And release... letting go completely.",
        "Gently open your eyes... and notice how you feel.",
      ],
      de: [
        "Finde eine bequeme Position... und wenn du soweit bist... schließe sanft die Augen.",
        "Atme jetzt langsam durch die Nase ein... schön tief... nimm dir alle Zeit, die du brauchst.",
        "Und halte... ganz sanft.",
        "Lass die Luft jetzt langsam durch den Mund ausströmen... ruhig... gleichmäßig... bis ganz zum Ende.",
        "Atme wieder ein... spüre, wie die Ruhe in deinen Körper fließt... lass sie dich ganz ausfüllen.",
        "Halte... nur einen Moment.",
        "Und atme aus... lass die Anspannung mit dem Atem gehen... ganz leicht.",
        "Noch einmal... atme ein... tief... und langsam.",
        "Halte... sanft.",
        "Und atme vollständig aus... lass alles los.",
        "Ein letztes Mal tief einatmen... genieße es.",
        "Halte... noch einen kleinen Moment.",
        "Und loslassen... ganz loslassen.",
        "Öffne langsam die Augen... und spüre nach, wie du dich jetzt fühlst.",
      ],
    },
    "thought-reframing": {
      en: [
        "Think of a situation that's been on your mind lately.",
        "What thought comes up when you think about this situation?",
        "How does this thought make you feel? Notice the intensity.",
        "What evidence supports this thought? Take your time.",
        "Now consider: what evidence goes against this thought?",
        "Is there another way to look at this situation?",
        "What would you tell a close friend who had this same thought?",
        "Try to create a more balanced thought about this situation.",
        "How do you feel now? Notice any shift.",
        "Even small changes matter. Well done.",
      ],
      de: [
        "Denke an eine Situation, die dich in letzter Zeit beschäftigt hat.",
        "Welcher Gedanke kommt auf, wenn du an diese Situation denkst?",
        "Wie fühlt sich dieser Gedanke an? Achte auf die Intensität.",
        "Welche Hinweise sprechen für diesen Gedanken? Nimm dir Zeit.",
        "Und jetzt: was spricht gegen diesen Gedanken?",
        "Gibt es eine andere Sichtweise auf diese Situation?",
        "Was würdest du einem guten Freund sagen, der diesen Gedanken hätte?",
        "Versuche, einen ausgewogeneren Gedanken zu formulieren.",
        "Wie fühlst du dich jetzt? Achte auf jede Veränderung.",
        "Auch kleine Veränderungen zählen. Gut gemacht.",
      ],
    },
    "journaling-prompts": {
      en: [
        "Find a quiet space, and something to write with.",
        "Take a few deep breaths to center yourself.",
        "Choose a prompt that resonates with you.",
        "Now write freely, without editing or judging. Let the words flow.",
        "Read what you've written, with compassion.",
        "Underline any insights or patterns you notice.",
        "Write one thing you want to remember from this.",
      ],
      de: [
        "Finde einen ruhigen Ort und etwas zum Schreiben.",
        "Nimm ein paar tiefe Atemzüge, um dich zu zentrieren.",
        "Wähle eine Frage, die dich anspricht.",
        "Schreibe jetzt frei, ohne zu bewerten oder zu korrigieren. Lass die Worte fließen.",
        "Lies, was du geschrieben hast. Mit Mitgefühl.",
        "Unterstreiche Erkenntnisse oder Muster, die dir auffallen.",
        "Schreibe eine Sache auf, die du dir von heute merken möchtest.",
      ],
    },
    "values-clarification": {
      en: [
        "Think of a time when you felt truly alive and fulfilled.",
        "What was happening? What values were you honoring?",
        "Now think of a time when you felt frustrated or off-track.",
        "What value might have been compromised?",
        "From the list below, choose your top ten values.",
        "Now narrow it down to your top five.",
        "Finally, identify your top three core values.",
        "For each value, think of one way you can honor it this week.",
        "Reflect: how aligned is your life with these values?",
      ],
      de: [
        "Denke an einen Moment, in dem du dich wirklich lebendig und erfüllt gefühlt hast.",
        "Was war los? Welche Werte hast du dabei gelebt?",
        "Denke jetzt an eine Situation, in der du frustriert oder nicht im Einklang warst.",
        "Welcher Wert könnte dabei zu kurz gekommen sein?",
        "Wähle aus der Liste unten deine zehn wichtigsten Werte.",
        "Reduziere sie jetzt auf deine fünf wichtigsten.",
        "Und zum Schluss: bestimme deine drei Kernwerte.",
        "Überlege dir für jeden Wert eine Möglichkeit, ihn diese Woche zu leben.",
        "Reflektiere: wie sehr stimmt dein Leben mit diesen Werten überein?",
      ],
    },
    "boundary-prep": {
      en: [
        "Think of a situation where you need to set a boundary.",
        "What specifically is happening that doesn't feel okay?",
        "How does this situation affect you? Emotionally, physically, or practically?",
        "What do you need instead?",
        "Try this format: When this happens, I feel this way, and I need this.",
        "Practice saying it out loud, calmly and clearly.",
        "Anticipate possible responses. How will you stay firm?",
        "Remind yourself: setting boundaries is an act of self-respect.",
        "Visualize the conversation going well.",
        "Notice how it feels to advocate for yourself.",
      ],
      de: [
        "Denke an eine Situation, in der du eine Grenze setzen musst.",
        "Was genau passiert, das sich nicht richtig anfühlt?",
        "Wie wirkt sich diese Situation auf dich aus? Emotional, körperlich oder praktisch?",
        "Was brauchst du stattdessen?",
        "Probiere dieses Format: Wenn das passiert, fühle ich mich so, und ich brauche das.",
        "Übe es laut auszusprechen. Ruhig und klar.",
        "Überlege, welche Reaktionen kommen könnten. Wie bleibst du standhaft?",
        "Erinnere dich: Grenzen setzen ist ein Zeichen von Selbstachtung.",
        "Stell dir vor, wie das Gespräch gut verläuft.",
        "Spüre, wie es sich anfühlt, für dich selbst einzustehen.",
      ],
    },
    "grounding-54321": {
      en: [
        "Take a slow, deep breath.",
        "Look around and name five things you can see.",
        "Take your time noticing colors, shapes, and textures.",
        "Now notice four things you can touch.",
        "Feel the textures, temperatures, and sensations.",
        "Listen for three things you can hear.",
        "Notice sounds near and far.",
        "Notice two things you can smell.",
        "And one thing you can taste.",
        "Take another deep breath.",
        "Notice how you feel now, grounded in this moment.",
      ],
      de: [
        "Nimm einen langsamen, tiefen Atemzug.",
        "Schau dich um und benenne fünf Dinge, die du sehen kannst.",
        "Nimm dir Zeit, Farben, Formen und Texturen wahrzunehmen.",
        "Bemerke jetzt vier Dinge, die du berühren kannst.",
        "Spüre die Oberflächen, Temperaturen und Empfindungen.",
        "Lausche auf drei Dinge, die du hören kannst.",
        "Achte auf Geräusche nah und fern.",
        "Nimm zwei Dinge wahr, die du riechen kannst.",
        "Und eine Sache, die du schmecken kannst.",
        "Nimm noch einen tiefen Atemzug.",
        "Spüre, wie du dich jetzt fühlst. Geerdet in diesem Moment.",
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

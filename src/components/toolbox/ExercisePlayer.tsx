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
  // All guided exercises use slow, calming pace for eyes-closed experience
  const exerciseVoiceSpeed = 0.9 as const;

  
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

  // Professional voice scripts – natural, flowing, therapist-quality guidance for eyes-closed use
  const speechOverrides: Record<string, { en: string[]; de: string[] }> = {
    "breathing-60": {
      en: [
        "Find a comfortable position. Let your shoulders drop, and gently close your eyes.",
        "Now breathe in through your nose, slowly and deeply. Let your belly expand.",
        "Hold the breath gently. There's no rush.",
        "And slowly breathe out through your mouth. Let everything soften.",
        "Breathe in again. With each breath, you're inviting calm into your body.",
        "Hold softly. You're doing great.",
        "And release. Let any tension melt away with the exhale.",
        "Breathe in once more. Deep, slow, nourishing.",
        "Hold gently.",
        "And let it all go. Your body knows how to relax.",
        "One last, beautiful breath in.",
        "Hold it for a moment.",
        "And release completely. Let everything settle.",
        "When you're ready, gently open your eyes. Take a moment to notice how you feel.",
      ],
      de: [
        "Finde eine bequeme Position. Lass deine Schultern sinken und schließe sanft die Augen.",
        "Atme jetzt langsam und tief durch die Nase ein. Lass deinen Bauch sich weiten.",
        "Halte den Atem sanft. Es gibt kein Eilen.",
        "Und atme langsam durch den Mund aus. Lass alles weich werden.",
        "Atme wieder ein. Mit jedem Atemzug lädst du Ruhe in deinen Körper ein.",
        "Halte sanft. Du machst das wunderbar.",
        "Und loslassen. Lass jede Anspannung mit dem Ausatmen schmelzen.",
        "Atme noch einmal ein. Tief, langsam, nährend.",
        "Halte sanft.",
        "Und lass alles los. Dein Körper weiß, wie er sich entspannen kann.",
        "Ein letzter, wunderbarer Atemzug.",
        "Halte ihn einen Moment.",
        "Und loslassen, vollständig. Lass alles zur Ruhe kommen.",
        "Wenn du bereit bist, öffne langsam die Augen. Nimm dir einen Moment, um nachzuspüren.",
      ],
    },
    "thought-reframing": {
      en: [
        "Let's take a moment together. Think of a situation that's been weighing on you recently. There's no pressure, just let it come to mind.",
        "Now notice the thought that appears. What is your mind telling you about this situation? Just observe it, without judgment.",
        "How does this thought make you feel? Notice where you feel it in your body. Is it heavy, tight, restless? Just notice.",
        "Now let's look at this thought more closely. What evidence do you have that supports it? Take your time with this.",
        "And now, gently consider the other side. What evidence might go against this thought? What might you be overlooking?",
        "Is there another way to see this situation? Perhaps from a wider perspective, or through the eyes of someone who cares about you.",
        "Imagine a close friend came to you with this exact thought. What would you say to them? How would you respond with compassion?",
        "Now try to form a new thought. One that's more balanced, more fair to yourself. It doesn't have to be positive, just more accurate.",
        "How do you feel now? Has anything shifted, even slightly? Any change, no matter how small, is meaningful.",
        "You've just practiced a powerful skill. Even small shifts in perspective create real change over time. Well done.",
      ],
      de: [
        "Lass uns einen Moment gemeinsam innehalten. Denke an eine Situation, die dich in letzter Zeit beschäftigt hat. Kein Druck, lass sie einfach aufkommen.",
        "Bemerke jetzt den Gedanken, der erscheint. Was sagt dir dein Kopf über diese Situation? Beobachte ihn einfach, ohne zu urteilen.",
        "Wie fühlt sich dieser Gedanke an? Achte darauf, wo du ihn im Körper spürst. Ist er schwer, eng, unruhig? Beobachte einfach nur.",
        "Schauen wir uns diesen Gedanken genauer an. Welche Hinweise gibt es, die ihn stützen? Nimm dir dafür Zeit.",
        "Und jetzt betrachte behutsam die andere Seite. Was spricht vielleicht gegen diesen Gedanken? Was könntest du übersehen?",
        "Gibt es eine andere Sichtweise auf diese Situation? Vielleicht aus einer weiteren Perspektive, oder durch die Augen von jemandem, der dich mag.",
        "Stell dir vor, ein guter Freund käme mit genau diesem Gedanken zu dir. Was würdest du sagen? Wie würdest du mitfühlend antworten?",
        "Versuche jetzt, einen neuen Gedanken zu formen. Einen, der ausgewogener ist, fairer dir selbst gegenüber. Er muss nicht positiv sein, nur genauer.",
        "Wie fühlst du dich jetzt? Hat sich etwas verändert, auch nur ein wenig? Jede Veränderung, egal wie klein, ist bedeutsam.",
        "Du hast gerade eine kraftvolle Fähigkeit geübt. Auch kleine Perspektivwechsel bewirken mit der Zeit echte Veränderung. Gut gemacht.",
      ],
    },
    "journaling-prompts": {
      en: [
        "Find a quiet, comfortable place. Have a pen and paper ready, or open a note on your phone. This time is just for you.",
        "Before we begin, take a few slow breaths. Let your shoulders relax. Arrive in this moment.",
        "Now look at the prompt below and choose one that draws you in. There's no right or wrong choice.",
        "Start writing. Don't edit, don't overthink. Let the words flow exactly as they come. Your only job is to be honest with yourself.",
        "Pause now and read what you've written. Read it as if a dear friend wrote these words. With kindness and without judgment.",
        "Do you notice any patterns? Any surprises? Underline anything that feels important or true.",
        "To close, write down one insight, one thing you want to carry with you from this moment.",
      ],
      de: [
        "Finde einen ruhigen, gemütlichen Ort. Halte Stift und Papier bereit, oder öffne eine Notiz auf deinem Handy. Diese Zeit gehört nur dir.",
        "Bevor wir beginnen, nimm ein paar langsame Atemzüge. Lass deine Schultern sinken. Komm in diesem Moment an.",
        "Schau dir jetzt die Frage unten an und wähle eine, die dich anspricht. Es gibt kein Richtig oder Falsch.",
        "Fang an zu schreiben. Nicht korrigieren, nicht nachdenken. Lass die Worte fließen, genau so, wie sie kommen. Deine einzige Aufgabe ist, ehrlich mit dir zu sein.",
        "Halte jetzt inne und lies, was du geschrieben hast. Lies es so, als hätte ein guter Freund diese Worte geschrieben. Mit Güte und ohne Bewertung.",
        "Fallen dir Muster auf? Überraschungen? Unterstreiche alles, was sich wichtig oder wahr anfühlt.",
        "Zum Abschluss schreibe eine Erkenntnis auf, etwas, das du aus diesem Moment mitnehmen möchtest.",
      ],
    },
    "values-clarification": {
      en: [
        "Close your eyes and think back to a time when you felt truly alive. A moment where everything felt right. Let it come to you naturally.",
        "What was happening in that moment? What mattered to you? What values were you honoring, perhaps without even knowing it?",
        "Now think of a different time. A time when you felt frustrated, empty, or out of alignment. Let that memory surface gently.",
        "What was missing? Which of your values might have been compromised or ignored?",
        "Look at the values listed below. Take your time and choose the ten that resonate most deeply with you.",
        "Now comes the harder part. Narrow those ten down to your five most essential values.",
        "And finally, choose just three. These are your core values. The ones that define who you truly are.",
        "For each of your three core values, think of one specific action you can take this week to honor it. Something small and doable.",
        "Take a moment to reflect. How aligned does your current life feel with these values? What might you want to adjust?",
      ],
      de: [
        "Schließe die Augen und denke an einen Moment zurück, in dem du dich wirklich lebendig gefühlt hast. Ein Moment, in dem alles stimmte. Lass ihn von selbst kommen.",
        "Was war in diesem Moment los? Was war dir wichtig? Welche Werte hast du gelebt, vielleicht ohne es zu wissen?",
        "Denke jetzt an eine andere Zeit. Eine Zeit, in der du frustriert, leer oder nicht im Einklang warst. Lass diese Erinnerung behutsam auftauchen.",
        "Was hat gefehlt? Welcher deiner Werte könnte übergangen oder vernachlässigt worden sein?",
        "Schau dir die Werte unten an. Nimm dir Zeit und wähle die zehn, die am tiefsten in dir anklingen.",
        "Jetzt kommt der schwierigere Teil. Reduziere diese zehn auf deine fünf wichtigsten Werte.",
        "Und zum Schluss, wähle nur drei. Das sind deine Kernwerte. Die, die ausmachen, wer du wirklich bist.",
        "Überlege für jeden deiner drei Kernwerte eine konkrete Handlung, die du diese Woche umsetzen kannst. Etwas Kleines und Machbares.",
        "Nimm dir einen Moment zum Nachspüren. Wie sehr stimmt dein jetziges Leben mit diesen Werten überein? Was möchtest du vielleicht verändern?",
      ],
    },
    "boundary-prep": {
      en: [
        "Think of a situation in your life where you feel a boundary is needed. A place where something doesn't sit right with you. Let it come to mind.",
        "What exactly is happening in this situation that feels uncomfortable or wrong? Be specific with yourself.",
        "How is this affecting you? Notice the emotional weight, any physical tension, or how it spills into other areas of your life.",
        "Now ask yourself: What do I actually need here? What would feel right and respectful to me?",
        "Let's practice putting it into words. Try this structure: When this happens, I feel this way, and what I need is this. Take a moment to form your sentence.",
        "Now say it out loud. Hear your own voice speak this truth. Calmly, clearly, with conviction.",
        "Think about how the other person might respond. Whatever their reaction, how will you stay centered and hold your ground?",
        "Remind yourself of something important: Setting boundaries is not selfish. It is one of the deepest acts of self-respect.",
        "Now close your eyes and visualize this conversation going well. See yourself calm, clear, and heard.",
        "Notice how it feels in your body to stand up for yourself. That feeling is worth honoring.",
      ],
      de: [
        "Denke an eine Situation in deinem Leben, in der du eine Grenze brauchst. Einen Ort, an dem sich etwas nicht richtig anfühlt. Lass sie aufkommen.",
        "Was genau passiert in dieser Situation, das sich unangenehm oder falsch anfühlt? Sei ehrlich mit dir selbst.",
        "Wie wirkt sich das auf dich aus? Achte auf das emotionale Gewicht, körperliche Anspannung oder wie es in andere Bereiche deines Lebens hineinwirkt.",
        "Frage dich jetzt: Was brauche ich hier eigentlich? Was würde sich richtig und respektvoll für mich anfühlen?",
        "Lass uns üben, es in Worte zu fassen. Probiere diese Struktur: Wenn das passiert, fühle ich mich so, und was ich brauche, ist das. Nimm dir einen Moment, deinen Satz zu formulieren.",
        "Sprich ihn jetzt laut aus. Höre deine eigene Stimme diese Wahrheit sprechen. Ruhig, klar, mit Überzeugung.",
        "Überlege, wie dein Gegenüber reagieren könnte. Egal wie die Reaktion ausfällt, wie bleibst du bei dir und hältst deine Position?",
        "Erinnere dich an etwas Wichtiges: Grenzen setzen ist nicht egoistisch. Es ist einer der tiefsten Akte der Selbstachtung.",
        "Schließe jetzt die Augen und stelle dir vor, wie dieses Gespräch gut verläuft. Sieh dich selbst ruhig, klar und gehört.",
        "Spüre, wie es sich in deinem Körper anfühlt, für dich selbst einzustehen. Dieses Gefühl verdient es, gewürdigt zu werden.",
      ],
    },
    "grounding-54321": {
      en: [
        "Let's begin. Take a slow, deep breath in. And let it out gently. You are safe in this moment.",
        "Now open your eyes softly and look around you. Name five things you can see. Take your time with each one.",
        "Really look at them. Notice the colors, the shapes, the light falling on each surface. Let your eyes rest on the details.",
        "Now bring your attention to touch. Find four things you can feel right now. The fabric on your skin, the ground beneath you, the air on your hands.",
        "Explore each sensation slowly. Is it warm or cool? Smooth or textured? Heavy or light? Just notice.",
        "Now shift to hearing. Listen carefully and find three distinct sounds around you. Perhaps some are close, others far away.",
        "Let the sounds come to you. You don't need to search for them. Just receive them, one by one.",
        "Bring your awareness to smell. Can you notice two scents around you? They might be subtle.",
        "And finally, notice one thing you can taste. Perhaps the air, or something lingering from a recent drink.",
        "Take one more slow, deep breath. Feel the air filling your lungs.",
        "You are here. In this moment. Grounded, present, and safe. Well done.",
      ],
      de: [
        "Lass uns beginnen. Nimm einen langsamen, tiefen Atemzug. Und lass ihn sanft wieder los. Du bist sicher in diesem Moment.",
        "Öffne jetzt sanft die Augen und schau dich um. Benenne fünf Dinge, die du sehen kannst. Nimm dir für jedes einzelne Zeit.",
        "Schau sie wirklich an. Achte auf die Farben, die Formen, das Licht auf jeder Oberfläche. Lass deinen Blick bei den Details verweilen.",
        "Bringe jetzt deine Aufmerksamkeit zum Tastsinn. Finde vier Dinge, die du gerade spüren kannst. Den Stoff auf deiner Haut, den Boden unter dir, die Luft an deinen Händen.",
        "Erkunde jede Empfindung langsam. Ist sie warm oder kühl? Glatt oder rau? Schwer oder leicht? Beobachte einfach nur.",
        "Wechsle jetzt zum Hören. Lausche aufmerksam und finde drei verschiedene Geräusche um dich herum. Manche sind vielleicht nah, andere weit weg.",
        "Lass die Klänge zu dir kommen. Du musst nicht nach ihnen suchen. Empfange sie einfach, einen nach dem anderen.",
        "Richte deine Aufmerksamkeit auf den Geruchssinn. Kannst du zwei Düfte um dich herum wahrnehmen? Sie können ganz subtil sein.",
        "Und zum Schluss, bemerke eine Sache, die du schmecken kannst. Vielleicht die Luft, oder ein Nachgeschmack von einem Getränk.",
        "Nimm noch einen langsamen, tiefen Atemzug. Spüre, wie die Luft deine Lungen füllt.",
        "Du bist hier. In diesem Moment. Geerdet, gegenwärtig und sicher. Gut gemacht.",
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

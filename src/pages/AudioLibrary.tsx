import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Moon, Lock, ArrowLeft, Timer, Volume2, Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { usePremium } from "@/hooks/usePremium";
import { useNavigate } from "react-router-dom";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useToast } from "@/hooks/use-toast";

interface AudioSession {
  id: string;
  titleEn: string;
  titleDe: string;
  descEn: string;
  descDe: string;
  duration: string;
  category: "sleep" | "stress" | "selfworth" | "calm";
  emoji: string;
  script: { en: string; de: string };
}

const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah — gentle female

const audioSessions: AudioSession[] = [
  {
    id: "sleep-wind-down",
    titleEn: "Wind Down for Sleep",
    titleDe: "Zur Ruhe kommen",
    descEn: "A gentle guided relaxation to help you drift off",
    descDe: "Eine sanfte Entspannung zum Einschlafen",
    duration: "8 min",
    category: "sleep",
    emoji: "🌙",
    script: {
      en: "Close your eyes and take a slow, deep breath. Let your body sink into whatever surface supports you. There's nowhere you need to be right now. Just here, in this quiet moment. Feel your shoulders drop, your jaw soften. With each exhale, let go a little more. You are safe. You are enough. Let the day drift away like clouds passing overhead.",
      de: "Schließe deine Augen und nimm einen langsamen, tiefen Atemzug. Lass deinen Körper in die Unterlage sinken. Du musst jetzt nirgendwo sein. Nur hier, in diesem ruhigen Moment. Spüre, wie deine Schultern sich senken, dein Kiefer sich entspannt. Mit jedem Ausatmen lässt du ein wenig mehr los. Du bist sicher. Du bist genug. Lass den Tag vorbeiziehen wie Wolken am Himmel.",
    },
  },
  {
    id: "stress-release",
    titleEn: "Release Tension",
    titleDe: "Anspannung loslassen",
    descEn: "Let go of what weighs on you",
    descDe: "Lass los, was dich belastet",
    duration: "5 min",
    category: "stress",
    emoji: "🧘",
    script: {
      en: "Take a moment to pause. Notice where tension lives in your body right now. Perhaps your shoulders, your chest, your stomach. Breathe into that space. Imagine warmth flowing there, softening, releasing. You don't have to solve anything right now. Just breathe. Just be. Each breath is a small act of kindness toward yourself.",
      de: "Nimm dir einen Moment zum Innehalten. Bemerke, wo Anspannung gerade in deinem Körper lebt. Vielleicht in deinen Schultern, deiner Brust, deinem Bauch. Atme in diesen Raum hinein. Stelle dir vor, wie Wärme dorthin fließt, weich macht, löst. Du musst jetzt nichts lösen. Atme einfach. Sei einfach. Jeder Atemzug ist ein kleiner Akt der Freundlichkeit dir selbst gegenüber.",
    },
  },
  {
    id: "selfworth-affirmation",
    titleEn: "You Are Enough",
    titleDe: "Du bist genug",
    descEn: "A gentle reminder of your worth",
    descDe: "Eine sanfte Erinnerung an deinen Wert",
    duration: "5 min",
    category: "selfworth",
    emoji: "🌱",
    script: {
      en: "I want you to hear something. You are not broken. You are not too much or too little. You are a human being, learning and growing every day. The fact that you're here, taking this time — that already speaks to your strength. You deserve kindness, especially from yourself. Repeat silently: I am worthy of love and peace.",
      de: "Ich möchte, dass du etwas hörst. Du bist nicht zerbrochen. Du bist nicht zu viel oder zu wenig. Du bist ein Mensch, der jeden Tag lernt und wächst. Die Tatsache, dass du hier bist und dir diese Zeit nimmst — das spricht bereits für deine Stärke. Du verdienst Freundlichkeit, besonders von dir selbst. Wiederhole leise: Ich bin der Liebe und des Friedens würdig.",
    },
  },
  {
    id: "thought-spiral-stop",
    titleEn: "Quiet the Spiral",
    titleDe: "Die Gedankenspirale stoppen",
    descEn: "Step out of racing thoughts",
    descDe: "Aus kreisenden Gedanken aussteigen",
    duration: "5 min",
    category: "calm",
    emoji: "🌊",
    script: {
      en: "Your mind has been busy. That's okay. Thoughts are like waves — they rise and fall. You don't need to follow every wave. Right now, anchor yourself to your breath. In through the nose, slowly. Out through the mouth, gently. Notice the space between thoughts. That space is yours. It's quiet there. Rest in that stillness, even for just a moment.",
      de: "Dein Geist war beschäftigt. Das ist in Ordnung. Gedanken sind wie Wellen — sie steigen und fallen. Du musst nicht jeder Welle folgen. Verankere dich jetzt in deinem Atem. Durch die Nase ein, langsam. Durch den Mund aus, sanft. Bemerke den Raum zwischen den Gedanken. Dieser Raum gehört dir. Es ist still dort. Ruhe in dieser Stille, auch nur für einen Moment.",
    },
  },
];

const prefersReducedMotion = typeof window !== "undefined"
  && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function AudioLibrary() {
  const { t, language } = useTranslation();
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sleepMode, setSleepMode] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(15);

  const player = useAudioPlayer({
    onEnd: () => {
      // noop — state resets automatically
    },
    onError: (msg) => {
      if (msg === "offline") {
        toast({
          title: t("common.offline"),
          description: t("common.offlineBody"),
          variant: "destructive",
        });
      }
    },
  });

  const handlePlaySession = (session: AudioSession) => {
    if (!isPremium) {
      navigate("/settings", { state: { scrollTo: "premium" } });
      return;
    }

    const text = language === "de" ? session.script.de : session.script.en;
    player.togglePlayPause(session.id, text, VOICE_ID, 0.9);
  };

  const startSleepMode = () => {
    setSleepMode(true);
    player.startSleepTimer(sleepTimerMinutes);
  };

  const exitSleepMode = () => {
    setSleepMode(false);
    player.cancelSleepTimer();
    player.stop();
    toast({ title: t("audio.sleepEnded") });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // Check if sleep timer ran out
  if (sleepMode && player.sleepTimer <= 0 && sleepMode) {
    // Timer ended
    setSleepMode(false);
    toast({ title: t("audio.sleepEnded") });
  }

  // Sleep mode UI
  if (sleepMode && player.sleepTimer > 0) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] z-50 flex flex-col items-center justify-center text-white">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Moon className="w-12 h-12 mx-auto mb-6 text-primary/60" />
          <p className="text-6xl font-light tracking-wider mb-4">
            {formatTime(player.sleepTimer)}
          </p>
          <p className="text-sm text-white/40 mb-8">
            {t("audio.sleepWell")}
          </p>

          {player.state === "playing" && (
            <div className="flex items-center gap-2 text-primary/60 mb-8">
              <Volume2 className="w-4 h-4" />
              <span className="text-sm">{t("audio.playing")}</span>
            </div>
          )}

          <Button
            variant="ghost"
            className="text-white/40 hover:text-white/60 min-h-[44px] min-w-[44px]"
            onClick={exitSleepMode}
            aria-label={t("audio.exit")}
          >
            {t("audio.exit")}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {t("audio.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("audio.subtitle")}
            </p>
          </div>
        </div>

        {/* Offline banner */}
        {!player.isOnline && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-destructive" />
            <p className="text-xs text-muted-foreground">{t("common.offline")}</p>
          </div>
        )}

        {/* Premium badge */}
        {!isPremium && (
          <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <Lock className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">
              {t("audio.premiumRequired")}
            </p>
          </div>
        )}

        {/* Sleep Mode Toggle */}
        <motion.button
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={startSleepMode}
          className="w-full mb-6 p-4 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-colors text-left min-h-[44px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Moon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {t("audio.sleepMode")}
              </p>
              <p className="text-xs text-muted-foreground">
                {`${sleepTimerMinutes} min · ${t("audio.minimalUI")}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[10, 15, 30].map(m => (
                <button
                  key={m}
                  onClick={(e) => { e.stopPropagation(); setSleepTimerMinutes(m); }}
                  className={`px-2 py-1 rounded-lg text-xs min-h-[32px] min-w-[32px] ${
                    sleepTimerMinutes === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </motion.button>

        {/* Sessions */}
        <div className="space-y-3">
          {audioSessions.map((session, i) => {
            const title = language === "de" ? session.titleDe : session.titleEn;
            const desc = language === "de" ? session.descDe : session.descEn;
            const isActive = player.activeSessionId === session.id;
            const isPlaying = isActive && player.state === "playing";
            const isLoading = isActive && player.state === "loading";
            const isPaused = isActive && player.state === "paused";

            return (
              <motion.div
                key={session.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  onClick={() => handlePlaySession(session)}
                  disabled={!player.isOnline && !isActive}
                  className={`w-full text-left p-4 rounded-2xl border transition-colors min-h-[44px] ${
                    isActive
                      ? "bg-primary/5 border-primary/30"
                      : "bg-card border-border/30 hover:border-border/60"
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">
                      {session.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Timer className="w-3 h-3" />
                        {session.duration}
                        {!isPremium && <Lock className="w-3 h-3 ml-1" />}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-5 h-5 text-primary" />
                      ) : isPaused ? (
                        <Play className="w-5 h-5 text-primary ml-0.5" />
                      ) : (
                        <Play className="w-5 h-5 text-primary ml-0.5" />
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

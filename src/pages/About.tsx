import { motion } from "framer-motion";
import { ArrowLeft, Heart, Shield, Brain, Sparkles, Users, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { StandalonePage } from "@/components/layout/StandalonePage";

export default function About() {
  const navigate = useNavigate();
  const { language } = useTranslation();

  const content = {
    en: {
      title: "About Soulvay",
      subtitle: "Your psychological companion",
      mission: {
        title: "Our Mission",
        content: "We believe everyone deserves a safe space to explore their thoughts and feelings. Soulvay was created to be that space – a gentle, private companion that helps you understand yourself better, one conversation at a time.",
      },
      story: {
        title: "Our Story",
        content: "Soulvay was born from a simple idea: mental wellness support should be accessible, private, and always available. We understand that not everyone can access therapy or counseling when they need it. That's why we built Soulvay – to bridge the gap between daily struggles and professional care.",
      },
      values: [
        {
          icon: Shield,
          title: "Privacy First",
          description: "Your thoughts are sacred. Your data is securely stored and we never share it.",
        },
        {
          icon: Heart,
          title: "Compassion Always",
          description: "Every interaction is designed with empathy and care at its core.",
        },
        {
          icon: Brain,
          title: "Thoughtfully Designed",
          description: "Our approaches are inspired by established psychological principles.",
        },
        {
          icon: Sparkles,
          title: "Continuous Growth",
          description: "We're always learning and improving to serve you better.",
        },
      ],
      disclaimer: {
        title: "Important Note",
        content: "Soulvay is a supportive wellness tool, not a replacement for professional mental health care. If you're experiencing a crisis or need professional help, please reach out to a licensed therapist or emergency services.",
      },
      team: {
        title: "The Team",
        content: "Soulvay is created by MindMade, a small team passionate about making mental wellness accessible to everyone.",
        founder: "Jonathan Jansen",
        role: "Founder",
        location: "Bad Honnef, Germany",
      },
    },
    de: {
      title: "Über Soulvay",
      subtitle: "Dein psychologischer Begleiter",
      mission: {
        title: "Unsere Mission",
        content: "Wir glauben, dass jeder einen sicheren Raum verdient, um seine Gedanken und Gefühle zu erkunden. Soulvay wurde erschaffen, um dieser Raum zu sein – ein sanfter, privater Begleiter, der dir hilft, dich selbst besser zu verstehen, ein Gespräch nach dem anderen.",
      },
      story: {
        title: "Unsere Geschichte",
        content: "Soulvay entstand aus einer einfachen Idee: Unterstützung für mentales Wohlbefinden sollte zugänglich, privat und immer verfügbar sein. Wir verstehen, dass nicht jeder Zugang zu Therapie oder Beratung hat, wenn er sie braucht. Deshalb haben wir Soulvay entwickelt – um die Lücke zwischen täglichen Herausforderungen und professioneller Betreuung zu schließen.",
      },
      values: [
        {
          icon: Shield,
          title: "Datenschutz zuerst",
          description: "Deine Gedanken sind heilig. Deine Daten werden sicher gespeichert und niemals weitergegeben.",
        },
        {
          icon: Heart,
          title: "Immer mitfühlend",
          description: "Jede Interaktion ist mit Empathie und Fürsorge im Kern gestaltet.",
        },
        {
          icon: Brain,
          title: "Durchdacht gestaltet",
          description: "Unsere Ansätze sind inspiriert von etablierten psychologischen Prinzipien.",
        },
        {
          icon: Sparkles,
          title: "Kontinuierliches Wachstum",
          description: "Wir lernen und verbessern uns ständig, um dir besser zu dienen.",
        },
      ],
      disclaimer: {
        title: "Wichtiger Hinweis",
        content: "Soulvay ist ein unterstützendes Wellness-Tool, kein Ersatz für professionelle psychische Gesundheitsversorgung. Wenn du eine Krise erlebst oder professionelle Hilfe benötigst, wende dich bitte an einen zugelassenen Therapeuten oder den Notdienst.",
      },
      team: {
        title: "Das Team",
        content: "Soulvay wird von MindMade entwickelt, einem kleinen Team, das sich leidenschaftlich dafür einsetzt, mentales Wohlbefinden für alle zugänglich zu machen.",
        founder: "Jonathan Jansen",
        role: "Gründer",
        location: "Bad Honnef, Deutschland",
      },
    },
  };

  const t = content[language];

  return (
    <StandalonePage>
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 safe-top">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Mission */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-6 border border-border/40 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{t.mission.title}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{t.mission.content}</p>
          </motion.section>

          {/* Story */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-6 border border-border/40 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{t.story.title}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{t.story.content}</p>
          </motion.section>

          {/* Values */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {language === "de" ? "Unsere Werte" : "Our Values"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {t.values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-card rounded-2xl p-5 border border-border/40 shadow-soft"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <value.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Team */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl p-6 border border-border/40 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{t.team.title}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">{t.team.content}</p>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-semibold text-primary">
                JJ
              </div>
              <div>
                <p className="font-medium text-foreground">{t.team.founder}</p>
                <p className="text-sm text-muted-foreground">{t.team.role}</p>
                <p className="text-xs text-muted-foreground">{t.team.location}</p>
              </div>
            </div>
          </motion.section>

          {/* Disclaimer */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-amber-500/10 rounded-2xl p-6 border border-amber-500/20"
          >
            <h2 className="text-lg font-semibold text-foreground mb-2">{t.disclaimer.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{t.disclaimer.content}</p>
          </motion.section>
        </div>
      </div>
    </div>
    </StandalonePage>
  );
}

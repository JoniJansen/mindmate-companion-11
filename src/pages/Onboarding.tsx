import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Sparkles, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    icon: Heart,
    title: "Welcome to MindMate",
    description: "Your calm companion for everyday mental wellness. We're here to listen, support, and help you grow.",
    color: "primary",
  },
  {
    icon: MessageCircle,
    title: "Talk Anytime",
    description: "Have meaningful conversations whenever you need. No judgment, no pressure—just understanding.",
    color: "calm",
  },
  {
    icon: Sparkles,
    title: "Build Better Habits",
    description: "Track your mood, journal your thoughts, and discover exercises that work for you.",
    color: "gentle",
  },
  {
    icon: Shield,
    title: "Safe & Private",
    description: "Your thoughts are yours. Everything stays confidential and secure.",
    color: "accent",
  },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/chat");
    }
  };

  const handleSkip = () => {
    navigate("/chat");
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const colorMap: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    calm: "bg-calm-soft text-calm",
    gentle: "bg-gentle-soft text-gentle",
    accent: "bg-accent-soft text-accent",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip button */}
      <div className="flex justify-end p-4 safe-top">
        <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
          Skip
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            {/* Icon */}
            <motion.div
              className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 ${colorMap[slide.color]}`}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon className="w-12 h-12" />
            </motion.div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mb-4">{slide.title}</h1>

            {/* Description */}
            <p className="text-muted-foreground text-base leading-relaxed">{slide.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress & Button */}
      <div className="px-8 pb-12 safe-bottom">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : index < currentSlide
                  ? "w-2 bg-primary/40"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Continue button */}
        <Button
          size="xl"
          className="w-full"
          onClick={handleNext}
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Continue"}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

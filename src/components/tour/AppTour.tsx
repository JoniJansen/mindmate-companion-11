import { useEffect, useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppTour, tourSteps } from "@/hooks/useAppTour";
import { useTranslation } from "@/hooks/useTranslation";

export const AppTour = forwardRef<HTMLDivElement>(function AppTour(_props, _ref) {
  const { 
    isActive, 
    currentStep, 
    totalSteps, 
    currentStepData, 
    nextStep, 
    prevStep, 
    skipTour 
  } = useAppTour();
  const { language } = useTranslation();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    if (currentStepData.position === "center") {
      setTargetRect(null);
      return;
    }

    const target = document.querySelector(currentStepData.target);
    if (target) {
      const rect = target.getBoundingClientRect();
      setTargetRect(rect);
      
      // Scroll element into view
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [isActive, currentStep, currentStepData]);

  if (!isActive || !currentStepData) return null;

  const isCenter = currentStepData.position === "center";
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  const getTooltipPosition = () => {
    if (isCenter || !targetRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (currentStepData.position) {
      case "top":
        return {
          top: `${targetRect.top - tooltipHeight - padding}px`,
          left: `${Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2))}px`,
        };
      case "bottom":
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2))}px`,
        };
      default:
        return {
          top: `${targetRect.top - tooltipHeight - padding}px`,
          left: `${Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2))}px`,
        };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        {/* Spotlight for non-center steps */}
        {targetRect && !isCenter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bg-transparent rounded-xl"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="absolute w-80 max-w-[calc(100vw-32px)]"
          style={getTooltipPosition()}
        >
          <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {currentStep + 1} / {totalSteps}
                  </span>
                </div>
                <button
                  onClick={skipTour}
                  className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {language === "de" ? currentStepData.title.de : currentStepData.title.en}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {language === "de" ? currentStepData.description.de : currentStepData.description.en}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 pb-3">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border/50 flex items-center justify-between gap-3">
              {!isFirst ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevStep}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {language === "de" ? "Zurück" : "Back"}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                >
                  {language === "de" ? "Überspringen" : "Skip"}
                </Button>
              )}
              
              <Button
                size="sm"
                onClick={nextStep}
                className="gap-1"
              >
                {isLast ? (
                  language === "de" ? "Los geht's!" : "Let's go!"
                ) : (
                  <>
                    {language === "de" ? "Weiter" : "Next"}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

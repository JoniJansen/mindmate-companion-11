import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Download, Instagram, MessageCircle, Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";

interface ShareableInsightCardProps {
  insightText: string;
  date: string;
  onDismiss?: () => void;
}

export function ShareableInsightCard({ insightText, date, onDismiss }: ShareableInsightCardProps) {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Anonymize: strip specific names, places, numbers
  const anonymize = (text: string) => {
    return text
      .replace(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b/g, "…")
      .replace(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g, "…");
  };

  const safeText = anonymize(insightText);
  const formattedDate = new Date(date).toLocaleDateString(language === "de" ? "de-DE" : "en-US", {
    month: "short", day: "numeric",
  });

  const shareText = `"${safeText}"\n\n· Soulvay`;
  const shareTextEncoded = encodeURIComponent(shareText);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        description: language === "de" ? "In Zwischenablage kopiert" : "Copied to clipboard",
      });
    } catch {}
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${shareTextEncoded}`, "_blank");
    setShowShareMenu(false);
  };

  const handleInstagramStory = async () => {
    // On mobile, use native share with Instagram target
    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
        });
      } catch {}
    } else {
      // Fallback: copy text for manual paste
      await handleCopyText();
      toast({
        description: language === "de"
          ? "Text kopiert — füge ihn in deine Instagram Story ein"
          : "Text copied — paste it into your Instagram Story",
      });
    }
    setShowShareMenu(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {}
    } else {
      await handleCopyText();
    }
    setShowShareMenu(false);
  };

  const handleSaveImage = async () => {
    // Create a canvas-based image of the card
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = 1080, h = 1350; // Instagram story dimensions
      canvas.width = w;
      canvas.height = h;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#1a1a2e");
      grad.addColorStop(0.5, "#16213e");
      grad.addColorStop(1, "#0f3460");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Quote text
      ctx.fillStyle = "#e8e8e8";
      ctx.font = "italic 42px Georgia, serif";
      ctx.textAlign = "center";

      const maxWidth = w - 160;
      const words = safeText.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? currentLine + " " + word : word;
        if (ctx.measureText(testLine).width > maxWidth) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      // Opening quote
      ctx.font = "120px Georgia, serif";
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      const textStartY = h / 2 - (lines.length * 56) / 2 - 60;
      ctx.fillText("\u201C", w / 2, textStartY);

      // Draw lines
      ctx.font = "italic 42px Georgia, serif";
      ctx.fillStyle = "#e8e8e8";
      lines.forEach((line, i) => {
        ctx.fillText(line, w / 2, textStartY + 40 + i * 56);
      });

      // Branding
      ctx.font = "24px -apple-system, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText("· Soulvay", w / 2, h - 80);

      // Download
      const link = document.createElement("a");
      link.download = "soulvay-reflection.png";
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({
        description: language === "de" ? "Bild gespeichert" : "Image saved",
      });
    } catch {
      toast({
        description: language === "de" ? "Bild konnte nicht erstellt werden" : "Could not create image",
        variant: "destructive",
      });
    }
    setShowShareMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div
        ref={cardRef}
        className="rounded-2xl overflow-hidden border border-primary/20"
      >
        {/* Premium gradient header */}
        <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-accent/10 px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-medium text-primary uppercase tracking-wider">
              {t("growth.insightCard")}
            </span>
          </div>
          <p className="text-[15px] leading-relaxed text-foreground font-medium italic">
            "{safeText}"
          </p>
        </div>

        {/* Footer */}
        <div className="bg-card px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{formattedDate} · Soulvay</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setShowShareMenu(!showShareMenu)}
          >
            <Share2 className="w-3.5 h-3.5" />
            {t("common.share")}
          </Button>
        </div>

        {/* Share Menu */}
        <AnimatePresence>
          {showShareMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3 bg-muted/30 border-t border-border/20">
                <div className="grid grid-cols-4 gap-2">
                  {/* Instagram Story */}
                  <button
                    onClick={handleInstagramStory}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">Story</span>
                  </button>

                  {/* WhatsApp */}
                  <button
                    onClick={handleWhatsApp}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">WhatsApp</span>
                  </button>

                  {/* Copy */}
                  <button
                    onClick={handleCopyText}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5 text-foreground" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {copied ? (language === "de" ? "Kopiert" : "Copied") : (language === "de" ? "Kopieren" : "Copy")}
                    </span>
                  </button>

                  {/* Save Image */}
                  <button
                    onClick={handleSaveImage}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Download className="w-5 h-5 text-foreground" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {language === "de" ? "Bild" : "Image"}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

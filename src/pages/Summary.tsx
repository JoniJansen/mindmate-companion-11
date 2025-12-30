import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Heart, 
  MessageCircle,
  Sparkles,
  ChevronRight,
  Share2,
  Download
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";

export default function Summary() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Session Summary" 
        subtitle="December 28, 2024"
        showBack 
        backTo="/chat"
      />

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* Session overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <CalmCard variant="calm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-calm/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-calm" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Chat Session</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 15 minutes
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Today at 3:45 PM
                  </span>
                </div>
              </div>
            </div>
          </CalmCard>
        </motion.div>

        {/* Key topics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">What We Discussed</h2>
          <CalmCard variant="elevated">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-soft flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Work-related stress</p>
                  <p className="text-sm text-muted-foreground">Discussed strategies for setting boundaries</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-soft flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Sleep quality</p>
                  <p className="text-sm text-muted-foreground">Explored evening wind-down routine</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-soft flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Self-care practices</p>
                  <p className="text-sm text-muted-foreground">Identified small daily wins</p>
                </div>
              </li>
            </ul>
          </CalmCard>
        </motion.div>

        {/* Mood insight */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">Mood Insight</h2>
          <CalmCard variant="gentle">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">😔</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-3xl">😊</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Your mood improved during our conversation. That's a positive sign!
                </p>
              </div>
            </div>
          </CalmCard>
        </motion.div>

        {/* Suggested actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">Try This Week</h2>
          <div className="space-y-3">
            <CalmCard variant="default" className="cursor-pointer hover:shadow-card transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-calm-soft flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-calm" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Box Breathing Exercise</p>
                  <p className="text-xs text-muted-foreground">4 min • When feeling overwhelmed</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CalmCard>

            <CalmCard variant="default" className="cursor-pointer hover:shadow-card transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gentle-soft flex items-center justify-center">
                  <Heart className="w-5 h-5 text-gentle" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Gratitude Journaling</p>
                  <p className="text-xs text-muted-foreground">5 min • Each evening</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CalmCard>
          </div>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">Your Progress</h2>
          <CalmCard variant="elevated">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Managing Work Stress</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "55%" }}
                animate={{ width: "65%" }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              65% complete • 5 sessions in this topic
            </p>
          </CalmCard>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3"
        >
          <Button variant="outline" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

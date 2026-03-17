import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Mic,
  Crown,
  ArrowRight,
  Calendar,
  Loader2,
} from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useAnalyticsDashboard } from "@/hooks/useAnalyticsDashboard";

const FUNNEL_STEPS = [
  { key: "page_view", label: "Page Views", icon: BarChart3 },
  { key: "demo_chat_started", label: "Demo Started", icon: MessageSquare },
  { key: "demo_chat_converted", label: "Demo → Signup", icon: TrendingUp },
  { key: "onboarding_completed", label: "Onboarding Done", icon: Users },
  { key: "first_chat_sent", label: "First Chat", icon: MessageSquare },
  { key: "voice_trial_started", label: "Voice Trial", icon: Mic },
  { key: "premium_cta_clicked", label: "Premium CTA", icon: Crown },
  { key: "premium_subscribed", label: "Subscribed", icon: Crown },
];

export function AnalyticsDashboardSection() {
  const { language } = useTranslation();
  const { funnelData, isLoading, error, fetchFunnel } = useAnalyticsDashboard();
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchFunnel(days);
  }, [days, fetchFunnel]);

  const texts = {
    title: { en: "Analytics", de: "Analytics" },
    subtitle: { en: "Conversion funnel & key metrics", de: "Conversion-Funnel & Kennzahlen" },
    totalUsers: { en: "Total Users", de: "Nutzer gesamt" },
    sessions: { en: "Sessions", de: "Sitzungen" },
    activeSubs: { en: "Active Subscriptions", de: "Aktive Abos" },
    conversionFunnel: { en: "Conversion Funnel", de: "Conversion-Funnel" },
    last7: { en: "7 days", de: "7 Tage" },
    last30: { en: "30 days", de: "30 Tage" },
    last90: { en: "90 days", de: "90 Tage" },
  };

  if (isLoading && !funnelData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <CalmCard className="text-center py-6">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchFunnel(days)}>
          Retry
        </Button>
      </CalmCard>
    );
  }

  if (!funnelData) return null;

  const maxVal = Math.max(...Object.values(funnelData.funnel), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          <BarChart3 className="w-5 h-5 inline mr-2 text-primary" />
          {texts.title[language]}
        </h2>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? "default" : "ghost"}
              onClick={() => setDays(d)}
              className="text-xs px-2 h-7"
            >
              {d === 7 ? texts.last7[language] : d === 30 ? texts.last30[language] : texts.last90[language]}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: texts.totalUsers[language], value: funnelData.total_users, icon: Users },
          { label: texts.sessions[language], value: funnelData.unique_sessions, icon: Calendar },
          { label: texts.activeSubs[language], value: funnelData.active_subscriptions, icon: Crown },
        ].map((m) => (
          <CalmCard key={m.label} className="text-center py-3">
            <m.icon className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{m.value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{m.label}</p>
          </CalmCard>
        ))}
      </div>

      {/* Funnel */}
      <CalmCard>
        <h3 className="text-sm font-medium mb-3">
          <TrendingUp className="w-4 h-4 inline mr-1 text-primary" />
          {texts.conversionFunnel[language]}
        </h3>
        <div className="space-y-2">
          {FUNNEL_STEPS.map((step, i) => {
            const count = funnelData.funnel[step.key] || 0;
            const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
            const prevCount = i > 0 ? funnelData.funnel[FUNNEL_STEPS[i - 1].key] || 0 : 0;
            const convRate = i > 0 && prevCount > 0 ? ((count / prevCount) * 100).toFixed(1) : null;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2"
              >
                <step.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs truncate">{step.label}</span>
                    <div className="flex items-center gap-1.5">
                      {convRate && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                          {convRate}%
                        </Badge>
                      )}
                      <span className="text-xs font-semibold tabular-nums">{count}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                    />
                  </div>
                </div>
                {i < FUNNEL_STEPS.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>
      </CalmCard>
    </div>
  );
}

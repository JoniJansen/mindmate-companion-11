/**
 * useChatIntelligence — Extracts memory, patterns, and insights
 * from completed conversations. Fire-and-forget background processing.
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { detectCrisis } from "@/lib/crisisDetection";
import { useCompanion } from "@/hooks/useCompanion";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@/hooks/useChatComposer";

export function useChatIntelligence() {
  const { user } = useAuth();
  const { companion, incrementBond } = useCompanion();
  const { t, language } = useTranslation();
  const { toast } = useToast();

  /**
   * Trigger background intelligence extraction when a conversation ends.
   * Only fires for meaningful conversations (4+ user messages).
   */
  const extractIntelligence = useCallback(async (
    messages: Message[],
    conversationId: string | null,
  ) => {
    if (!user) return;

    const userMsgCount = messages.filter(m => m.role === "user" && !m.isError).length;
    if (userMsgCount < 4) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };

      const conversationContent = messages
        .filter(m => !m.isError)
        .map(m => `${m.role}: ${m.content}`)
        .join("\n\n");

      // Crisis suppression: a conversation containing a crisis disclosure is
      // never mined for "memories". Two reasons. The companion must not bring
      // the darkest thing somebody ever wrote back up casually weeks later —
      // and the text never has to leave the device for extraction in the first
      // place, which keeps it out of the gateway and its logs.
      const userTexts = messages.filter(m => m.role === "user" && !m.isError).map(m => m.content);
      const conversationHasCrisis = detectCrisis(userTexts).detected;

      // Memory extraction — always for 4+ messages, unless suppressed above
      if (!conversationHasCrisis) {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-memories`, {
          method: "POST", headers,
          body: JSON.stringify({ content: conversationContent, source: "chat", language }),
        }).catch(() => {});
      }

      // Session insight — 6+ messages, suppressed for crisis conversations.
      // These write to session_insights / emotional_patterns, and chat/index.ts
      // injects both back into the system prompt. Blocking only extract-memories
      // left two open doors into the same place.
      if (userMsgCount >= 6 && !conversationHasCrisis) {
        const chatMsgs = messages
          .filter(m => !m.isError)
          .map(m => ({ role: m.role, content: m.content }));
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/session-insight`, {
          method: "POST", headers,
          body: JSON.stringify({ messages: chatMsgs, conversation_id: conversationId, language }),
        }).catch(() => {});
      }

      // Pattern detection — 8+ messages, same suppression.
      if (userMsgCount >= 8 && !conversationHasCrisis) {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-patterns`, {
          method: "POST", headers,
          body: JSON.stringify({ language }),
        }).catch(() => {});
      }

      // Bond increment — 5+ messages
      if (userMsgCount >= 5) {
        const result = await incrementBond();
        if (result && result.newLevel > result.previousLevel) {
          const milestones = [3, 5, 10, 15, 20, 30, 50];
          if (milestones.includes(result.newLevel)) {
            const companionName = companion?.name || "Soulvay";
            const msg = t("chat.bond.milestone").replace("{name}", companionName);
            toast({
              title: `✨ ${t("chat.bond.level")} ${result.newLevel}`,
              description: msg,
            });
          }
        }
      }
    } catch {
      // Intelligence extraction is non-critical — never block the user
    }
  }, [user, companion, incrementBond, language, t, toast]);

  return { extractIntelligence };
}

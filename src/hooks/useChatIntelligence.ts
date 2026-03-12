/**
 * useChatIntelligence — Extracts memory, patterns, and insights
 * from completed conversations. Fire-and-forget background processing.
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompanion } from "@/hooks/useCompanion";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@/hooks/useChatComposer";

export function useChatIntelligence() {
  const { user } = useAuth();
  const { companion, incrementBond } = useCompanion();
  const { language } = useTranslation();
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

      // Memory extraction — always for 4+ messages
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-memories`, {
        method: "POST", headers,
        body: JSON.stringify({ content: conversationContent, source: "chat", language }),
      }).catch(() => {});

      // Session insight — 6+ messages
      if (userMsgCount >= 6) {
        const chatMsgs = messages
          .filter(m => !m.isError)
          .map(m => ({ role: m.role, content: m.content }));
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/session-insight`, {
          method: "POST", headers,
          body: JSON.stringify({ messages: chatMsgs, conversation_id: conversationId, language }),
        }).catch(() => {});
      }

      // Pattern detection — 8+ messages
      if (userMsgCount >= 8) {
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
            const msg = language === "de"
              ? `Du und ${companionName} versteht euch immer besser.`
              : `You and ${companionName} are understanding each other better.`;
            toast({
              title: `✨ ${language === "de" ? "Verbindungslevel" : "Bond level"} ${result.newLevel}`,
              description: msg,
            });
          }
        }
      }
    } catch {
      // Intelligence extraction is non-critical — never block the user
    }
  }, [user, companion, incrementBond, language, toast]);

  return { extractIntelligence };
}

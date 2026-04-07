/**
 * useChatSaveActions — Handles saving chat messages, conversations,
 * and AI-generated summaries to the journal.
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@/hooks/useChatComposer";

export function useChatSaveActions() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveDialogVariant, setSaveDialogVariant] = useState<"message" | "conversation" | "summary">("message");
  const [saveDialogDefaultTitle, setSaveDialogDefaultTitle] = useState("");
  const [saveDialogCallback, setSaveDialogCallback] = useState<((title: string) => void) | null>(null);

  /** Navigate to summary page */
  const handleSummary = useCallback((messages: Message[]) => {
    localStorage.setItem(
      "soulvay-chat-messages",
      JSON.stringify(messages.map(m => ({ role: m.role, content: m.content }))),
    );
    navigate("/summary", {
      state: { messages: messages.map(m => ({ role: m.role, content: m.content })) },
    });
  }, [navigate]);

  /** Save entire conversation to journal */
  const handleSaveChat = useCallback((messages: Message[]) => {
    if (!user) return;
    setSaveDialogVariant("conversation");
    setSaveDialogDefaultTitle(t("chat.chatConversation"));
    setSaveDialogCallback(() => async (title: string) => {
      const chatContent = messages
        .filter(m => !m.isError)
        .map(m => `${m.role === "user" ? "🧑" : "🤖"} ${m.content}`)
        .join("\n\n");
      try {
        await supabase.from("journal_entries").insert({
          user_id: user.id,
          user_session_id: user.id,
          content: chatContent,
          title: title || t("chat.journalTitle.conversation"),
          source: "chat",
          tags: ["chat"],
        } as any);
        toast({ title: t("chat.savedToJournal"), description: t("chat.chatSavedDesc") });
      } catch {
        toast({ title: t("common.error"), variant: "destructive" });
      }
    });
    setSaveDialogOpen(true);
  }, [user, t, toast]);

  /** Generate AI summary and save to journal */
  const handleSaveSummary = useCallback(async (messages: Message[]) => {
    if (!user) return;
    toast({ title: t("chat.generatingSummary"), description: t("chat.pleaseWait") });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const chatMsgs = messages.filter(m => !m.isError).map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: chatMsgs, language }),
      });
      if (!resp.ok) throw new Error("Summary generation failed");
      const summary = await resp.json();
      const structuredContent = [
        `## ${t("chat.summarySection.summary")}`, summary.summary || "", "",
        `### ${t("chat.summarySection.themes")}`,
        ...(summary.emotionalThemes || []).map((th: string) => `• ${th}`), "",
        `### ${t("chat.summarySection.moodJourney")}`,
        `${summary.moodProgression?.start || "💭"} → ${summary.moodProgression?.end || "🙂"} ${summary.moodProgression?.insight || ""}`, "",
        `### ${t("chat.summarySection.nextStep")}`, summary.nextStep || "",
      ].join("\n");
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        user_session_id: user.id,
        content: structuredContent,
        title: t("chat.journalTitle.summary"),
        source: "chat-summary",
        tags: ["chat", "summary"],
      } as any);
      toast({ title: t("chat.savedToJournal"), description: t("chat.summarySavedDesc") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  }, [user, t, language, toast]);

  /** Save a single message to journal */
  const handleSaveMessage = useCallback((message: { id: string; content: string; role: string }) => {
    if (!user) return;
    setSaveDialogVariant("message");
    setSaveDialogDefaultTitle(t("chat.chatMessage"));
    setSaveDialogCallback(() => async (title: string) => {
      try {
        await supabase.from("journal_entries").insert({
          user_id: user.id,
          user_session_id: user.id,
          content: message.content,
          title: title || t("chat.journalTitle.message"),
          source: "chat",
          tags: ["chat"],
        } as any);
        toast({ title: t("chat.savedToJournal"), description: t("chat.messageSavedDesc") });
      } catch {
        toast({ title: t("common.error"), variant: "destructive" });
      }
    });
    setSaveDialogOpen(true);
  }, [user, t, toast]);

  return {
    // Dialog state
    saveDialogOpen,
    setSaveDialogOpen,
    saveDialogVariant,
    saveDialogDefaultTitle,
    saveDialogCallback,
    // Actions
    handleSummary,
    handleSaveChat,
    handleSaveSummary,
    handleSaveMessage,
  };
}

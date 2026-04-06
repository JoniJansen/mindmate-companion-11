import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Conversation {
  id: string;
  title: string | null;
  chat_mode: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function useChatPersistence() {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const pendingWrites = useRef<Promise<void>>(Promise.resolve());

  const createConversation = useCallback(async (chatMode: string = "talk"): Promise<string | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, chat_mode: chatMode } as any)
        .select("id")
        .single();
      if (error || !data) return null;
      setConversationId(data.id);
      return data.id;
    } catch {
      return null;
    }
  }, [user]);

  const saveMessage = useCallback(async (convId: string, role: "user" | "assistant", content: string) => {
    if (!user || !convId) return;
    // Chain writes to avoid race conditions
    pendingWrites.current = pendingWrites.current.then(async () => {
      try {
        await supabase.from("chat_messages").insert({
          conversation_id: convId,
          role,
          content,
        } as any);
        // Touch updated_at on conversation
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() } as any).eq("id", convId);
      } catch (e) {
        if (import.meta.env.DEV) console.error("Save message error:", e);
      }
    });
  }, [user]);

  const updateConversationTitle = useCallback(async (convId: string, title: string) => {
    if (!user || !convId) return;
    try {
      await supabase.from("conversations").update({ title } as any).eq("id", convId);
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Update conversation title failed:", e);
    }
  }, [user]);

  const loadConversation = useCallback(async (convId: string): Promise<ChatMessage[]> => {
    if (!user) return [];
    try {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true }) as any;
      return data || [];
    } catch {
      return [];
    }
  }, [user]);

  const loadRecentConversations = useCallback(async (limit = 20): Promise<Conversation[]> => {
    if (!user) return [];
    try {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(limit) as any;
      return data || [];
    } catch {
      return [];
    }
  }, [user]);

  const deleteConversation = useCallback(async (convId: string) => {
    if (!user) return;
    try {
      await supabase.from("conversations").delete().eq("id", convId);
    } catch {}
  }, [user]);

  return {
    conversationId,
    setConversationId,
    createConversation,
    saveMessage,
    updateConversationTitle,
    loadConversation,
    loadRecentConversations,
    deleteConversation,
  };
}

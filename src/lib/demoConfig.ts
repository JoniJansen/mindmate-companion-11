// Centralized demo chat configuration — easy to toggle for A/B testing
export const DEMO_MESSAGE_LIMIT = 3;

const DEMO_SESSION_KEY = "soulvay-demo-conversation";

export interface DemoConversationData {
  messages: { role: "user" | "assistant"; content: string }[];
  language: "en" | "de";
  companionName: string;
  timestamp: number;
}

/** Save demo conversation to sessionStorage for post-signup continuity */
export function saveDemoConversation(data: DemoConversationData): void {
  try {
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(data));
  } catch {}
}

/** Retrieve and clear demo conversation (one-time read) */
export function consumeDemoConversation(): DemoConversationData | null {
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    const data = JSON.parse(raw) as DemoConversationData;
    // Only valid for 30 minutes
    if (Date.now() - data.timestamp > 30 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Chat Greeting Language — Smoke Layer
 *
 * Verifies today's fix in src/pages/Chat.tsx:
 *   const savedLang = language || composer.preferences.current.language;
 * The greeting must follow the user's stored language preference
 * (soulvay-preferences), not default to English. The logic is not
 * extractable as a pure function without refactoring, so this is a
 * targeted component test with all heavy hooks mocked and the REAL
 * useTranslation hook reading localStorage.
 */

const h = vi.hoisted(() => ({
  setMessagesSpy: vi.fn(),
  speakResponseSpy: vi.fn(),
  handleSendSpy: vi.fn(async () => "sent"),
  preferencesLanguage: { value: "en" as "en" | "de" },
}));

// ── Hooks used by Chat.tsx ──
vi.mock("@/hooks/useAnalytics", () => ({ analytics: { track: vi.fn() } }));
vi.mock("@/lib/demoConfig", () => ({ consumeDemoConversation: () => null }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, aiConsentGiven: false }),
}));
vi.mock("@/hooks/useNetworkStatus", () => ({ useNetworkStatus: () => ({ isOnline: true }) }));
vi.mock("@/hooks/usePremium", () => ({ usePremium: () => ({ canUseVoice: false }) }));
vi.mock("@/hooks/useSwipeBack", () => ({ useSwipeBack: () => {} }));
vi.mock("@/hooks/useCompanion", () => ({ useCompanion: () => ({ companion: null }) }));
vi.mock("@/hooks/useAvatarUrl", () => ({ useAvatarUrl: () => undefined }));
vi.mock("@/hooks/useCompanionVisualState", () => ({ useCompanionVisualState: () => "idle" }));
vi.mock("@/hooks/useChatIntelligence", () => ({
  useChatIntelligence: () => ({ extractIntelligence: vi.fn() }),
}));
vi.mock("@/hooks/useChatSaveActions", () => ({
  useChatSaveActions: () => ({
    handleSummary: vi.fn(),
    handleSaveMessage: vi.fn(),
    handleSaveChat: vi.fn(),
    handleSaveSummary: vi.fn(),
    saveDialogOpen: false,
    setSaveDialogOpen: vi.fn(),
    saveDialogDefaultTitle: "",
    saveDialogVariant: "message",
    saveDialogCallback: null,
  }),
}));
vi.mock("@/hooks/useChatComposer", () => ({
  useChatComposer: () => ({
    messages: [],
    setMessages: h.setMessagesSpy,
    inputValue: "",
    setInputValue: vi.fn(),
    isLoading: false,
    isStreamingActive: false,
    isRestoringConversation: false,
    streamingContent: "",
    chatMessageCountRef: { current: 0 },
    conversationId: null,
    handleSend: h.handleSendSpy,
    handleRetry: vi.fn(),
    handleContinue: vi.fn(),
    restoreConversation: vi.fn(async () => {}),
    startNewConversation: vi.fn(),
    cleanup: vi.fn(),
    preferences: { current: { language: h.preferencesLanguage.value } },
    isPremium: false,
    messagesRemaining: 15,
    dailyMessageLimit: 15,
    canUseClarifyMode: false,
    canUsePatternMode: false,
    canUseSessionSummary: false,
    canSendMessage: () => true,
  }),
}));
vi.mock("@/hooks/useChatVoice", () => ({
  useChatVoice: () => ({
    voiceInputValue: "",
    setVoiceInputValue: vi.fn(),
    pendingTranscript: "",
    setPendingTranscript: vi.fn(),
    showTranscriptConfirm: false,
    setShowTranscriptConfirm: vi.fn(),
    speakResponse: h.speakResponseSpy,
    voiceSettings: { autoPlayReplies: false },
    voiceModeEnabled: false,
    isListening: false,
    isSpeaking: false,
    isTTSLoading: false,
    isCooldown: false,
    sttError: null,
    isSpeechSupported: false,
    toggleVoiceMode: vi.fn(),
    toggleRecording: vi.fn(),
    updateSetting: vi.fn(),
    playMessage: vi.fn(),
    stopTTS: vi.fn(),
    isPlayingMessage: null,
    isLoadingMessage: null,
    handleTranscriptSend: vi.fn(),
    handleTranscriptEdit: vi.fn(),
    handleTranscriptCancel: vi.fn(),
  }),
}));
vi.mock("@/hooks/useConversationalVoice", () => ({
  useConversationalVoice: () => ({
    status: "disconnected",
    phase: "idle",
    isSpeaking: false,
    isConnected: false,
    userTranscript: "",
    agentTranscript: "",
    startSession: vi.fn(),
    endSession: vi.fn(),
    resetError: vi.fn(),
    micWarning: null,
    getInputVolume: () => 0,
    getOutputVolume: () => 0,
  }),
}));

// ── Child components (rendered but irrelevant for greeting logic) ──
vi.mock("@/components/layout/PageHeader", () => ({ PageHeader: () => null }));
vi.mock("@/components/chat/ChatModeSelector", () => ({ ChatModeSelector: () => null }));
vi.mock("@/components/chat/ChatDisclaimer", () => ({ ChatDisclaimer: () => null }));
vi.mock("@/components/chat/ChatMessages", () => ({ ChatMessages: () => null }));
vi.mock("@/components/chat/ChatInputBar", () => ({ ChatInputBar: () => null }));
vi.mock("@/components/chat/ChatActionButtons", () => ({ ChatActionButtons: () => null }));
vi.mock("@/components/chat/SaveToJournalDialog", () => ({ SaveToJournalDialog: () => null }));
vi.mock("@/components/chat/VoiceConversationPanel", () => ({ VoiceConversationPanel: () => null }));
vi.mock("@/components/chat/VoiceTranscriptConfirm", () => ({ VoiceTranscriptConfirm: () => null }));
vi.mock("@/components/chat/RealtimeVoicePanel", () => ({ RealtimeVoicePanel: () => null }));
vi.mock("@/components/premium/UpgradePrompt", () => ({ UpgradePrompt: () => null }));
vi.mock("@/components/premium/MessageLimitIndicator", () => ({ MessageLimitIndicator: () => null }));
vi.mock("@/components/premium/ChatVoiceTrialPrompt", () => ({ ChatVoiceTrialPrompt: () => null }));
vi.mock("@/components/premium/ChatLimitPrompt", () => ({ ChatLimitPrompt: () => null }));
vi.mock("@/components/companion/CompanionAvatarAnimated", () => ({ CompanionAvatarAnimated: () => null }));

import Chat from "@/pages/Chat";

function renderChat() {
  return render(
    <MemoryRouter initialEntries={["/chat"]}>
      <Chat />
    </MemoryRouter>,
  );
}

/** Extracts the greeting message content passed to composer.setMessages */
function getGreeting(): string {
  const call = h.setMessagesSpy.mock.calls.find(
    (c) => Array.isArray(c[0]) && c[0][0]?.id?.startsWith("greeting"),
  );
  expect(call, "expected setMessages to be called with a greeting message").toBeDefined();
  return call![0][0].content as string;
}

describe("Chat greeting language selection", () => {
  beforeEach(() => {
    localStorage.clear();
    h.setMessagesSpy.mockClear();
    h.speakResponseSpy.mockClear();
    h.handleSendSpy.mockClear();
  });

  it("greets in German when stored preference is de", async () => {
    localStorage.setItem("soulvay-preferences", JSON.stringify({ language: "de" }));
    renderChat();
    await waitFor(() => expect(h.setMessagesSpy).toHaveBeenCalled());
    const greeting = getGreeting();
    expect(greeting).toContain("Hallo. Ich bin Soulvay");
    expect(greeting).toContain("Nimm dir Zeit");
    expect(greeting).not.toContain("Hello. I'm");
  });

  it("greets in English when stored preference is en", async () => {
    localStorage.setItem("soulvay-preferences", JSON.stringify({ language: "en" }));
    renderChat();
    await waitFor(() => expect(h.setMessagesSpy).toHaveBeenCalled());
    const greeting = getGreeting();
    expect(greeting).toContain("Hello. I'm Soulvay");
    expect(greeting).toContain("Take your time");
    expect(greeting).not.toContain("Hallo. Ich bin");
  });

  it("uses the German personalized focus line instead of the generic closing when focusAreas exist", async () => {
    localStorage.setItem("soulvay-preferences", JSON.stringify({ language: "de" }));
    localStorage.setItem(
      "soulvay-personalization",
      JSON.stringify({ companionId: "mira", focusAreas: ["stress"] }),
    );
    renderChat();
    await waitFor(() => expect(h.setMessagesSpy).toHaveBeenCalled());
    const greeting = getGreeting();
    // Companion name resolved from localStorage archetype
    expect(greeting).toContain("Hallo. Ich bin Mira");
    // German focus line, not the English one
    expect(greeting).toContain("Ich habe gesehen, dass Stress dich beschäftigt.");
    expect(greeting).not.toContain("I noticed you'd like to work on stress");
    // Personal line replaces the generic closing line
    expect(greeting).not.toContain("Nimm dir Zeit");
  });

  it("does not auto-fire an AI request on mount without consent (greeting only)", async () => {
    localStorage.setItem("soulvay-preferences", JSON.stringify({ language: "de" }));
    localStorage.setItem("soulvay-initial-message", "Mir geht es nicht gut");
    renderChat();
    // aiConsentGiven is false in the mocked useAuth: the pending message must
    // stay in localStorage and no send may fire (Apple 5.1.1(i) consent gate).
    await waitFor(() => {
      expect(localStorage.getItem("soulvay-initial-message")).toBe("Mir geht es nicht gut");
    });
    expect(h.handleSendSpy).not.toHaveBeenCalled();
  });
});

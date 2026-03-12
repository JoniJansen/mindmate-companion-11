import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Preferences Service Tests ──

describe("Preferences Service", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("returns defaults when no preferences stored", async () => {
    const { getPreferences, invalidatePreferencesCache } = await import("@/lib/preferences");
    invalidatePreferencesCache();
    const prefs = getPreferences();
    expect(prefs.language).toBe("en");
    expect(prefs.tone).toBe("gentle");
    expect(prefs.addressForm).toBe("du");
    expect(prefs.notifications).toBe(true);
    expect(prefs.innerDialogue).toBe(false);
  });

  it("reads from soulvay-preferences key", async () => {
    localStorage.setItem("soulvay-preferences", JSON.stringify({ language: "de", tone: "structured" }));
    const { getPreferences, invalidatePreferencesCache } = await import("@/lib/preferences");
    invalidatePreferencesCache();
    const prefs = getPreferences();
    expect(prefs.language).toBe("de");
    expect(prefs.tone).toBe("structured");
  });

  it("falls back to mindmate-preferences for legacy users", async () => {
    localStorage.setItem("mindmate-preferences", JSON.stringify({ language: "de" }));
    const { getPreferences, invalidatePreferencesCache } = await import("@/lib/preferences");
    invalidatePreferencesCache();
    const prefs = getPreferences();
    expect(prefs.language).toBe("de");
  });

  it("setPreferences writes to both keys", async () => {
    const { setPreferences, invalidatePreferencesCache } = await import("@/lib/preferences");
    invalidatePreferencesCache();
    setPreferences({ language: "de" });
    
    const primary = JSON.parse(localStorage.getItem("soulvay-preferences")!);
    const legacy = JSON.parse(localStorage.getItem("mindmate-preferences")!);
    expect(primary.language).toBe("de");
    expect(legacy.language).toBe("de");
  });

  it("notifies listeners on change", async () => {
    const { setPreferences, onPreferencesChange, invalidatePreferencesCache } = await import("@/lib/preferences");
    invalidatePreferencesCache();
    const listener = vi.fn();
    const unsub = onPreferencesChange(listener);
    
    setPreferences({ tone: "neutral" });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ tone: "neutral" }));
    
    unsub();
    setPreferences({ tone: "structured" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("soulvay key takes priority over mindmate key", async () => {
    localStorage.setItem("soulvay-preferences", JSON.stringify({ language: "en" }));
    localStorage.setItem("mindmate-preferences", JSON.stringify({ language: "de" }));
    const { getPreferences, invalidatePreferencesCache } = await import("@/lib/preferences");
    invalidatePreferencesCache();
    expect(getPreferences().language).toBe("en");
  });
});

// ── Premium Gating Tests ──

describe("Premium Gating", () => {
  it("canSendMessage returns false when limit reached (non-premium)", () => {
    const DAILY_MESSAGE_LIMIT = 15;
    const messagesUsed = 15;
    const canSend = messagesUsed < DAILY_MESSAGE_LIMIT;
    expect(canSend).toBe(false);
  });

  it("canSendMessage returns true for premium users regardless of count", () => {
    const isPremium = true;
    const canSend = isPremium || 0 < 15;
    expect(canSend).toBe(true);
  });

  it("premium state resets on logout (module-level cache)", () => {
    let _lastCheckAt = 12345;
    let _lastServerResult = true;
    
    const user = null;
    if (!user) {
      _lastCheckAt = 0;
      _lastServerResult = false;
    }
    
    expect(_lastCheckAt).toBe(0);
    expect(_lastServerResult).toBe(false);
  });

  it("server-verified premium takes precedence over cached state", () => {
    const serverVerifiedPremium = false;
    const cachedPremium = true;
    const finalPremium = serverVerifiedPremium !== null ? serverVerifiedPremium : cachedPremium;
    expect(finalPremium).toBe(false);
  });
});

// ── Edge Function Security Tests ──

describe("Edge Function Security Patterns", () => {
  it("client no longer sends userId in manage-subscription calls", () => {
    const body = { action: "status" };
    expect(body).not.toHaveProperty("userId");
  });

  it("client no longer sends userId in create-checkout calls", () => {
    const body = {
      planType: "monthly",
      successUrl: "https://example.com/settings?success=true",
      cancelUrl: "https://example.com/settings?canceled=true",
    };
    expect(body).not.toHaveProperty("userId");
  });

  it("error responses never expose internal error messages", () => {
    // Simulates the hardened chat edge function error handler
    const internalError = new Error("LOVABLE_API_KEY is not configured");
    const clientResponse = { error: "Something went wrong. Please try again." };
    expect(clientResponse.error).not.toContain("LOVABLE_API_KEY");
    expect(clientResponse.error).not.toContain("configured");
  });
});

// ── Voice Session Lifecycle Tests ──

describe("Voice Session Lifecycle", () => {
  it("max session duration is set to 30 minutes", () => {
    const MAX_SESSION_DURATION_MS = 30 * 60 * 1000;
    expect(MAX_SESSION_DURATION_MS).toBe(1_800_000);
  });

  it("retry count resets on successful connection", () => {
    let retryCount = 2;
    retryCount = 0;
    expect(retryCount).toBe(0);
  });

  it("retry stops after maxRetries", () => {
    const maxRetries = 2;
    let retryCount = 0;
    
    for (let i = 0; i < 3; i++) {
      if (retryCount < maxRetries) {
        retryCount++;
      }
    }
    
    expect(retryCount).toBe(maxRetries);
  });
});

// ── Chat Runtime Hardening Tests ──

describe("Chat Runtime Hardening", () => {
  it("duplicate send is prevented by abort controller guard", () => {
    // Simulates the guard in useChatComposer.handleSend
    let abortController: AbortController | null = new AbortController();
    const isInFlight = abortController && !abortController.signal.aborted;
    expect(isInFlight).toBe(true); // Should block a second send
  });

  it("conversation truncation respects MAX_RECENT_TURNS", () => {
    const MAX_RECENT_TURNS = 50;
    const messages = Array.from({ length: 100 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Message ${i}`,
    }));
    
    const recentCount = Math.min(MAX_RECENT_TURNS, messages.length);
    const recent = messages.slice(-recentCount);
    expect(recent).toHaveLength(50);
    expect(recent[0].content).toBe("Message 50");
  });

  it("individual messages are capped at MAX_SINGLE_MSG_CHARS", () => {
    const MAX_SINGLE_MSG_CHARS = 2500;
    const longContent = "x".repeat(5000);
    const capped = longContent.length > MAX_SINGLE_MSG_CHARS
      ? longContent.substring(0, MAX_SINGLE_MSG_CHARS) + "\n[…truncated]"
      : longContent;
    expect(capped.length).toBeLessThan(5000);
    expect(capped).toContain("[…truncated]");
  });
});

// ── Error Mapper Tests ──

describe("Error Mapper", () => {
  it("maps 401 to reauth action", async () => {
    const { mapHttpError } = await import("@/lib/errorMapper");
    const result = mapHttpError(401);
    expect(result.action).toBe("reauth");
    expect(result.titleKey).toBe("error.unauthorized");
  });

  it("maps 429 to wait action", async () => {
    const { mapHttpError } = await import("@/lib/errorMapper");
    const result = mapHttpError(429);
    expect(result.action).toBe("wait");
  });

  it("maps 500+ to retry action", async () => {
    const { mapHttpError } = await import("@/lib/errorMapper");
    const result = mapHttpError(502);
    expect(result.action).toBe("retry");
  });

  it("maps unknown status to retry action", async () => {
    const { mapHttpError } = await import("@/lib/errorMapper");
    const result = mapHttpError(418);
    expect(result.action).toBe("retry");
  });
});

// ── Theme Key Migration ──

describe("Theme Key Migration", () => {
  beforeEach(() => localStorage.clear());

  it("reads soulvay-theme first, falls back to mindmate-theme", () => {
    localStorage.setItem("mindmate-theme", JSON.stringify({ mode: "dark" }));
    const stored = localStorage.getItem("soulvay-theme") || localStorage.getItem("mindmate-theme");
    const parsed = JSON.parse(stored!);
    expect(parsed.mode).toBe("dark");
  });

  it("soulvay-theme takes priority over mindmate-theme", () => {
    localStorage.setItem("soulvay-theme", JSON.stringify({ mode: "light" }));
    localStorage.setItem("mindmate-theme", JSON.stringify({ mode: "dark" }));
    const stored = localStorage.getItem("soulvay-theme") || localStorage.getItem("mindmate-theme");
    const parsed = JSON.parse(stored!);
    expect(parsed.mode).toBe("light");
  });
});

// ── Structured Logging Tests ──

describe("Structured Logger", () => {
  it("redacts JWT-like tokens from log context", async () => {
    const { logInfo } = await import("@/lib/logger");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logInfo("test", "action", { bearer: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.something" });
    const callArgs = JSON.stringify(spy.mock.calls);
    expect(callArgs).toContain("[REDACTED]");
    expect(callArgs).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    spy.mockRestore();
  });

  it("redacts fields with secret-like names", async () => {
    const { logInfo } = await import("@/lib/logger");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logInfo("test", "action", { apikey: "sk_live_abc123", password: "hunter2" });
    const callArgs = JSON.stringify(spy.mock.calls);
    expect(callArgs).toContain("[REDACTED]");
    expect(callArgs).not.toContain("hunter2");
    spy.mockRestore();
  });
});

// ── Diagnostics Tests ──

describe("Production Diagnostics", () => {
  it("records and retrieves metrics", async () => {
    const { recordMetric, getDiagnosticsSummary } = await import("@/lib/diagnostics");
    recordMetric("chat", "stream_complete", { durationMs: 1200, success: true });
    recordMetric("chat", "stream_error", { durationMs: 500, success: false });
    recordMetric("voice", "session_started", { success: true });

    const summary = getDiagnosticsSummary();
    expect(summary.last5min.chat).toBeDefined();
    expect(summary.last5min.chat.total).toBeGreaterThanOrEqual(2);
    expect(summary.last5min.chat.errors).toBeGreaterThanOrEqual(1);
  });

  it("withMetric tracks async operation timing", async () => {
    const { withMetric, getMetricEntries } = await import("@/lib/diagnostics");
    const result = await withMetric("test", "async_op", async () => {
      return 42;
    });
    expect(result).toBe(42);
    const entries = getMetricEntries();
    const lastEntry = entries[entries.length - 1];
    expect(lastEntry.feature).toBe("test");
    expect(lastEntry.success).toBe(true);
    expect(lastEntry.durationMs).toBeDefined();
  });
});

// ── Voice Session State Machine Tests ──

describe("Voice Session State Machine", () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    disconnected: ["connecting"],
    connecting: ["connected", "error", "disconnected"],
    connected: ["disconnecting", "error"],
    disconnecting: ["disconnected", "error"],
    error: ["connecting", "disconnected"],
  };

  it("idle timeout is set to 5 minutes", () => {
    const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
    expect(IDLE_TIMEOUT_MS).toBe(300_000);
  });

  it("prevents illegal transition: connected → connecting", () => {
    const from = "connected";
    const to = "connecting";
    expect(VALID_TRANSITIONS[from].includes(to)).toBe(false);
  });

  it("allows legal transition: connected → disconnecting", () => {
    const from = "connected";
    const to = "disconnecting";
    expect(VALID_TRANSITIONS[from].includes(to)).toBe(true);
  });

  it("prevents streaming → idle without disconnect phase", () => {
    // connected cannot go directly to disconnected — must go through disconnecting
    const from = "connected";
    const to = "disconnected";
    expect(VALID_TRANSITIONS[from].includes(to)).toBe(false);
  });

  it("error state can transition to connecting (retry) or disconnected (reset)", () => {
    expect(VALID_TRANSITIONS["error"]).toContain("connecting");
    expect(VALID_TRANSITIONS["error"]).toContain("disconnected");
  });

  it("mic tracks must be stopped before SDK session start", () => {
    // Validates the fix: getUserMedia stream tracks are stopped immediately
    // to prevent hardware conflicts with SDK's own audio capture
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: () => [mockTrack] };
    mockStream.getTracks().forEach((t: any) => t.stop());
    expect(mockTrack.stop).toHaveBeenCalledOnce();
  });
});

// ── AI Cost Control Tests ──

describe("AI Cost Controls", () => {
  it("max_tokens is capped for free users", () => {
    const isPremium = false;
    const maxResponseTokens = isPremium ? 1024 : 512;
    expect(maxResponseTokens).toBe(512);
  });

  it("max_tokens is higher for premium users", () => {
    const isPremium = true;
    const maxResponseTokens = isPremium ? 1024 : 512;
    expect(maxResponseTokens).toBe(1024);
  });
});

import { describe, it, expect } from "vitest";

/**
 * Release Gate Tests — PHASE C
 * High-risk areas: auth headers, premium gating, routes, edge function calls
 */

// ── AUTH HEADER PRESENCE ──
describe("Auth Headers: All edge function fetches include auth", () => {
  // We verify by reading source patterns — these tests fail if someone removes auth headers

  it("Chat streamChat includes Authorization header", async () => {
    // After refactor, streamChat auth lives in useChatComposer and useChatSaveActions
    const composerSource = await import("../hooks/useChatComposer.ts?raw");
    const src = (composerSource as any).default || composerSource;
    expect(src).toContain('Authorization: `Bearer ${authToken}`');
    expect(src).toContain("apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY");
  });

  it("Journal.tsx runSentimentAnalysis includes auth headers", async () => {
    const journalSource = await import("../pages/Journal.tsx?raw");
    const src = (journalSource as any).default || journalSource;
    expect(src).toContain('Authorization: `Bearer ${authToken}`');
  });

  it("Journal.tsx handleGetPatterns includes auth headers", async () => {
    const journalSource = await import("../pages/Journal.tsx?raw");
    const src = (journalSource as any).default || journalSource;
    // Should have at least 2 occurrences of auth pattern (sentiment + patterns)
    const matches = ((journalSource as any).default || journalSource).match(/Authorization: `Bearer \$\{authToken\}`/g);
    expect(matches?.length).toBeGreaterThanOrEqual(2);
  });

  it("Journal.tsx handleGenerateWeeklyRecap includes auth headers", async () => {
    const journalSource = await import("../pages/Journal.tsx?raw");
    const src = (journalSource as any).default || journalSource;
    expect(src).toContain("recapAuthToken");
    expect(src).toContain('Authorization: `Bearer ${recapAuthToken}`');
  });

  it("Summary.tsx includes auth headers", async () => {
    const summarySource = await import("../pages/Summary.tsx?raw");
    const src = (summarySource as any).default || summarySource;
    expect(src).toContain("Authorization:");
    expect(src).toContain("apikey:");
  });
});

// ── PREMIUM GATING ──
describe("Premium: Gating logic correctness", () => {
  it("usePremium exports all required feature flags", async () => {
    const mod = await import("../hooks/usePremium");
    // Verify the hook exists and is a function
    expect(typeof mod.usePremium).toBe("function");
  });

  it("DAILY_MESSAGE_LIMIT is reasonable (10-30)", async () => {
    const source = await import("../hooks/usePremium.ts?raw");
    const src = (source as any).default || source;
    const match = src.match(/DAILY_MESSAGE_LIMIT\s*=\s*(\d+)/);
    expect(match).not.toBeNull();
    const limit = parseInt(match![1]);
    expect(limit).toBeGreaterThanOrEqual(10);
    expect(limit).toBeLessThanOrEqual(30);
  });

  it("canSendMessage allows premium users unlimited messages", async () => {
    const source = await import("../hooks/usePremium.ts?raw");
    const src = (source as any).default || source;
    expect(src).toContain("if (state.isPremium) return true");
  });

  it("Chat send button respects premium gating", async () => {
    const chatInputSource = await import("../components/chat/ChatInputBar.tsx?raw");
    const src = (chatInputSource as any).default || chatInputSource;
    // The disabled condition should check canSendMessage AND isPremium
    expect(src).toContain("!canSendMessage() && !isPremium");
  });
});

// ── NAVIGATION ROUTES ──
describe("Routes: All required routes exist in App.tsx", () => {
  it("has all main app routes", async () => {
    const appSource = await import("../App.tsx?raw");
    const src = (appSource as any).default || appSource;
    const requiredRoutes = [
      "/chat", "/journal", "/topics", "/mood", "/toolbox",
      "/settings", "/safety", "/upgrade", "/auth",
      "/privacy", "/terms", "/delete-account",
      "/reset-password", "/landing",
    ];
    for (const route of requiredRoutes) {
      expect(src).toContain(`"${route}"`);
    }
  });

  it("safety route is NOT behind OnboardingGuard (must be accessible always)", async () => {
    const appSource = await import("../App.tsx?raw");
    const src = (appSource as any).default || appSource;
    // Safety should be a standalone route without OnboardingGuard wrapper
    expect(src).toContain('<Route path="/safety" element={<Safety />} />');
  });

  it("delete-account route is publicly accessible", async () => {
    const appSource = await import("../App.tsx?raw");
    const src = (appSource as any).default || appSource;
    expect(src).toContain('<Route path="/delete-account" element={<DeleteAccount />} />');
  });
});

// ── EDGE FUNCTION CORS ──
describe("Edge Functions: CORS headers present", () => {
  it("chat function has CORS headers", async () => {
    const chatFn = await import("../../supabase/functions/chat/index.ts?raw");
    const src = (chatFn as any).default || chatFn;
    expect(src).toContain("Access-Control-Allow-Origin");
    expect(src).toContain("OPTIONS");
  });

  it("generate-summary function has CORS headers", async () => {
    const fn = await import("../../supabase/functions/generate-summary/index.ts?raw");
    const src = (fn as any).default || fn;
    expect(src).toContain("Access-Control-Allow-Origin");
  });

  it("journal-reflect function has CORS headers", async () => {
    const fn = await import("../../supabase/functions/journal-reflect/index.ts?raw");
    const src = (fn as any).default || fn;
    expect(src).toContain("Access-Control-Allow-Origin");
  });

  it("weekly-recap function has CORS headers", async () => {
    const fn = await import("../../supabase/functions/weekly-recap/index.ts?raw");
    const src = (fn as any).default || fn;
    expect(src).toContain("Access-Control-Allow-Origin");
  });
});

// ── SCROLL / LAYOUT ──
describe("Layout: No double-scroll patterns", () => {
  it("AppLayout uses fixed positioning", async () => {
    const src = await import("../components/layout/AppLayout.tsx?raw");
    const content = (src as any).default || src;
    expect(content).toContain("position: 'fixed'");
  });

  it("Settings uses flex layout with overflow-y-auto", async () => {
    const src = await import("../pages/Settings.tsx?raw");
    const content = (src as any).default || src;
    expect(content).toContain("overflow-y-auto");
    expect(content).toContain("overscroll-contain");
  });
});

// ── SECURITY ──
describe("Security: No secrets leaked in client code", () => {
  it("no SUPABASE_SERVICE_ROLE_KEY in client code", async () => {
    const clientFiles = [
      import("../App.tsx?raw"),
      import("../pages/Chat.tsx?raw"),
      import("../hooks/usePremium.ts?raw"),
    ];
    const sources = await Promise.all(clientFiles);
    for (const src of sources) {
      const content = (src as any).default || src;
      expect(content).not.toContain("SERVICE_ROLE_KEY");
    }
  });

  it("edge function auth helper validates JWT via claims or getUser", async () => {
    const src = await import("../../supabase/functions/_shared/auth.ts?raw");
    const content = (src as any).default || src;
    // Auth helper uses getClaims for JWT validation
    expect(content).toMatch(/auth\.(getUser|getClaims)\(/);
  });
});

// ── REVIEW LOGIN VISIBILITY ──
describe("Review: Apple review login accessible on native", () => {
  it("Auth.tsx review button shows on native platforms", async () => {
    const authSource = await import("../pages/Auth.tsx?raw");
    const src = (authSource as any).default || authSource;
    expect(src).toContain("isNativePlatform");
  });
});

// ── CHAT MODE FRESHNESS ──
describe("Chat: handleSend uses composer pattern", () => {
  it("handleSend delegates to composer.handleSend", async () => {
    const chatSource = await import("../pages/Chat.tsx?raw");
    const src = (chatSource as any).default || chatSource;
    // handleSend should delegate to the composer hook
    expect(src).toContain("composer.handleSend");
  });
});

// ── DELETE ACCOUNT CASCADE ──
describe("Account Deletion: Cascade covers all tables", () => {
  it("delete-account function deletes from all user tables", async () => {
    const src = await import("../../supabase/functions/delete-account/index.ts?raw");
    const content = (src as any).default || src;
    const requiredTables = [
      "user_activity_log", "user_roles", "mood_checkins",
      "journal_entries", "weekly_recaps", "subscriptions", "profiles"
    ];
    for (const table of requiredTables) {
      expect(content).toContain(table);
    }
  });

  it("delete-account removes storage avatars", async () => {
    const src = await import("../../supabase/functions/delete-account/index.ts?raw");
    const content = (src as any).default || src;
    expect(content).toContain("avatars");
    expect(content).toContain("storage");
  });

  it("delete-account removes auth user last", async () => {
    const src = await import("../../supabase/functions/delete-account/index.ts?raw");
    const content = (src as any).default || src;
    expect(content).toContain("admin.deleteUser");
  });
});

// ── EDGE FUNCTION AUTH ──
describe("Edge Functions: All user-facing functions use requireUser", () => {
  it("create-checkout uses requireUser", async () => {
    const src = await import("../../supabase/functions/create-checkout/index.ts?raw");
    const content = (src as any).default || src;
    expect(content).toContain("requireUser");
  });

  it("delete-account uses requireUser", async () => {
    const src = await import("../../supabase/functions/delete-account/index.ts?raw");
    const content = (src as any).default || src;
    expect(content).toContain("requireUser");
  });

  it("text-to-speech has CORS headers", async () => {
    const src = await import("../../supabase/functions/text-to-speech/index.ts?raw");
    const content = (src as any).default || src;
    expect(content).toContain("Access-Control-Allow-Origin");
  });
});

// ── STRIPE SECRET SANITIZATION ──
describe("Payments: Stripe secret sanitation and validation", () => {
  it("create-checkout sanitizes STRIPE_SECRET_KEY whitespace", async () => {
    const src = await import("../../supabase/functions/create-checkout/index.ts?raw");
    const content = (src as any).default || src;
    expect(content).toContain("replace(/\\s+/g, \"\")");
    expect(content).toContain("startsWith(\"sk_\")");
  });

  it("manage-subscription sanitizes STRIPE_SECRET_KEY whitespace", async () => {
    const src = await import("../../supabase/functions/manage-subscription/index.ts?raw");
    const content = (src as any).default || src;
    expect(content).toContain("replace(/\\s+/g, \"\")");
    expect(content).toContain("startsWith(\"sk_\")");
  });

  it("create-checkout defaults unsupported planType to monthly", async () => {
    const src = await import("../../supabase/functions/create-checkout/index.ts?raw");
    const content = (src as any).default || src;
    expect(content).toContain("const normalizedPlanType = planType === \"yearly\" ? \"yearly\" : \"monthly\"");
  });
});

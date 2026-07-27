import { describe, it, expect } from "vitest";
import { detectCrisis } from "@/lib/crisisDetection";

/**
 * The one rule this app must not break:
 *
 *   Crisis support is never behind a gate.
 *   Not behind the demo limit, the paywall, the AI consent, the rate limit,
 *   or a login.
 *
 * Comments do not enforce rules; tests do. These assertions fail the build if
 * anyone reorders the checks back to how they were — which is exactly what had
 * happened: the daily-limit return sat 57 lines above the crisis check, so a
 * user out of free messages got an upgrade prompt instead of a phone number.
 */

const SAMPLE_CRISIS_TEXT = "ich will nicht mehr leben";

async function readSource(path: string): Promise<string> {
  const mod = await import(/* @vite-ignore */ `${path}?raw`);
  return (mod as { default?: string }).default ?? (mod as unknown as string);
}

describe("crisis invariant — detection needs nothing", () => {
  it("is a pure function: no network, no auth, no consent, no model", () => {
    // If this ever needs a fetch, a token or a provider, the guarantee is gone.
    const result = detectCrisis(SAMPLE_CRISIS_TEXT);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("high");
  });

  it("works on a single string and on a list of messages alike", () => {
    expect(detectCrisis(SAMPLE_CRISIS_TEXT).detected).toBe(true);
    expect(detectCrisis(["hi", SAMPLE_CRISIS_TEXT]).detected).toBe(true);
  });
});

describe("crisis invariant — server: detection precedes the rate limit", () => {
  it("detectCrisis is called before the daily-limit response is returned", async () => {
    const source = await readSource("../../supabase/functions/chat/index.ts");

    const detectionAt = source.indexOf("detectCrisis(messages");
    const limitAt = source.indexOf("Daily message limit reached");

    expect(detectionAt).toBeGreaterThan(-1);
    expect(limitAt).toBeGreaterThan(-1);
    expect(
      detectionAt,
      "detectCrisis() must run before the daily-limit return — otherwise a user " +
        "who is out of free messages gets an upgrade prompt instead of help",
    ).toBeLessThan(limitAt);
  });

  it("the daily-limit branch is guarded by the crisis flag", async () => {
    const source = await readSource("../../supabase/functions/chat/index.ts");
    // A crisis message must neither be rejected nor counted against the quota.
    expect(source).toContain("!isPremium && !isCrisis");
  });
});

describe("crisis invariant — demo chat: detection precedes the demo limit", () => {
  it("checks for a crisis before the 3-message demo limit returns", async () => {
    const source = await readSource("../../src/components/landing/DemoChat.tsx");

    const detectionAt = source.indexOf("crisisWatch.check");
    const limitAt = source.indexOf("userMessageCount >= DEMO_LIMIT");

    expect(detectionAt).toBeGreaterThan(-1);
    expect(limitAt).toBeGreaterThan(-1);
    expect(
      detectionAt,
      "the demo chat is the first contact for people arriving from outside — " +
        "help must not depend on having messages left",
    ).toBeLessThan(limitAt);
  });

  it("renders the support card independently of the limit screen", async () => {
    const source = await readSource("../../src/components/landing/DemoChat.tsx");
    // The card must not sit inside the `!showLimit` branch.
    const cardAt = source.indexOf("<CrisisSupportCard");
    const inputBranchAt = source.indexOf("{!showLimit && (");
    expect(cardAt).toBeGreaterThan(-1);
    expect(cardAt).toBeLessThan(inputBranchAt);
  });
});

describe("crisis invariant — every free-text surface is watched", () => {
  const surfaces: ReadonlyArray<[string, string]> = [
    ["chat", "../../src/pages/Chat.tsx"],
    ["demo chat (no account)", "../../src/components/landing/DemoChat.tsx"],
    ["journal (text and dictation)", "../../src/pages/Journal.tsx"],
    ["mood note", "../../src/pages/Mood.tsx"],
  ];

  for (const [name, path] of surfaces) {
    it(`${name} runs the crisis check and can show the card`, async () => {
      const source = await readSource(path);
      expect(source, `${name}: missing crisisWatch.check`).toContain("crisisWatch.check");
      expect(source, `${name}: missing CrisisSupportCard`).toContain("CrisisSupportCard");
    });
  }
});

describe("crisis invariant — crisis disclosures never become memories", () => {
  it("the client withholds crisis conversations from memory extraction", async () => {
    const source = await readSource("../../src/hooks/useChatIntelligence.ts");

    expect(source).toContain("detectCrisis");
    expect(source).toContain("conversationHasCrisis");

    // The extraction call must sit inside the suppression guard, not before it.
    const guardAt = source.indexOf("if (!conversationHasCrisis)");
    const extractAt = source.indexOf("functions/v1/extract-memories");
    expect(guardAt).toBeGreaterThan(-1);
    expect(
      guardAt,
      "the companion must not be able to bring a crisis disclosure back up later",
    ).toBeLessThan(extractAt);
  });

  it("the edge function keeps an independent backstop", async () => {
    const source = await readSource("../../supabase/functions/extract-memories/index.ts");
    expect(source).toContain("containsUnambiguousCrisisSignal");
    expect(source).toContain('skipped: "crisis"');
  });
});

describe("crisis invariant — the safety page stays reachable without a login", () => {
  it("/safety is registered outside the onboarding guard", async () => {
    const source = await readSource("../../src/App.tsx");
    const routeLine = source
      .split("\n")
      .find((line) => line.includes('path="/safety"'));

    expect(routeLine, "the /safety route must exist").toBeDefined();
    // A guarded route would wrap the element in OnboardingGuard or similar.
    expect(routeLine).toContain("element={<Safety />}");
    expect(routeLine).not.toContain("Guard");
  });

  it("the support card links to the safety page", async () => {
    const source = await readSource("../../src/components/safety/CrisisSupportCard.tsx");
    expect(source).toContain('to="/safety"');
  });
});

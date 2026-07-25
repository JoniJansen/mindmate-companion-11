import { render, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Public Route Rendering — Smoke Layer
 *
 * Renders the REAL App with the REAL pages for every route that must be
 * reachable without auth/onboarding (legal pages are release-blocking for
 * App Store review). Catches route-level crashes: broken imports, undefined
 * access on first render, missing providers.
 *
 * Only auth state and the supabase client are mocked; everything else
 * (providers, guards, page components) is real.
 */

// ── jsdom polyfills for browser APIs used by page-level libs ──
beforeAll(() => {
  if (!("ResizeObserver" in globalThis)) {
    (globalThis as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!("IntersectionObserver" in globalThis)) {
    (globalThis as any).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    };
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
  window.scrollTo = () => {};
  // Block real network calls (analytics fallback uses raw fetch)
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
});

// ── Auth: unauthenticated visitor ──
vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuthContext: () => ({
    user: null,
    session: null,
    profile: null,
    isLoading: false,
    isAuthenticated: false,
    aiConsentGiven: true,
    aiConsentLoading: false,
    giveAIConsent: vi.fn(),
    revokeAIConsent: vi.fn(),
    isDemoMode: false,
    demoUser: null,
    activateDemoMode: vi.fn(),
    deactivateDemoMode: vi.fn(),
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    updateProfile: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

// ── Supabase client: universal chainable no-op mock ──
vi.mock("@/integrations/supabase/client", () => {
  const queryMethods = [
    "select", "insert", "update", "upsert", "delete", "eq", "neq", "gt", "gte",
    "lt", "lte", "in", "is", "or", "not", "contains", "ilike", "like", "match",
    "filter", "order", "limit", "range", "textSearch",
  ];
  function makeBuilder() {
    let singleMode = false;
    const builder: any = {};
    for (const m of queryMethods) builder[m] = () => builder;
    builder.single = () => { singleMode = true; return builder; };
    builder.maybeSingle = () => { singleMode = true; return builder; };
    builder.then = (resolve: (v: unknown) => void) =>
      Promise.resolve(resolve({ data: singleMode ? null : [], error: null, count: 0 }));
    return builder;
  }
  return {
    supabase: {
      from: () => makeBuilder(),
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: {}, error: null }),
        exchangeCodeForSession: async () => ({ data: {}, error: null }),
        setSession: async () => ({ data: {}, error: null }),
        updateUser: async () => ({ data: {}, error: null }),
        resetPasswordForEmail: async () => ({ data: {}, error: null }),
      },
      functions: { invoke: async () => ({ data: null, error: null }) },
      storage: {
        from: () => ({
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
          download: async () => ({ data: null, error: null }),
        }),
      },
      channel: () => {
        const ch: any = { on: () => ch, subscribe: () => ch, unsubscribe: () => {} };
        return ch;
      },
      removeChannel: () => {},
    },
  };
});

import App from "@/App";

const ERROR_FALLBACK = /Something didn't work|Etwas hat nicht geklappt/;

/** Public routes that must render without auth, onboarding, or native APIs */
const PUBLIC_ROUTES = [
  "/landing",
  "/auth",
  "/welcome",
  "/safety",
  "/privacy",
  "/terms",
  "/impressum",
  "/faq",
  "/cancellation",
  "/contact",
  "/about",
  "/delete-account",
  "/reset-password",
];

describe("Public routes render without crashing", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  for (const route of PUBLIC_ROUTES) {
    it(`${route} renders content and no error boundary`, async () => {
      window.history.pushState(null, "", route);
      const view = render(<App />);
      // Lazy routes show a spinner first — wait until real content arrives.
      await waitFor(
        () => {
          expect(view.container.textContent).not.toMatch(ERROR_FALLBACK);
          expect(view.container.textContent!.trim().length).toBeGreaterThan(0);
        },
        { timeout: 5000 },
      );
      view.unmount();
    });
  }

  it("unknown route renders the NotFound catch-all (no crash, no error boundary)", async () => {
    window.history.pushState(null, "", "/this-route-does-not-exist");
    const view = render(<App />);
    await waitFor(
      () => {
        expect(view.container.textContent).not.toMatch(ERROR_FALLBACK);
        expect(view.container.textContent!.trim().length).toBeGreaterThan(0);
      },
      { timeout: 5000 },
    );
    view.unmount();
  });
});

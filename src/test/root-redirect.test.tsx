import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * RootRedirect + Route Wiring — Smoke Layer
 *
 * Renders the REAL App (real RootRedirect, real OnboardingGuard, real route
 * table) with mocked auth/onboarding state and stubbed pages, and verifies:
 *   authenticated            → /home
 *   onboarded, not authed    → /auth
 *   neither                  → /landing
 *   loading                  → no redirect yet
 *   demo mode (App Review)   → funneled to /upgrade by OnboardingGuard
 */

const h = vi.hoisted(() => ({
  auth: {
    isAuthenticated: false,
    isLoading: false,
    isDemoMode: false,
    user: null as null | { id: string },
    aiConsentGiven: true,
  },
  onboarded: { value: false },
}));

vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuthContext: () => ({
    user: h.auth.user,
    session: null,
    profile: null,
    isLoading: h.auth.isLoading,
    isAuthenticated: h.auth.isAuthenticated,
    aiConsentGiven: h.auth.aiConsentGiven,
    aiConsentLoading: false,
    giveAIConsent: vi.fn(),
    revokeAIConsent: vi.fn(),
    isDemoMode: h.auth.isDemoMode,
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

vi.mock("@/hooks/useOnboardingStatus", () => ({
  useOnboardingStatus: () => ({
    hasCompletedOnboarding: () => h.onboarded.value,
    completeOnboarding: vi.fn(),
    resetOnboarding: vi.fn(),
    getTabHintsSeen: () => ({ chat: true, journal: true, topics: true, mood: true, toolbox: true }),
    markTabHintSeen: vi.fn(),
    hasSeenTabHint: () => true,
    resetTabHints: vi.fn(),
  }),
}));

// Providers/overlays that are irrelevant to redirect logic
vi.mock("@/components/tour/TourProvider", () => ({
  TourProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTour: () => ({ startTour: vi.fn(), resetTour: vi.fn(), hasCompletedTour: true }),
}));
vi.mock("@/components/gdpr/CookieConsent", () => ({ CookieConsent: () => null }));
vi.mock("@/components/gdpr/NativeCrashConsentModal", () => ({ NativeCrashConsentModal: () => null }));
vi.mock("@/components/AIConsentModal", () => ({ AIConsentModal: () => null }));
vi.mock("@/components/layout/AppLayout", async () => {
  const { Outlet } = await import("react-router-dom");
  return { AppLayout: () => <Outlet /> };
});

// Page stubs — RootRedirect targets + eager pages (keeps the module graph light)
vi.mock("@/pages/Home", () => ({ default: () => <div data-testid="home-page" /> }));
vi.mock("@/pages/Auth", () => ({ default: () => <div data-testid="auth-page" /> }));
vi.mock("@/pages/Landing", () => ({ default: () => <div data-testid="landing-page" /> }));
vi.mock("@/pages/Chat", () => ({ default: () => <div data-testid="chat-page" /> }));
vi.mock("@/pages/Onboarding", () => ({ default: () => <div data-testid="onboarding-page" /> }));
vi.mock("@/pages/Upgrade", () => ({ default: () => <div data-testid="upgrade-page" /> }));

import App from "@/App";

function renderAppAtRoot() {
  window.history.pushState(null, "", "/");
  return render(<App />);
}

describe("RootRedirect decision logic (via real App route table)", () => {
  beforeEach(() => {
    localStorage.clear();
    h.auth.isAuthenticated = false;
    h.auth.isLoading = false;
    h.auth.isDemoMode = false;
    h.auth.user = null;
  });

  it("authenticated user is redirected to /home", async () => {
    h.auth.isAuthenticated = true;
    h.auth.user = { id: "user-1" };
    h.onboarded.value = true;
    renderAppAtRoot();
    expect(await screen.findByTestId("home-page")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/home");
  });

  it("onboarded but unauthenticated user is redirected to /auth", async () => {
    h.onboarded.value = true;
    renderAppAtRoot();
    expect(await screen.findByTestId("auth-page")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/auth");
  });

  it("new user (not onboarded, not authenticated) is redirected to /landing", async () => {
    h.onboarded.value = false;
    renderAppAtRoot();
    expect(await screen.findByTestId("landing-page")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/landing");
  });

  it("shows loading state without redirecting while auth is resolving", async () => {
    h.auth.isLoading = true;
    renderAppAtRoot();
    // No redirect target should render, URL must stay at root
    await waitFor(() => expect(window.location.pathname).toBe("/"));
    expect(screen.queryByTestId("home-page")).toBeNull();
    expect(screen.queryByTestId("auth-page")).toBeNull();
    expect(screen.queryByTestId("landing-page")).toBeNull();
  });

  it("demo mode (App Review) is funneled to /upgrade by OnboardingGuard", async () => {
    // Demo mode counts as authenticated for routing → RootRedirect sends /home,
    // OnboardingGuard then funnels every non-/upgrade route to /upgrade.
    h.auth.isAuthenticated = true;
    h.auth.isDemoMode = true;
    renderAppAtRoot();
    expect(await screen.findByTestId("upgrade-page")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/upgrade");
  });
});

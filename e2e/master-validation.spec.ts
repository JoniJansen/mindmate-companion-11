import { test, expect } from "../playwright-fixture";

test("all critical pages load without errors", async ({ page }) => {
  const pages = [
    "/landing", "/auth", "/auth?from=onboarding",
    "/terms", "/privacy", "/impressum", "/contact",
    "/safety", "/faq", "/upgrade",
  ];
  for (const url of pages) {
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
    expect(response?.status()).toBeLessThan(400);
  }
});

test("auth page shows both Google and Apple OAuth on web", async ({ page }) => {
  await page.goto("/auth", { waitUntil: "networkidle" });
  await expect(page.getByText(/Mit Google fortfahren|Continue with Google/)).toBeVisible();
  await expect(page.getByText(/Mit Apple fortfahren|Continue with Apple/)).toBeVisible();
  await expect(page.getByText(/oder|or/i)).toBeVisible();
});

test("auth page layout works on small mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 550 });
  await page.goto("/auth", { waitUntil: "networkidle" });
  
  // Logo should be visible (not clipped)
  const logo = page.locator('img[alt="Soulvay Assistant"]');
  await expect(logo).toBeVisible();
  
  // Scroll to bottom - buttons should be reachable
  await page.evaluate(() => {
    const sc = document.querySelector('.overflow-y-auto');
    if (sc) sc.scrollTop = sc.scrollHeight;
  });
  await page.waitForTimeout(300);
  
  await expect(page.getByText(/Mit Google fortfahren|Continue with Google/)).toBeVisible();
});

test("auth signup mode shows OAuth buttons", async ({ page }) => {
  await page.goto("/auth?from=onboarding", { waitUntil: "networkidle" });
  await expect(page.getByText(/Mit Google fortfahren|Continue with Google/)).toBeVisible();
  await expect(page.getByText(/Mit Apple fortfahren|Continue with Apple/)).toBeVisible();
});

test("landing page loads and has CTA", async ({ page }) => {
  await page.goto("/landing", { waitUntil: "networkidle" });
  await expect(page.getByText(/Starte deine Reise|Start Your Journey/)).toBeVisible();
});

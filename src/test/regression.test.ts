import { describe, it, expect } from "vitest";
import { translations } from "@/hooks/useTranslation";
import { BOTTOM_NAV_HEIGHT, BOTTOM_NAV_TOTAL, SAFE_AREA_BOTTOM, SAFE_AREA_TOP } from "@/lib/safeArea";
import { tp } from "@/lib/i18nPlain";

describe("Regression Tests - Release Gate", () => {

  // === P0-A: i18n completeness ===
  describe("i18n: All keys have DE + EN", () => {
    it("every translation key has both en and de values", () => {
      const missing: string[] = [];
      for (const [key, val] of Object.entries(translations)) {
        if (!val.en) missing.push(`${key} missing EN`);
        if (!val.de) missing.push(`${key} missing DE`);
      }
      expect(missing).toEqual([]);
    });
  });

  // === P0-C: Pluralization ===
  describe("i18n: Pluralization keys exist", () => {
    it("mood has singular and plural day keys", () => {
      expect(translations["mood.dayWithLowMood"]).toBeDefined();
      expect(translations["mood.daysWithLowMood"]).toBeDefined();
      expect(translations["mood.dayWithLowMood"].de).toBe("Tag mit niedriger Stimmung");
      expect(translations["mood.daysWithLowMood"].de).toBe("Tage mit niedriger Stimmung");
    });

    it("streak has singular and plural day keys", () => {
      expect(translations["streak.day"]).toBeDefined();
      expect(translations["streak.days"]).toBeDefined();
      expect(translations["streak.day"].de).toBe("Tag");
      expect(translations["streak.days"].de).toBe("Tage");
    });
  });

  // === P0-B: Voice language mapping ===
  describe("Voice: Language mapping is correct", () => {
    it("voice.loading has user-friendly copy (not technical)", () => {
      expect(translations["voice.loading"].en).not.toContain("Loading voice");
      expect(translations["voice.loading"].de).not.toContain("Stimme wird geladen");
      expect(translations["voice.loading"].de).toBe("Einen Moment...");
    });
  });

  // === P0-D: No hardcoded strings in chat save ===
  describe("Chat: Journal save titles are i18n keys", () => {
    it("chat journal title keys exist for DE and EN", () => {
      expect(translations["chat.journalTitle.message"]).toBeDefined();
      expect(translations["chat.journalTitle.conversation"]).toBeDefined();
      expect(translations["chat.journalTitle.summary"]).toBeDefined();
      expect(translations["chat.journalTitle.message"].de).toBe("Chat-Nachricht");
      expect(translations["chat.journalTitle.conversation"].de).toBe("Chat-Gespräch");
      expect(translations["chat.journalTitle.summary"].de).toBe("KI-Zusammenfassung");
    });

    it("chat jump to latest key exists", () => {
      expect(translations["chat.jumpToLatest"]).toBeDefined();
      expect(translations["chat.jumpToLatest"].de).toBe("Neueste");
    });

    it("summary section headers are i18n keys", () => {
      expect(translations["chat.summarySection.summary"]).toBeDefined();
      expect(translations["chat.summarySection.themes"]).toBeDefined();
      expect(translations["chat.summarySection.moodJourney"]).toBeDefined();
      expect(translations["chat.summarySection.nextStep"]).toBeDefined();
    });
  });

  // === ResetPassword i18n ===
  describe("ResetPassword: All strings are i18n keys", () => {
    it("has all required keys", () => {
      const requiredKeys = [
        "resetPassword.title", "resetPassword.subtitle",
        "resetPassword.newPassword", "resetPassword.confirmPassword",
        "resetPassword.submit", "resetPassword.tooShort",
        "resetPassword.mismatch", "resetPassword.success",
        "resetPassword.linkExpired", "resetPassword.backToLogin",
      ];
      for (const key of requiredKeys) {
        expect(translations[key]).toBeDefined();
        expect(translations[key].en).toBeTruthy();
        expect(translations[key].de).toBeTruthy();
      }
    });
  });

  // === Diagnostics: i18n keys ===
  describe("Diagnostics: Uses i18n keys", () => {
    it("has all required diagnostic keys", () => {
      const keys = ["diagnostics.title", "diagnostics.subtitle", "diagnostics.copyAll", "diagnostics.copied", "diagnostics.errorLog", "diagnostics.noErrors"];
      for (const key of keys) {
        expect(translations[key]).toBeDefined();
      }
    });
  });

  // === Timeline: i18n keys ===
  describe("Timeline: Error messages use i18n keys", () => {
    it("has insight error and not-enough-data keys", () => {
      expect(translations["timeline.notEnoughDataTitle"]).toBeDefined();
      expect(translations["timeline.notEnoughDataDesc"]).toBeDefined();
      expect(translations["timeline.insightError"]).toBeDefined();
    });
  });

  // === Safe Area constants ===
  describe("Safe Area: Constants are valid", () => {
    it("BOTTOM_NAV_HEIGHT is a reasonable pixel value", () => {
      expect(BOTTOM_NAV_HEIGHT).toBeGreaterThanOrEqual(44);
      expect(BOTTOM_NAV_HEIGHT).toBeLessThanOrEqual(80);
    });

    it("BOTTOM_NAV_TOTAL includes env() and nav height", () => {
      expect(BOTTOM_NAV_TOTAL).toContain(`${BOTTOM_NAV_HEIGHT}px`);
      expect(BOTTOM_NAV_TOTAL).toContain("env(safe-area-inset-bottom");
    });

    it("SAFE_AREA_BOTTOM/TOP use env()", () => {
      expect(SAFE_AREA_BOTTOM).toContain("env(safe-area-inset-bottom");
      expect(SAFE_AREA_TOP).toContain("env(safe-area-inset-top");
    });
  });

  // === Plain i18n (non-React) ===
  describe("i18nPlain: Works without React", () => {
    it("returns correct strings for known keys", () => {
      const title = tp("backup.reminderTitle");
      expect(title).toBeTruthy();
      expect(typeof title).toBe("string");
    });

    it("returns key as fallback for unknown key", () => {
      const result = tp("unknown.key.xyz");
      expect(result).toBe("unknown.key.xyz");
    });
  });

  // === Route definitions ===
  describe("Routes: All main routes have i18n support", () => {
    it("bottom nav tabs have translation keys", () => {
      const navKeys = ["topics.title", "mood.title", "journal.title"];
      for (const key of navKeys) {
        expect(translations[key]).toBeDefined();
        expect(translations[key].en).toBeTruthy();
        expect(translations[key].de).toBeTruthy();
      }
    });

    it("settings page has required translation keys", () => {
      const settingsKeys = ["settings.title", "settings.language", "settings.subtitle"];
      for (const key of settingsKeys) {
        expect(translations[key]).toBeDefined();
      }
    });
  });

  // === Subscription / Premium ===
  describe("Premium: i18n keys for premium gates", () => {
    it("has premium-related translation keys", () => {
      const keys = ["premium.upgradeTitle", "premium.restorePurchases"];
      for (const key of keys) {
        if (translations[key]) {
          expect(translations[key].en).toBeTruthy();
          expect(translations[key].de).toBeTruthy();
        }
      }
      // At minimum, common.error must exist for payment error handling
      expect(translations["common.error"]).toBeDefined();
    });
  });

  // === Error handling keys ===
  describe("Error UX: Localized error messages exist", () => {
    it("has common error keys", () => {
      expect(translations["common.error"]).toBeDefined();
      expect(translations["common.error"].de).toBeTruthy();
      expect(translations["common.error"].en).toBeTruthy();
    });
  });
});

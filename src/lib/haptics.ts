/**
 * Subtle haptic feedback for native builds (iOS/Android).
 *
 * - No-op on web: `isNativeApp()` gate + dynamic plugin import, so the web
 *   bundle never loads @capacitor/haptics and jsdom tests never touch it.
 * - Defensive: haptics are pure polish and must never surface an error.
 * - Keep it subtle: light for frequent actions (e.g. sending a message),
 *   medium for meaningful completions, success only for rare milestones
 *   (e.g. a purchase). Never use haptics for errors or attention-grabbing.
 */
import { isNativeApp } from "@/lib/nativeDetect";

export type HapticImpactStyle = "light" | "medium";

/** Fire-and-forget impact haptic. Safe to call anywhere, on any platform. */
export async function hapticImpact(style: HapticImpactStyle = "light"): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({
      style: style === "medium" ? ImpactStyle.Medium : ImpactStyle.Light,
    });
  } catch {
    // Haptics are progressive enhancement — never break the app.
  }
}

/** Gentle "success" notification haptic for rare positive milestones. */
export async function hapticSuccess(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Haptics are progressive enhancement — never break the app.
  }
}

import { Capacitor } from "@capacitor/core";

// Muss zu --background in src/index.css passen (light: 0 0% 98%, dark: 160 10% 7%)
const LIGHT_BG = "#FAFAFA";
const DARK_BG = "#101413";

export async function syncStatusBarWithTheme(isDark: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    // Style.Light = heller Hintergrund mit dunklen Icons, Style.Dark = umgekehrt
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: isDark ? DARK_BG : LIGHT_BG });
    }
  } catch {
    // Statusleisten-Styling ist rein kosmetisch — darf die App nie brechen.
  }
}

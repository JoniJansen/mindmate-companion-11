import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Internal bundle ID stays "mindmate" — the app predates the Soulvay rebrand
  // and all App Store Connect history, screenshots, IAP products and 40+ builds
  // are tied to this identifier. The user-facing app name is "Soulvay".
  appId: "com.jonathanjansen.mindmate",
  appName: "Soulvay",
  webDir: "dist",
  server: {
    // DEV MODE: Uncomment for live-reload during development
    // url: "https://dc1f3645-7930-4a62-8f99-9c8b700fe75a.lovableproject.com?forceHideBadge=true",
    // cleartext: true
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#000000",
    scheme: "Soulvay",
    preferredContentMode: "mobile",
    // Smooth keyboard handling
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1a1a1a",
      showSpinner: false,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
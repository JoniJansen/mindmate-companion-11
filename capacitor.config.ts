import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.jonathanjansen.soulvay",
  appName: "Soulvay",
  webDir: "dist",
  server: {
    hostname: "localhost",
    // DEV MODE: Uncomment for live-reload during development
    // url: "https://dc1f3645-7930-4a62-8f99-9c8b700fe75a.lovableproject.com?forceHideBadge=true",
    // cleartext: true
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#000000",
    scheme: "Soulvay",
    preferredContentMode: "mobile",
    scrollEnabled: true,
  },
  // Ensure Info.plist includes ITSAppUsesNonExemptEncryption = false
  // This must be added manually to ios/App/App/Info.plist:
  // <key>ITSAppUsesNonExemptEncryption</key><false/>
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
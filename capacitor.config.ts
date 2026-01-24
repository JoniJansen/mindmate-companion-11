import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "de.mindmate.app",
  appName: "MindMate",
  webDir: "dist",
  server: {
    // For development - comment out for production build
    // url: "https://dc1f3645-7930-4a62-8f99-9c8b700fe75a.lovableproject.com?forceHideBadge=true",
    // cleartext: true
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0f172a",
    scheme: "MindMate",
    preferredContentMode: "mobile"
  },
  android: {
    backgroundColor: "#0f172a"
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0f172a",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0f172a"
    }
  }
};

export default config;
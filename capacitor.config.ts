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
    // Use black for native feel - works better with dark mode
    // The web app handles its own background color dynamically
    backgroundColor: "#000000",
    scheme: "MindMate",
    preferredContentMode: "mobile"
  },
  android: {
    // Use black for native feel - works better with dark mode
    backgroundColor: "#000000"
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      // Keep splash screen neutral
      backgroundColor: "#1a1a1a",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000"
    }
  }
};

export default config;
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
    // Use transparent or match the app background - not dark blue
    backgroundColor: "#f8f6f4",
    scheme: "MindMate",
    preferredContentMode: "mobile"
  },
  android: {
    backgroundColor: "#f8f6f4"
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#f8f6f4",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#f8f6f4"
    }
  }
};

export default config;
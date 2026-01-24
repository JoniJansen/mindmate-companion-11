import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.dc1f364579304a628f999c8b700fe75a",
  appName: "MindMate",
  webDir: "dist",
  server: {
    url: "https://dc1f3645-7930-4a62-8f99-9c8b700fe75a.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  ios: {
    contentInset: "automatic"
  },
  android: {
    backgroundColor: "#0f172a"
  }
};

export default config;

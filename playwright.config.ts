import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "https://id-preview--dc1f3645-7930-4a62-8f99-9c8b700fe75a.lovable.app",
  },
});

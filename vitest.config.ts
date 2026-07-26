import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      // Without these, build artefacts and vendored bundles are counted as
      // uncovered source and the headline number becomes meaningless.
      exclude: [
        "**/node_modules/**",
        ".claude/worktrees/**",
        "dist/**",
        "coverage/**",
        "public/assets/**",
        "android/**",
        "ios/**",
        "**/*.config.{ts,js}",
        "src/test/**",
        "e2e/**",
        // Deno edge functions are never executed by this suite — some tests
        // load them via `?raw` and assert on the source string. v8 then
        // reports them as 100 % covered, which is worse than no signal: the
        // crisis-detection path in chat/index.ts showed "100 %" while not a
        // single line of it ever ran. Excluded so the number stays honest.
        "supabase/**",
      ],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

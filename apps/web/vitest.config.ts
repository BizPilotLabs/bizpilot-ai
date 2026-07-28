import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@/components": resolve(__dirname, "src/components"),
      "@/features": resolve(__dirname, "src/features"),
      "@/services": resolve(__dirname, "src/services"),
      "@/hooks": resolve(__dirname, "src/hooks"),
      "@/store": resolve(__dirname, "src/store"),
      "@/lib": resolve(__dirname, "src/lib"),
      "@/utils": resolve(__dirname, "src/utils")
    }
  },
  test: {
    environment: "jsdom",
    pool: "forks",
    globals: false,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/test/setup.ts"],
    restoreMocks: true,
    clearMocks: true,
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      exclude: [
        "dist/**",
        "node_modules/**",
        "coverage/**",
        "src/test/**",
        "**/*.config.ts",
        "**/*.config.js",
        "vitest.config.ts",
        "vite.config.ts",
        "eslint.config.js",
        "postcss.config.js",
        "tailwind.config.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/*.types.ts"
      ]
    }
  }
});




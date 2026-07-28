import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup/env.ts"],
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      exclude: [
        "dist/**",
        "node_modules/**",
        "prisma/**",
        "tests/**",
        "**/*.config.ts",
        "vitest.config.ts",
        "src/server.ts",
        "src/docs/**",
        "src/**/*.types.ts"
      ]
    }
  }
});


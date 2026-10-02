import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    maxWorkers: 2,
    exclude: ["**/node_modules/**", "**/e2e/**", ".kilo/**"],
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          globals: true,
          setupFiles: ["./__tests__/setup.ts"],
          include: ["__tests__/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./__tests__/setup.ts", "./__tests__/setup-dom.ts"],
          include: ["__tests__/**/*.test.tsx"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/**", "e2e/**", "**/*.config.*", "**/*.d.ts", ".next/**", ".kilo/**"],
    },
  },
});

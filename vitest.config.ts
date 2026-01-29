import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "happy-dom",
      setupFiles: ["./test/setup.ts"],
      exclude: ["**/node_modules/**", "**/e2e/**"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "test/",
          "**/*.config.{ts,js}",
          "**/types.ts",
          "src/blocks/blocks.json",
        ],
      },
    },
  })
);

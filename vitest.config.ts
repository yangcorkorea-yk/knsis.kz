import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "_archive", "docs/prototype", "tests/e2e"],
    globals: false,
  },
  resolve: {
    alias: {
      // Mirror tsconfig.json paths.@/* so imports work in vitest too.
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});

import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        "~": "/src"
      }
    }
  },
  server: {
    compatibilityDate: "2026-06-18"
  }
});

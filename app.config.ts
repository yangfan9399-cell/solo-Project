import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3100,
  },
  build: {
    outDir: "dist",
    target: "esnext",
  },
});

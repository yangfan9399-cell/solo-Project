import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 3100,
  },
  build: {
    outDir: "dist",
    target: "esnext",
  },
});

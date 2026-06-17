import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3000,
    host: true,
    fs: { allow: [".."] },
  },
  build: {
    target: "esnext",
    rollupOptions: {
      external: [],
    },
  },
  optimizeDeps: {
    disabled: true,
  },
});

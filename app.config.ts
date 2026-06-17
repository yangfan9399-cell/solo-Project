import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  ssr: false,
  server: {
    preset: "node-server",
  },
  vite: {
    server: {
      port: 3100,
    },
  },
});

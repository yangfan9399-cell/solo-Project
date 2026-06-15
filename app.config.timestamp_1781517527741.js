// app.config.ts
import { defineConfig } from "@solidjs/start/config";
var app_config_default = defineConfig({
  server: {
    preset: "node-server"
  },
  vite: {
    ssr: {
      external: ["better-sqlite3"]
    }
  }
});
export {
  app_config_default as default
};

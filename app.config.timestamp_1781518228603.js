// app.config.ts
import { defineConfig } from "@solidjs/start/config";
import { fileURLToPath } from "url";
import path from "path";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var app_config_default = defineConfig({
  server: {
    preset: "node-server"
  },
  vite: {
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./src")
      }
    },
    ssr: {
      external: ["better-sqlite3"]
    }
  }
});
export {
  app_config_default as default
};

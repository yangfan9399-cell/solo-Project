// app.config.ts
import { defineConfig } from "@solidjs/start/config";
var app_config_default = defineConfig({
  ssr: false,
  server: {
    preset: "static"
  },
  vite: {
    server: {
      port: 3100
    }
  }
});
export {
  app_config_default as default
};

// app.config.ts
import { defineConfig } from "@solidjs/start/config";
var app_config_default = defineConfig({
  ssr: false,
  server: {
    preset: "static",
    base: "./"
  }
});
export {
  app_config_default as default
};

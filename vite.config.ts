import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [remix()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
    },
  },
});

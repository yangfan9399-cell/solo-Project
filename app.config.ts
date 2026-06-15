import { defineConfig } from "@solidjs/start/config";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
      external: ["sql.js"]
    }
  }
});

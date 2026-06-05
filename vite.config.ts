import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    // @ts-expect-error react-router plugin types are incomplete
    reactRouter({
      routes: {
        appDir: "app",
        define: "app/routes.ts",
      },
    }),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
    },
  },
});

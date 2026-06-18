import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { apiMiddleware } from "./src/server/api";

export default defineConfig({
  plugins: [solidPlugin(), apiMiddleware()],
  server: { port: 5173 }
});

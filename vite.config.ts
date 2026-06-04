import { defineConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
  return {
    plugins: [qwikCity(), qwikVite(), tsconfigPaths()],
    server: {
      headers: {
        "Cache-Control": "public, max-age=0",
      },
      port: 5173,
    },
    preview: {
      headers: {
        "Cache-Control": "public, max-age=600",
      },
    },
    ssr: {
      noExternal: ["@prisma/client"],
    },
  };
});

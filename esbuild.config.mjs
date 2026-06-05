import esbuild from "esbuild";
import { createServer, request } from "http";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== "production";

const esbuildOptions = {
  entryPoints: [path.resolve(__dirname, "src/main.tsx")],
  bundle: true,
  outfile: path.resolve(__dirname, "dist/client/index.js"),
  minify: !isDev,
  sourcemap: isDev,
  target: "es2020",
  loader: {
    ".ts": "ts",
    ".tsx": "tsx",
    ".css": "css",
    ".json": "json",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(isDev ? "development" : "production"),
  },
  jsx: "automatic",
  jsxImportSource: "react",
  logLevel: "info",
};

async function build() {
  console.log("🔨 Building frontend...");
  try {
    if (isDev) {
      const ctx = await esbuild.context(esbuildOptions);
      await ctx.watch();
      console.log("👀 Watching for changes...");
      return ctx;
    } else {
      await esbuild.build(esbuildOptions);
      console.log("✅ Build complete!");
      return null;
    }
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

if (isDev) {
  build();
} else {
  build();
}

export { build, esbuildOptions };

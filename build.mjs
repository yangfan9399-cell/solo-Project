import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { transformSync } from "@babel/core";
import solidPreset from "babel-preset-solid";

function solidPlugin() {
  return {
    name: "solid",
    setup(build) {
      build.onLoad({ filter: /\.[jt]sx$/ }, async (args) => {
        const src = await fs.promises.readFile(args.path, "utf8");
        const result = transformSync(src, {
          presets: ["@babel/preset-typescript", [solidPreset, { generate: "dom", hydratable: false }]],
          filename: args.path
        });
        return { contents: result.code, loader: "js" };
      });
    }
  };
}

function cssPlugin() {
  return {
    name: "css-import",
    setup(build) {
      build.onResolve({ filter: /\.css$/ }, (args) => ({
        path: path.resolve(args.resolveDir, args.path),
        namespace: "css-file"
      }));
      build.onLoad({ filter: /.*/, namespace: "css-file" }, () => ({
        contents: "",
        loader: "js"
      }));
    }
  };
}

await esbuild.build({
  entryPoints: ["src/entry-client.tsx"],
  bundle: true,
  outdir: "dist",
  format: "esm",
  target: "es2022",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [solidPlugin(), cssPlugin()]
});

console.log("Build complete \u2192 dist/");

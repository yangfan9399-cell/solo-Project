import * as esbuild from "esbuild";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { transformSync } from "@babel/core";
import solidPreset from "babel-preset-solid";

const PORT = 5173;
const OUTDIR = path.resolve("dist-dev");

await esbuild.build({
  entryPoints: ["src/server/entry.ts"],
  bundle: true,
  outfile: path.join(OUTDIR, "server-api.js"),
  format: "esm",
  platform: "node",
  target: "es2022",
  logLevel: "info",
  packages: "external"
});

function solidPlugin() {
  return {
    name: "solid",
    setup(build) {
      build.onLoad({ filter: /\.[jt]sx$/ }, async (args) => {
        const src = await fs.promises.readFile(args.path, "utf8");
        const result = transformSync(src, {
          presets: ["@babel/preset-typescript", [solidPreset, { generate: "dom", hydratable: false }]],
          filename: args.path,
          sourceMaps: "inline"
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

const clientCtx = await esbuild.context({
  entryPoints: ["src/entry-client.tsx"],
  bundle: true,
  outdir: OUTDIR,
  format: "esm",
  target: "es2022",
  sourcemap: true,
  define: { "process.env.NODE_ENV": '"development"' },
  logLevel: "info",
  plugins: [solidPlugin(), cssPlugin()]
});

await clientCtx.watch();

const { store } = await import(path.join(OUTDIR, "server-api.js"));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const INDEX_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>古籍避讳字替换审读工具</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>典</text></svg>">
  <link rel="stylesheet" href="/src/styles/app.css">
</head>
<body>
  <div id="app"></div>
  <script src="/dist-dev/entry-client.js" type="module"></script>
</body>
</html>`;

function readBody(req) {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => resolve(d));
  });
}

function jsonRes(data, status = 200) {
  return { status, body: JSON.stringify(data), headers: { "Content-Type": "application/json" } };
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);

  if (urlPath.startsWith("/api/")) {
    handleApi(req, urlPath, urlObj).then((result) => {
      res.statusCode = result.status;
      for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v);
      res.end(result.body);
    }).catch((e) => {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: e.message }));
    });
    return;
  }

  if (urlPath === "/" || urlPath === "/index.html") {
    res.setHeader("Content-Type", MIME[".html"]);
    res.end(INDEX_HTML);
    return;
  }

  if (urlPath.startsWith("/dist-dev/")) {
    const fp = path.resolve(urlPath.slice(1));
    if (fs.existsSync(fp)) {
      const ext = path.extname(fp);
      res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
      fs.createReadStream(fp).pipe(res);
      return;
    }
  }

  if (urlPath.startsWith("/src/")) {
    const fp = path.resolve(urlPath.slice(1));
    if (fs.existsSync(fp)) {
      const ext = path.extname(fp);
      res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
      fs.createReadStream(fp).pipe(res);
      return;
    }
  }

  if (!urlPath.includes(".")) {
    res.setHeader("Content-Type", MIME[".html"]);
    res.end(INDEX_HTML);
    return;
  }

  res.statusCode = 404;
  res.end("Not found");
});

async function handleApi(req, pathname, url) {
  const method = req.method.toUpperCase();

  if (pathname === "/api/stats") return jsonRes(store.getStats());
  if (pathname === "/api/rules") return jsonRes(store.getAllDynastyRules());

  if (pathname === "/api/projects") {
    if (method === "GET") {
      const id = url.searchParams.get("id");
      return jsonRes(id ? store.getProject(id) : store.getAllProjects());
    }
    const body = JSON.parse(await readBody(req));
    if (body?.op === "filter") return jsonRes(store.filterProjects({
      search: body.search ?? "", status: body.status ?? [], dynasty: body.dynasty ?? [],
      priority: body.priority ?? [], assignee: body.assignee ?? [],
      hasAnomaly: body.hasAnomaly ?? null, dateFrom: body.dateFrom, dateTo: body.dateTo, tags: body.tags ?? []
    }));
    return jsonRes(store.createProject(body));
  }

  const projMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (projMatch) {
    const id = projMatch[1];
    if (method === "PATCH") { const body = JSON.parse(await readBody(req)); return jsonRes(store.updateProject(id, body)); }
    return jsonRes(store.getProject(id));
  }

  const repMatch = pathname.match(/^\/api\/projects\/([^/]+)\/replacements$/);
  if (repMatch) return jsonRes(store.getReplacements(repMatch[1]));

  const verMatch = pathname.match(/^\/api\/projects\/([^/]+)\/versions$/);
  if (verMatch) {
    if (method === "POST") {
      const body = JSON.parse(await readBody(req));
      return jsonRes(store.createVersion({
        projectId: verMatch[1], versionNumber: body.versionNumber, batchId: body.batchId,
        createdBy: body.createdBy, snapshot: body.snapshot, replacementsSnapshot: body.replacementsSnapshot,
        changeSummary: body.changeSummary, comment: body.comment
      }));
    }
    return jsonRes(store.getVersions(verMatch[1]));
  }

  const annMatch = pathname.match(/^\/api\/projects\/([^/]+)\/annotations$/);
  if (annMatch) {
    if (method === "POST") {
      const body = JSON.parse(await readBody(req));
      if (body?.op === "resolve") return jsonRes(store.resolveAnnotation(body.annotationId, body.resolver));
      return jsonRes(store.createAnnotation({
        projectId: annMatch[1], replacementId: body.replacementId,
        position: body.position ?? 0, type: body.type ?? "comment",
        content: body.content, author: body.author, resolved: false
      }));
    }
    return jsonRes(store.getAnnotations(annMatch[1]));
  }

  const replMatch = pathname.match(/^\/api\/replacements\/([^/]+)$/);
  if (replMatch) {
    if (method === "PATCH") { const body = JSON.parse(await readBody(req)); return jsonRes(store.updateReplacement(replMatch[1], body)); }
    return jsonRes(store.getReplacement(replMatch[1]));
  }

  if (pathname === "/api/anomalies") {
    if (method === "POST") {
      const body = JSON.parse(await readBody(req));
      if (body?.op === "resolve") return jsonRes(store.resolveAnomaly(body.id));
      return jsonRes(null);
    }
    const pid = url.searchParams.get("projectId");
    return jsonRes(store.getAnomalies(pid || undefined));
  }

  if (pathname === "/api/exports") {
    if (method === "POST") {
      const body = JSON.parse(await readBody(req));
      return jsonRes(store.createExport({
        projectId: body.projectId, versionId: body.versionId,
        exportedBy: body.exportedBy, format: body.format,
        summaryContent: body.summaryContent, stats: body.stats
      }));
    }
    const pid = url.searchParams.get("projectId");
    return jsonRes(store.getExportSummaries(pid || undefined));
  }

  return jsonRes({ error: "Not found" }, 404);
}

server.listen(PORT, () => {
  console.log(`\n  \u{1F3DB}  古籍避讳字替换审读工具  \u2192  http://localhost:${PORT}\n`);
});

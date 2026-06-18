import store from "../data/store";
import type { FilterOptions, Project, ProjectVersion, Annotation, ExportSummary } from "../types";

type Handler = (req: Request, params: Record<string, string>) => Promise<Response> | Response;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function body<T>(req: Request): Promise<T> {
  return (await req.json()) as T;
}

const routes: [RegExp, Handler][] = [
  [/^\/api\/stats$/, async () => json(store.getStats())],

  [/^\/api\/rules$/, async () => json(store.getAllDynastyRules())],

  [/^\/api\/projects$/, async (req) => {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      return json(id ? store.getProject(id) : store.getAllProjects());
    }
    const b = await body<any>(req);
    if (b?.op === "filter") {
      const opts: FilterOptions = {
        search: b.search ?? "", status: b.status ?? [], dynasty: b.dynasty ?? [],
        priority: b.priority ?? [], assignee: b.assignee ?? [],
        hasAnomaly: b.hasAnomaly ?? null, dateFrom: b.dateFrom, dateTo: b.dateTo, tags: b.tags ?? []
      };
      return json(store.filterProjects(opts));
    }
    return json(store.createProject(b as Omit<Project, "id" | "createdAt" | "updatedAt">));
  }],

  [/^\/api\/projects\/([^/]+)$/, async (req, p) => {
    if (req.method === "PATCH") {
      const b = await body<any>(req);
      return json(store.updateProject(p[0], b));
    }
    return json(store.getProject(p[0]));
  }],

  [/^\/api\/projects\/([^/]+)\/replacements$/, async (_req, p) => {
    return json(store.getReplacements(p[0]));
  }],

  [/^\/api\/projects\/([^/]+)\/versions$/, async (req, p) => {
    if (req.method === "POST") {
      const b = await body<any>(req);
      const data: Omit<ProjectVersion, "id" | "createdAt"> = {
        projectId: p[0], versionNumber: b.versionNumber, batchId: b.batchId,
        createdBy: b.createdBy, snapshot: b.snapshot,
        replacementsSnapshot: b.replacementsSnapshot,
        changeSummary: b.changeSummary, comment: b.comment
      };
      return json(store.createVersion(data));
    }
    return json(store.getVersions(p[0]));
  }],

  [/^\/api\/projects\/([^/]+)\/annotations$/, async (req, p) => {
    if (req.method === "POST") {
      const b = await body<any>(req);
      if (b?.op === "resolve") {
        return json(store.resolveAnnotation(b.annotationId, b.resolver));
      }
      const data: Omit<Annotation, "id" | "createdAt"> = {
        projectId: p[0], replacementId: b.replacementId,
        position: b.position ?? 0, type: b.type ?? "comment",
        content: b.content, author: b.author, resolved: false
      };
      return json(store.createAnnotation(data));
    }
    return json(store.getAnnotations(p[0]));
  }],

  [/^\/api\/replacements\/([^/]+)$/, async (req, p) => {
    if (req.method === "PATCH") {
      const b = await body<any>(req);
      return json(store.updateReplacement(p[0], b));
    }
    return json(store.getReplacement(p[0]));
  }],

  [/^\/api\/anomalies$/, async (req) => {
    if (req.method === "POST") {
      const b = await body<any>(req);
      if (b?.op === "resolve") return json(store.resolveAnomaly(b.id));
      return json(null);
    }
    const url = new URL(req.url);
    const pid = url.searchParams.get("projectId");
    return json(store.getAnomalies(pid || undefined));
  }],

  [/^\/api\/exports$/, async (req) => {
    if (req.method === "POST") {
      const b = await body<any>(req);
      const data: Omit<ExportSummary, "id" | "exportedAt"> = {
        projectId: b.projectId, versionId: b.versionId,
        exportedBy: b.exportedBy, format: b.format,
        summaryContent: b.summaryContent, stats: b.stats
      };
      return json(store.createExport(data));
    }
    const url = new URL(req.url);
    const pid = url.searchParams.get("projectId");
    return json(store.getExportSummaries(pid || undefined));
  }],
];

export function apiMiddleware() {
  return {
    name: "api-middleware",
    async configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith("/api/")) return next();
        try {
          const url = `${req.headers.origin || "http://localhost:5173"}${req.url}`;
          const method = (req.method || "GET").toUpperCase();
          for (const [pattern, handler] of routes) {
            const m = req.url.match(pattern);
            if (m) {
              const params = m.slice(1);
              const request = new Request(url, {
                method,
                headers: req.headers as HeadersInit,
                body: ["POST", "PATCH", "PUT"].includes(method)
                  ? await new Promise<string>((resolve) => {
                      let d = "";
                      req.on("data", (c: Buffer) => (d += c));
                      req.on("end", () => resolve(d));
                    })
                  : undefined
              });
              const resp = await handler(request, params);
              res.statusCode = resp.status;
              resp.headers.forEach((v: string, k: string) => res.setHeader(k, v));
              res.end(await resp.text());
              return;
            }
          }
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Not found" }));
        } catch (e: any) {
          console.error("API error:", e);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    }
  };
}

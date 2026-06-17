import { defineEventHandler, readBody } from "vinxi/server";
import store from "../../data/store";
import type { ExportSummary } from "../../types";

export const GET = defineEventHandler((event) => {
  const url = new URL(event.node.req.url!, "http://x");
  const projectId = url.searchParams.get("projectId");
  return store.getExportSummaries(projectId || undefined);
});

export const POST = defineEventHandler(async (event) => {
  const body = await readBody();
  const data: Omit<ExportSummary, "id" | "exportedAt"> = {
    projectId: body.projectId,
    versionId: body.versionId,
    exportedBy: body.exportedBy,
    format: body.format,
    summaryContent: body.summaryContent,
    stats: body.stats
  };
  return store.createExport(data);
});

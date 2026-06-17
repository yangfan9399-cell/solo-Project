import { defineEventHandler, readBody } from "vinxi/server";
import store from "../../data/store";

export const GET = defineEventHandler((event) => {
  const url = new URL(event.node.req.url!, "http://x");
  const projectId = url.searchParams.get("projectId");
  return store.getAnomalies(projectId || undefined);
});

export const POST = defineEventHandler(async (event) => {
  const body = await readBody();
  if (body?.op === "resolve") {
    return store.resolveAnomaly(body.id);
  }
  return null;
});

import { defineEventHandler, readBody } from "vinxi/server";
import store from "../../data/store";
import type { FilterOptions, Project } from "../../types";

export const GET = defineEventHandler((event) => {
  const url = new URL(event.node.req.url!, "http://x");
  const id = url.searchParams.get("id");
  if (id) return store.getProject(id);
  return store.getAllProjects();
});

export const POST = defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (body?.op === "filter") {
    const opts: FilterOptions = {
      search: body.search ?? "",
      status: body.status ?? [],
      dynasty: body.dynasty ?? [],
      priority: body.priority ?? [],
      assignee: body.assignee ?? [],
      hasAnomaly: body.hasAnomaly ?? null,
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
      tags: body.tags ?? []
    };
    return store.filterProjects(opts);
  }
  const data = body as Omit<Project, "id" | "createdAt" | "updatedAt">;
  return store.createProject(data);
});

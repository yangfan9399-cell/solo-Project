import { defineEventHandler, readBody, getRouterParams } from "vinxi/server";
import store from "../../../../data/store";
import type { ProjectVersion } from "../../../../types";

export const GET = defineEventHandler((event) => {
  const { id } = getRouterParams(event);
  return store.getVersions(id);
});

export const POST = defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const body = await readBody();
  const data: Omit<ProjectVersion, "id" | "createdAt"> = {
    projectId: id,
    versionNumber: body.versionNumber,
    batchId: body.batchId,
    createdBy: body.createdBy,
    snapshot: body.snapshot,
    replacementsSnapshot: body.replacementsSnapshot,
    changeSummary: body.changeSummary,
    comment: body.comment
  };
  return store.createVersion(data);
});

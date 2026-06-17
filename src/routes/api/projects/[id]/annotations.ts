import { defineEventHandler, readBody, getRouterParams } from "vinxi/server";
import store from "../../../../data/store";
import type { Annotation } from "../../../../types";

export const GET = defineEventHandler((event) => {
  const { id } = getRouterParams(event);
  return store.getAnnotations(id);
});

export const POST = defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const body = await readBody();
  if (body?.op === "resolve") {
    return store.resolveAnnotation(body.annotationId, body.resolver);
  }
  const data: Omit<Annotation, "id" | "createdAt"> = {
    projectId: id,
    replacementId: body.replacementId,
    position: body.position ?? 0,
    type: body.type ?? "comment",
    content: body.content,
    author: body.author,
    resolved: false
  };
  return store.createAnnotation(data);
});

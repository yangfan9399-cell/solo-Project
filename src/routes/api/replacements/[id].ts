import { defineEventHandler, readBody, getRouterParams } from "vinxi/server";
import store from "../../../data/store";

export const GET = defineEventHandler((event) => {
  const { id } = getRouterParams(event);
  return store.getReplacement(id);
});

export const PATCH = defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const body = await readBody(event);
  return store.updateReplacement(id, body);
});

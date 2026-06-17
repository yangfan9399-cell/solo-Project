import { defineEventHandler, getRouterParams } from "vinxi/server";
import store from "../../../../data/store";

export const GET = defineEventHandler((event) => {
  const { id } = getRouterParams(event);
  return store.getReplacements(id);
});

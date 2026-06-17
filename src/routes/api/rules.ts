import { defineEventHandler } from "vinxi/server";
import store from "../../data/store";

export const GET = defineEventHandler(() => {
  return store.getAllDynastyRules();
});

import type { RequestHandler } from "@builder.io/qwik-city";
import { readGameData, initializeDefaultData } from "~/lib/server/db";

export const onGet: RequestHandler = async ({ json }) => {
  initializeDefaultData();
  const data = readGameData();
  json(200, {
    success: true,
    levels: data.levels,
    stops: data.stops,
  });
};

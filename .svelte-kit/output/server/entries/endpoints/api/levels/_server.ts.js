import { json } from "@sveltejs/kit";
import { l as levelsDb } from "../../../../chunks/db.js";
const GET = async () => {
  const levels = levelsDb.getAll();
  return json(levels);
};
export {
  GET
};

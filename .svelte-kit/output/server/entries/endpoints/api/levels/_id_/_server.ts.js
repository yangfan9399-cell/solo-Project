import { json } from "@sveltejs/kit";
import { l as levelsDb } from "../../../../../chunks/db.js";
const GET = async ({ params }) => {
  const level = levelsDb.getById(params.id);
  if (!level) {
    return json({ error: "关卡不存在" }, { status: 404 });
  }
  return json(level);
};
export {
  GET
};

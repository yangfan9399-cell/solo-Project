import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getAllLevels, getLevel, getTopScores } from "~/repo.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const level = getLevel(id);
    if (!level) return json({ level: null }, { status: 404 });
    const scores = getTopScores(id, 5);
    return json({ level, scores });
  }
  const levels = getAllLevels();
  return json({ levels });
}

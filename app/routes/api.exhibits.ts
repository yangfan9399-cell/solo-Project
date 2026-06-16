import { json } from "@remix-run/node";
import { getAllExhibitDefs } from "~/repo.server";

export async function loader() {
  const defs = getAllExhibitDefs();
  return json({ defs });
}

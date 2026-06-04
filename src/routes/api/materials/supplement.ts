import { json } from "solid-start";
import { supplementMaterial } from "~/lib/service";
import type { APIEvent } from "solid-start/api";

export async function POST(event: APIEvent) {
  const body = await event.request.json();
  await supplementMaterial(body.regId, body);
  return json({ success: true });
}

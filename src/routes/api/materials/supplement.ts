import { json } from "solid-start";
import { supplementMaterial } from "~/lib/service";
import type { APIEvent } from "solid-start/api";

export async function POST(event: APIEvent) {
  const body = await event.request.json();
  try {
    await supplementMaterial(body.regId, body);
    return json({ success: true });
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
}

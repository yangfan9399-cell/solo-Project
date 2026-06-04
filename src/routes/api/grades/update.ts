import { json } from "solid-start";
import { updateGrade } from "~/lib/service";
import type { APIEvent } from "solid-start/api";

export async function POST(event: APIEvent) {
  const body = await event.request.json();
  try {
    const result = await updateGrade(body.regId, body);
    return json(result);
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
}

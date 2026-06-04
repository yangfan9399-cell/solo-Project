import { json } from "solid-start";
import { reviewQualification, markMaterialMissing, returnToHandler } from "~/lib/service";
import type { APIEvent } from "solid-start/api";

export async function POST(event: APIEvent) {
  const body = await event.request.json();
  const { action } = body;

  try {
    if (action === "review") {
      await reviewQualification(body.regId, body);
    } else if (action === "mark_missing") {
      await markMaterialMissing(body.regId, body);
    } else if (action === "return") {
      await returnToHandler(body.regId, body);
    } else {
      return json({ error: "未知操作" }, { status: 400 });
    }
    return json({ success: true });
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
}

import { json } from "solid-start";
import { createDispute, resolveDispute, getDisputes } from "~/lib/service";
import type { APIEvent } from "solid-start/api";

export async function GET(event: APIEvent) {
  const url = new URL(event.request.url);
  const regId = url.searchParams.get("regId") || undefined;
  const data = await getDisputes(regId);
  return json(data);
}

export async function POST(event: APIEvent) {
  const body = await event.request.json();
  const { action } = body;

  try {
    if (action === "create") {
      const result = await createDispute(body);
      return json(result);
    } else if (action === "resolve") {
      await resolveDispute(body.disputeId, body);
      return json({ success: true });
    }
    return json({ error: "未知操作" }, { status: 400 });
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
}

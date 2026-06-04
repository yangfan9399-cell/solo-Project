import { json } from "solid-start";
import { createRegistration, getRegistrationDetail } from "~/lib/service";
import type { APIEvent } from "solid-start/api";

export async function GET(event: APIEvent) {
  const regId = event.params.id;
  const data = await getRegistrationDetail(regId);
  if (!data) return json({ error: "未找到" }, { status: 404 });
  return json(data);
}

export async function POST(event: APIEvent) {
  const body = await event.request.json();
  const result = await createRegistration(body);
  return json(result);
}

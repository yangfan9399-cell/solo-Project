import { json } from "solid-start";
import { getRegistrations } from "~/lib/service";
import type { APIEvent } from "solid-start/api";

export async function GET(event: APIEvent) {
  const url = new URL(event.request.url);
  const status = url.searchParams.get("status") || undefined;
  const keyword = url.searchParams.get("keyword") || undefined;
  const data = await getRegistrations({ status, keyword });
  return json(data);
}

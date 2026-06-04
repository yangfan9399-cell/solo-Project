import { json } from "solid-start";
import { issueCertificate, archiveCertificate, traceFromCertificate, getCertificates } from "~/lib/service";
import type { APIEvent } from "solid-start/api";

export async function GET(event: APIEvent) {
  const url = new URL(event.request.url);
  const traceCertId = url.searchParams.get("trace");
  if (traceCertId) {
    const data = await traceFromCertificate(traceCertId);
    if (!data) return json({ error: "未找到" }, { status: 404 });
    return json(data);
  }
  const data = await getCertificates();
  return json(data);
}

export async function POST(event: APIEvent) {
  const body = await event.request.json();
  const { action } = body;

  try {
    if (action === "issue") {
      const result = await issueCertificate(body.regId, body);
      return json(result);
    } else if (action === "archive") {
      await archiveCertificate(body.certId, body.operator);
      return json({ success: true });
    }
    return json({ error: "未知操作" }, { status: 400 });
  } catch (e: any) {
    return json({ error: e.message }, { status: 400 });
  }
}

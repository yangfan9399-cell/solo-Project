import { NextResponse } from "next/server";
import { reopenOrder } from "@/lib/data-service";

async function parseBody(request: Request): Promise<any> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }
  const form = await request.formData();
  const obj: any = {};
  for (const [k, v] of form.entries()) {
    obj[k] = String(v);
  }
  return obj;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await parseBody(request);
    const result = await reopenOrder(id);
    const referer = request.headers.get("referer") || `/orders/${id}?tab=process`;
    const accept = request.headers.get("accept") || "";
    if (accept.includes("text/html")) {
      return NextResponse.redirect(new URL(referer, request.url), 303);
    }
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "重新处理失败";
    const referer = request.headers.get("referer") || `/orders/${id}?tab=process`;
    const accept = request.headers.get("accept") || "";
    if (accept.includes("text/html")) {
      const url = new URL(referer, request.url);
      url.searchParams.set("error", encodeURIComponent(msg));
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

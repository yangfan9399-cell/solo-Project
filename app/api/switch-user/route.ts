import { NextResponse } from "next/server";
import { setCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: { userId?: string } = {};

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = { userId: String(form.get("userId") || "") };
    }

    if (!body.userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    const user = await setCurrentUser(body.userId);

    const referer = request.headers.get("referer") || "/";
    const accept = request.headers.get("accept") || "";

    if (accept.includes("text/html")) {
      return NextResponse.redirect(new URL(referer, request.url), 303);
    }
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "切换失败" },
      { status: 400 }
    );
  }
}

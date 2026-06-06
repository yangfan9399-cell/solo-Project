import { NextResponse } from "next/server";
import { dataService } from "@/lib/data-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();

    const defect = dataService.submitProcessingResult(id, body);

    if (!defect) {
      return NextResponse.json({ error: "缺陷不存在" }, { status: 404 });
    }

    return NextResponse.json(defect);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "提交失败" },
      { status: 400 }
    );
  }
}

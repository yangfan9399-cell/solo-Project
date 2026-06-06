import { NextResponse } from "next/server";
import { dataService } from "@/lib/data-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const { assigneeId } = await request.json();

    const defect = dataService.assignDefect(id, assigneeId);

    if (!defect) {
      return NextResponse.json({ error: "缺陷不存在" }, { status: 404 });
    }

    return NextResponse.json(defect);
  } catch (error) {
    return NextResponse.json(
      { error: "分派失败" },
      { status: 400 }
    );
  }
}

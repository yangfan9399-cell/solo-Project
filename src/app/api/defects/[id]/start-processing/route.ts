import { NextResponse } from "next/server";
import { db } from "@/db";
import { defects, defectHistories, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const { userId } = await request.json();

    const defectResult = await db
      .select()
      .from(defects)
      .where(eq(defects.id, id))
      .limit(1);

    if (defectResult.length === 0) {
      return NextResponse.json({ error: "缺陷不存在" }, { status: 404 });
    }

    const defect = defectResult[0];

    if (
      defect.status !== "assigned" &&
      defect.status !== "awaiting_parts" &&
      defect.status !== "rejected"
    ) {
      return NextResponse.json(
        { error: "只有已分派、待备件或已退回状态的缺陷才能开始处理" },
        { status: 400 }
      );
    }

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const user = userResult[0];

    const now = new Date();
    const statusBefore = defect.status;

    let historyDescription = "开始现场检修";
    if (statusBefore === "rejected") {
      historyDescription = "验收退回，重新开始处理";
    } else if (statusBefore === "awaiting_parts") {
      historyDescription = "备件已到，继续现场检修";
    }

    const [updatedDefect] = await db
      .update(defects)
      .set({
        status: "processing",
        processingStartedAt: now,
        updatedAt: now,
      })
      .where(eq(defects.id, id))
      .returning();

    await db.insert(defectHistories).values({
      defectId: id,
      action: "start_processing",
      userId,
      userName: user?.name,
      description: historyDescription,
      statusBefore,
      statusAfter: "processing",
    });

    return NextResponse.json(updatedDefect);
  } catch (error) {
    console.error("操作失败:", error);
    return NextResponse.json(
      { error: "操作失败" },
      { status: 400 }
    );
  }
}

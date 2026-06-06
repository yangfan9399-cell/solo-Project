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
    const { assigneeId } = await request.json();

    const defectResult = await db
      .select()
      .from(defects)
      .where(eq(defects.id, id))
      .limit(1);

    if (defectResult.length === 0) {
      return NextResponse.json({ error: "缺陷不存在" }, { status: 404 });
    }

    const defect = defectResult[0];

    if (defect.status !== "registered") {
      return NextResponse.json(
        { error: "只有已登记状态的缺陷才能分派" },
        { status: 400 }
      );
    }

    const assigneeResult = await db
      .select()
      .from(users)
      .where(eq(users.id, assigneeId))
      .limit(1);
    const assignee = assigneeResult[0];

    const now = new Date();

    const [updatedDefect] = await db
      .update(defects)
      .set({
        status: "assigned",
        assigneeId,
        assignedAt: now,
        updatedAt: now,
      })
      .where(eq(defects.id, id))
      .returning();

    await db.insert(defectHistories).values({
      defectId: id,
      action: "assign",
      userId: assigneeId,
      userName: assignee?.name,
      description: `分派给${assignee?.name || "检修人员"}处理`,
      statusBefore: "registered",
      statusAfter: "assigned",
    });

    return NextResponse.json(updatedDefect);
  } catch (error) {
    console.error("分派失败:", error);
    return NextResponse.json(
      { error: "分派失败" },
      { status: 400 }
    );
  }
}

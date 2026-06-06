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
    const { reviewerId, comment } = await request.json();

    const defectResult = await db
      .select()
      .from(defects)
      .where(eq(defects.id, id))
      .limit(1);

    if (defectResult.length === 0) {
      return NextResponse.json({ error: "缺陷不存在" }, { status: 404 });
    }

    const defect = defectResult[0];

    if (defect.status !== "pending_review") {
      return NextResponse.json(
        { error: "只有待验收状态的缺陷才能退回" },
        { status: 400 }
      );
    }

    const reviewerResult = await db
      .select()
      .from(users)
      .where(eq(users.id, reviewerId))
      .limit(1);
    const reviewer = reviewerResult[0];

    const now = new Date();
    const statusBefore = defect.status;

    const [updatedDefect] = await db
      .update(defects)
      .set({
        status: "rejected",
        reviewerId,
        reviewComment: comment,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(defects.id, id))
      .returning();

    await db.insert(defectHistories).values({
      defectId: id,
      action: "reject",
      userId: reviewerId,
      userName: reviewer?.name,
      description: `验收退回：${comment || "需重新处理"}`,
      statusBefore,
      statusAfter: "rejected",
    });

    return NextResponse.json(updatedDefect);
  } catch (error: any) {
    console.error("退回失败:", error);
    return NextResponse.json(
      { error: error.message || "退回失败" },
      { status: 400 }
    );
  }
}

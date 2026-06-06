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

    if (defect.status === "accepted" || defect.status === "false_positive") {
      return NextResponse.json(
        { error: "该状态下的缺陷不能标记为误报" },
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

    let resolutionDuration: number | undefined = undefined;
    if (defect.registeredAt) {
      resolutionDuration = Math.floor(
        (now.getTime() - new Date(defect.registeredAt).getTime()) / 60000
      );
    }

    const [updatedDefect] = await db
      .update(defects)
      .set({
        status: "false_positive",
        isFalsePositive: true,
        reviewerId,
        reviewComment: comment,
        reviewedAt: now,
        closedAt: now,
        resolutionDuration,
        updatedAt: now,
      })
      .where(eq(defects.id, id))
      .returning();

    await db.insert(defectHistories).values({
      defectId: id,
      action: "mark_false_positive",
      userId: reviewerId,
      userName: reviewer?.name,
      description: `标记为误报：${comment || "经核实为误报"}`,
      statusBefore,
      statusAfter: "false_positive",
    });

    return NextResponse.json(updatedDefect);
  } catch (error: any) {
    console.error("操作失败:", error);
    return NextResponse.json(
      { error: error.message || "操作失败" },
      { status: 400 }
    );
  }
}

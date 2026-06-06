import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  defects,
  defectHistories,
  users,
  spareParts,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

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
        { error: "只有待验收状态的缺陷才能验收" },
        { status: 400 }
      );
    }

    if (defect.partsNeeded && Array.isArray(defect.partsNeeded) && defect.partsNeeded.length > 0) {
      const partIds = defect.partsNeeded.map((p: any) => p.partId);
      const partsResult = await db
        .select()
        .from(spareParts)
        .where(inArray(spareParts.id, partIds));

      for (const p of defect.partsNeeded as any[]) {
        const part = partsResult.find((sp) => sp.id === p.partId);
        if (
          !part ||
          part.status === "out_of_stock" ||
          (part.quantity ?? 0) < p.quantity
        ) {
          return NextResponse.json(
            { error: "备件缺货时不能验收，请先等待备件到货" },
            { status: 400 }
          );
        }
      }
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
        status: "accepted",
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
      action: "accept",
      userId: reviewerId,
      userName: reviewer?.name,
      description: "验收通过，消缺完成",
      statusBefore,
      statusAfter: "accepted",
    });

    return NextResponse.json(updatedDefect);
  } catch (error: any) {
    console.error("验收失败:", error);
    return NextResponse.json(
      { error: error.message || "验收失败" },
      { status: 400 }
    );
  }
}

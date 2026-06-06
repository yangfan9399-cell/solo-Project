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
    const body = await request.json();
    const { result, photos, partsNeeded, userId } = body;

    const defectResult = await db
      .select()
      .from(defects)
      .where(eq(defects.id, id))
      .limit(1);

    if (defectResult.length === 0) {
      return NextResponse.json({ error: "缺陷不存在" }, { status: 404 });
    }

    const defect = defectResult[0];

    if (defect.status !== "processing") {
      return NextResponse.json(
        { error: "只有处理中状态的缺陷才能提交处理结果" },
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

    let hasOutOfStockParts = false;
    if (partsNeeded && partsNeeded.length > 0) {
      const partIds = partsNeeded.map((p: any) => p.partId);
      const partsResult = await db
        .select()
        .from(spareParts)
        .where(inArray(spareParts.id, partIds));

      for (const p of partsNeeded) {
        const part = partsResult.find((sp) => sp.id === p.partId);
        if (
          !part ||
          part.status === "out_of_stock" ||
          (part.quantity ?? 0) < p.quantity
        ) {
          hasOutOfStockParts = true;
          break;
        }
      }
    }

    let newStatus: any = "pending_review";
    let historyAction: any = "submit_result";
    let historyDesc = "提交处理结果，等待验收";

    if (hasOutOfStockParts) {
      newStatus = "awaiting_parts";
      historyAction = "request_parts";
      historyDesc = "提交处理结果，需等待备件";
    }

    const [updatedDefect] = await db
      .update(defects)
      .set({
        status: newStatus,
        processingResult: result,
        processingPhotos: photos || [],
        partsNeeded: partsNeeded || null,
        processingFinishedAt: now,
        updatedAt: now,
      })
      .where(eq(defects.id, id))
      .returning();

    await db.insert(defectHistories).values({
      defectId: id,
      action: historyAction,
      userId,
      userName: user?.name,
      description: historyDesc,
      statusBefore,
      statusAfter: newStatus,
    });

    return NextResponse.json(updatedDefect);
  } catch (error: any) {
    console.error("提交失败:", error);
    return NextResponse.json(
      { error: error.message || "提交失败" },
      { status: 400 }
    );
  }
}

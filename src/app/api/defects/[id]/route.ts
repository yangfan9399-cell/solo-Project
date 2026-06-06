import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  defects,
  powerStations,
  devices,
  users,
  defectHistories,
  spareParts,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  const defectResult = await db
    .select()
    .from(defects)
    .where(eq(defects.id, id))
    .limit(1);

  if (defectResult.length === 0) {
    return NextResponse.json({ error: "缺陷不存在" }, { status: 404 });
  }

  const defect = defectResult[0];

  const [stationResult, deviceResult, inspectorResult, assigneeResult, reviewerResult, historiesResult] =
    await Promise.all([
      db.select().from(powerStations).where(eq(powerStations.id, defect.stationId)).limit(1),
      db.select().from(devices).where(eq(devices.id, defect.deviceId)).limit(1),
      defect.inspectorId
        ? db.select().from(users).where(eq(users.id, defect.inspectorId)).limit(1)
        : Promise.resolve([]),
      defect.assigneeId
        ? db.select().from(users).where(eq(users.id, defect.assigneeId)).limit(1)
        : Promise.resolve([]),
      defect.reviewerId
        ? db.select().from(users).where(eq(users.id, defect.reviewerId)).limit(1)
        : Promise.resolve([]),
      db
        .select()
        .from(defectHistories)
        .where(eq(defectHistories.defectId, id))
        .orderBy(desc(defectHistories.createdAt)),
    ]);

  const partsWithStatus = [];
  if (defect.partsNeeded && Array.isArray(defect.partsNeeded)) {
    for (const p of defect.partsNeeded) {
      const partResult = await db
        .select()
        .from(spareParts)
        .where(eq(spareParts.id, p.partId))
        .limit(1);
      const part = partResult[0];
      partsWithStatus.push({
        ...p,
        status: part?.status || "unknown",
        availableQuantity: part?.quantity || 0,
      });
    }
  }

  return NextResponse.json({
    ...defect,
    station: stationResult[0],
    device: deviceResult[0],
    inspector: inspectorResult[0],
    assignee: assigneeResult[0],
    reviewer: reviewerResult[0],
    histories: historiesResult,
    partsWithStatus,
  });
}

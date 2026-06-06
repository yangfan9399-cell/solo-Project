import { NextResponse } from "next/server";
import { dataService } from "@/lib/data-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  const defect = dataService.getDefectById(id);

  if (!defect) {
    return NextResponse.json({ error: "缺陷不存在" }, { status: 404 });
  }

  const station = dataService.getStationById(defect.stationId);
  const device = dataService.getDeviceById(defect.deviceId);
  const inspector = defect.inspectorId
    ? dataService.getUserById(defect.inspectorId)
    : undefined;
  const assignee = defect.assigneeId
    ? dataService.getUserById(defect.assigneeId)
    : undefined;
  const reviewer = defect.reviewerId
    ? dataService.getUserById(defect.reviewerId)
    : undefined;
  const histories = dataService.getDefectHistories(id);

  const partsWithStatus = defect.partsNeeded?.map((p) => {
    const part = dataService.getSparePartById(p.partId);
    return {
      ...p,
      status: part?.status || "unknown",
      availableQuantity: part?.quantity || 0,
    };
  });

  return NextResponse.json({
    ...defect,
    station,
    device,
    inspector,
    assignee,
    reviewer,
    histories,
    partsWithStatus,
  });
}

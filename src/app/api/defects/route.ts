import { NextResponse } from "next/server";
import { dataService } from "@/lib/data-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const stationId = searchParams.get("stationId")
    ? parseInt(searchParams.get("stationId")!)
    : undefined;
  const deviceType = searchParams.get("deviceType") || undefined;
  const defectLevel = searchParams.get("defectLevel") || undefined;
  const assigneeId = searchParams.get("assigneeId")
    ? parseInt(searchParams.get("assigneeId")!)
    : undefined;
  const inspectorId = searchParams.get("inspectorId")
    ? parseInt(searchParams.get("inspectorId")!)
    : undefined;

  const defects = dataService.getDefects({
    status: status as any,
    stationId,
    deviceType,
    defectLevel,
    assigneeId,
    inspectorId,
  });

  const defectsWithDetails = defects.map((defect) => {
    const station = dataService.getStationById(defect.stationId);
    const device = dataService.getDeviceById(defect.deviceId);
    const inspector = defect.inspectorId
      ? dataService.getUserById(defect.inspectorId)
      : undefined;
    const assignee = defect.assigneeId
      ? dataService.getUserById(defect.assigneeId)
      : undefined;

    return {
      ...defect,
      stationName: station?.name,
      deviceName: device?.name,
      inspectorName: inspector?.name,
      assigneeName: assignee?.name,
    };
  });

  return NextResponse.json(defectsWithDetails);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newDefect = dataService.createDefect(body);
    return NextResponse.json(newDefect, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "创建缺陷失败" },
      { status: 400 }
    );
  }
}

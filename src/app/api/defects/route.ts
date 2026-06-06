import { NextResponse } from "next/server";
import { db } from "@/db";
import { defects, powerStations, devices, users, defectHistories } from "@/db/schema";
import { eq, and, asc, desc, sql, like } from "drizzle-orm";
import { generateDefectNo } from "@/lib/utils";

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

  const conditions = [];
  if (status) conditions.push(eq(defects.status, status as any));
  if (stationId) conditions.push(eq(defects.stationId, stationId));
  if (deviceType) conditions.push(eq(defects.deviceType, deviceType as any));
  if (defectLevel) conditions.push(eq(defects.defectLevel, defectLevel as any));
  if (assigneeId) conditions.push(eq(defects.assigneeId, assigneeId));
  if (inspectorId) conditions.push(eq(defects.inspectorId, inspectorId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      defect: defects,
      stationName: powerStations.name,
      deviceName: devices.name,
      inspectorName: users.name,
    })
    .from(defects)
    .leftJoin(powerStations, eq(defects.stationId, powerStations.id))
    .leftJoin(devices, eq(defects.deviceId, devices.id))
    .leftJoin(users, eq(defects.inspectorId, users.id))
    .where(whereClause)
    .orderBy(desc(defects.createdAt));

  const assigneeMap = new Map<number, string>();
  const allUsers = await db.select().from(users);
  for (const u of allUsers) {
    assigneeMap.set(u.id, u.name);
  }

  const defectsWithDetails = result.map((row) => ({
    ...row.defect,
    stationName: row.stationName,
    deviceName: row.deviceName,
    inspectorName: row.inspectorName,
    assigneeName: row.defect.assigneeId
      ? assigneeMap.get(row.defect.assigneeId)
      : undefined,
  }));

  return NextResponse.json(defectsWithDetails);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const station = await db.query.powerStations.findFirst({
      where: eq(powerStations.id, body.stationId),
    });
    if (!station) {
      return NextResponse.json({ error: "电站不存在" }, { status: 400 });
    }

    const device = await db.query.devices.findFirst({
      where: eq(devices.id, body.deviceId),
    });
    if (!device) {
      return NextResponse.json({ error: "设备不存在" }, { status: 400 });
    }

    const inspector = await db.query.users.findFirst({
      where: eq(users.id, body.inspectorId || 1),
    });

    const defectNo = generateDefectNo();

    const [newDefect] = await db
      .insert(defects)
      .values({
        defectNo,
        stationId: body.stationId,
        deviceId: body.deviceId,
        title: body.title,
        description: body.description,
        defectLevel: body.defectLevel,
        deviceType: body.deviceType || device.deviceType,
        affectedPower: body.affectedPower,
        photoUrls: body.photoUrls || [],
        location: body.location,
        array: body.array,
        inspectorId: body.inspectorId || 1,
        registeredAt: new Date(),
      })
      .returning();

    await db.insert(defectHistories).values({
      defectId: newDefect.id,
      action: "register",
      userId: inspector?.id,
      userName: inspector?.name,
      description: "巡检登记缺陷",
      statusAfter: "registered",
    });

    return NextResponse.json(newDefect, { status: 201 });
  } catch (error) {
    console.error("创建缺陷失败:", error);
    return NextResponse.json(
      { error: "创建缺陷失败" },
      { status: 400 }
    );
  }
}

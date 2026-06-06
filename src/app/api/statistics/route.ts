import { NextResponse } from "next/server";
import { db } from "@/db";
import { defects, powerStations } from "@/db/schema";
import { eq, sql, count, sum, avg } from "drizzle-orm";

const deviceTypeLabels: Record<string, string> = {
  pv_module: "光伏组件",
  inverter: "逆变器",
  combiner_box: "汇流箱",
  tracker: "跟踪支架",
  transformer: "变压器",
  cable: "电缆/连接器",
};

const levelLabels: Record<string, string> = {
  critical: "紧急",
  major: "重要",
  minor: "一般",
  general: "轻微",
};

export async function GET() {
  const allDefects = await db.select().from(defects);

  const stations = await db.select().from(powerStations);
  const stationMap = new Map(stations.map((s) => [s.id, s.name]));

  const total = allDefects.length;

  const byStatus: Record<string, number> = {};
  const byStation: Record<string, { name: string; count: number; affectedPower: number }> = {};
  const byDeviceType: Record<string, { label: string; count: number }> = {};
  const byLevel: Record<string, { label: string; count: number }> = {};
  let avgDuration = 0;
  let closedCount = 0;
  let falsePositiveCount = 0;

  for (const d of allDefects) {
    byStatus[d.status] = (byStatus[d.status] || 0) + 1;

    const stationName = stationMap.get(d.stationId);
    if (stationName) {
      if (!byStation[d.stationId]) {
        byStation[d.stationId] = { name: stationName, count: 0, affectedPower: 0 };
      }
      byStation[d.stationId].count++;
      byStation[d.stationId].affectedPower += parseFloat(d.affectedPower || "0");
    }

    if (!byDeviceType[d.deviceType]) {
      byDeviceType[d.deviceType] = {
        label: deviceTypeLabels[d.deviceType] || d.deviceType,
        count: 0,
      };
    }
    byDeviceType[d.deviceType].count++;

    if (!byLevel[d.defectLevel]) {
      byLevel[d.defectLevel] = {
        label: levelLabels[d.defectLevel] || d.defectLevel,
        count: 0,
      };
    }
    byLevel[d.defectLevel].count++;

    if (d.resolutionDuration) {
      avgDuration += d.resolutionDuration;
      closedCount++;
    }

    if (d.isFalsePositive) {
      falsePositiveCount++;
    }
  }

  if (closedCount > 0) {
    avgDuration = Math.floor(avgDuration / closedCount);
  }

  const falsePositiveRate = total > 0 ? (falsePositiveCount / total) * 100 : 0;

  return NextResponse.json({
    total,
    byStatus,
    byStation: Object.values(byStation),
    byDeviceType: Object.values(byDeviceType),
    byLevel: Object.values(byLevel),
    avgResolutionDuration: avgDuration,
    falsePositiveRate: parseFloat(falsePositiveRate.toFixed(1)),
  });
}

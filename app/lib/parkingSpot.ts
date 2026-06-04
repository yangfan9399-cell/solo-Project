import { db } from "./db.server";
import { VisitStatus } from "@prisma/client";

export async function getAvailableSpots(excludeSpotId?: string) {
  const whereClause: any = {
    status: { in: [VisitStatus.PENDING, VisitStatus.CHECKED_IN] },
    isArchived: false,
    parkingSpotId: { not: null },
  };
  if (excludeSpotId) {
    whereClause.NOT = { parkingSpotId: excludeSpotId };
  }

  const occupiedSpotIds = await db.visit
    .findMany({
      where: whereClause,
      select: { parkingSpotId: true },
    })
    .then((visits) =>
      visits.map((v) => v.parkingSpotId).filter(Boolean) as string[]);

  const spots = await db.parkingSpot.findMany({
    where: {
      isAvailable: true,
      id: { notIn: occupiedSpotIds },
    },
    orderBy: { spotNumber: "asc" },
  });

  return spots;
}

export async function occupySpot(spotId: string) {
  return db.parkingSpot.update({
    where: { id: spotId },
    data: { isAvailable: false },
  });
}

export async function releaseSpot(spotId: string) {
  return db.parkingSpot.update({
    where: { id: spotId },
    data: { isAvailable: true },
  });
}

export async function validateSpotAvailable(spotId: string, excludeVisitId?: string) {
  const spot = await db.parkingSpot.findUnique({
    where: { id: spotId },
  });

  if (!spot) {
    return { valid: false, error: "车位不存在" };
  }

  if (!spot.isAvailable) {
    return { valid: false, error: "该车位已被占用" };
  }

  const whereClause2: any = {
    parkingSpotId: spotId,
    status: { in: [VisitStatus.PENDING, VisitStatus.CHECKED_IN] },
    isArchived: false,
  };
  if (excludeVisitId) {
    whereClause2.NOT = { id: excludeVisitId };
  }

  const occupiedVisit = await db.visit.findFirst({
    where: whereClause2,
  });

  if (occupiedVisit) {
    return { valid: false, error: "该车位已被其他预约或已在场车辆占用" };
  }

  return { valid: true, spot };
}

export function buildAnomalyNote(
  type: "PLATE_MISMATCH" | "SPOT_OCCUPIED" | "OVERSTAY" | "BOTH",
  oldPlate?: string,
  newPlate?: string,
  oldSpot?: string,
  newSpot?: string,
  customNote?: string
) {
  if (customNote) return customNote;

  if (type === "PLATE_MISMATCH" && oldPlate && newPlate) {
    return `车牌由${oldPlate}变更为${newPlate}`;
  }

  if (type === "SPOT_OCCUPIED" && oldSpot && newSpot) {
    return `车位由${oldSpot}变更为${newSpot}`;
  }

  if (type === "BOTH") {
    const parts = [];
    if (oldPlate && newPlate) parts.push(`车牌: ${oldPlate}→${newPlate}`);
    if (oldSpot && newSpot) parts.push(`车位: ${oldSpot}→${newSpot}`);
    return `同时变更${parts.join(", ")}`;
  }

  return "";
}

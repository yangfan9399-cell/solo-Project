import { routeLoader$ } from "@builder.io/qwik-city";
import prisma from "~/lib/prisma";
import { userCookie, getCurrentUser } from "~/lib/auth";
import type { InspectionStatus } from "~/lib/types";

export const useInspections = routeLoader$(async (requestEvent) => {
  const cookie = userCookie.get(requestEvent);
  const currentUser = await getCurrentUser(cookie);

  const status = requestEvent.query.get("status") as InspectionStatus | null;
  const role = currentUser?.role;

  let whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  if (role === "INSPECTOR") {
    whereClause.OR = [
      { createdById: currentUser?.id },
      { assignedToId: currentUser?.id },
    ];
  }

  const inspections = await prisma.inspection.findMany({
    where: whereClause,
    include: {
      building: {
        select: { id: true, name: true, code: true, responsible: true },
      },
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      lastChange: {
        include: {
          operator: { select: { id: true, name: true, role: true } },
        },
      },
      evidences: {
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [
      { isOverdue: "desc" },
      { createdAt: "desc" },
    ],
  });

  const stats = await prisma.inspection.groupBy({
    by: ["status"],
    where: role === "INSPECTOR" ? {
      OR: [
        { createdById: currentUser?.id },
        { assignedToId: currentUser?.id },
      ],
    } : {},
    _count: { status: true },
  });

  const unreadNotifications = currentUser
    ? await prisma.notification.count({
        where: {
          userId: currentUser.id,
          isRead: false,
        },
      })
    : 0;

  return {
    inspections,
    stats: stats.reduce((acc, s) => {
      acc[s.status] = s._count.status;
      return acc;
    }, {} as Record<string, number>),
    unreadNotifications,
    currentUser,
  };
});

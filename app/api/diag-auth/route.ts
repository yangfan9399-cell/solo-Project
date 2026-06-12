import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canReview, canArchive, canReopen, canSupplementMaterials } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  
  let order: any = null;
  if (orderId) {
    order = await prisma.dispatchOrder.findUnique({ where: { id: orderId } });
  } else {
    order = await prisma.dispatchOrder.findFirst({
      where: { status: "PENDING_REVIEW" },
    });
  }
  const archivedOrder = await prisma.dispatchOrder.findFirst({
    where: { status: "ARCHIVED" },
  });

  const diag: any = {
    user: { id: user.id, name: user.name, role: user.role, roleType: typeof user.role },
    order: order ? { id: order.id, status: order.status, isArchived: order.isArchived, statusType: typeof order.status, isArchivedType: typeof order.isArchived } : null,
    archivedOrder: archivedOrder ? { id: archivedOrder.id, status: archivedOrder.status, isArchived: archivedOrder.isArchived } : null,
    canReview: order ? canReview(user, order.status, order.isArchived) : "no order",
    canReopen: archivedOrder ? canReopen(user, archivedOrder.status, archivedOrder.isArchived) : "no archived order",
    canReopenWithOrder: order ? canReopen(user, order.status, order.isArchived) : "no order",
    roleEqAdminString: user.role === "ADMIN",
    statusEqArchivedString: order ? order.status === "ARCHIVED" : "no order",
    isArchivedEqTrue: order ? order.isArchived === true : "no order",
  };

  return NextResponse.json(diag);
}

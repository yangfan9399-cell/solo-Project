import type { PrismaClient } from "@prisma/client";

type TransactionClient = Omit<
  PrismaClient,
  | "$connect"
  | "$disconnect"
  | "$on"
  | "$transaction"
  | "$use"
  | "$extends"
>;

export async function checkAndCreateStockAlert(
  tx: TransactionClient,
  materialId: string,
  warehouseLocation: string | null
) {
  const stock = await tx.stock.findFirst({
    where: { materialId, warehouseLocation },
  });

  if (!stock) return;

  if (stock.availableQty < stock.minWarningQty) {
    const existing = await tx.stockAlert.findFirst({
      where: {
        stockId: stock.id,
        alertType: "LOW_STOCK",
        isRead: false,
      },
    });

    if (existing) {
      await tx.stockAlert.update({
        where: { id: existing.id },
        data: {
          currentQty: stock.availableQty,
          threshold: stock.minWarningQty,
          message: `${stock.availableQty} < ${stock.minWarningQty}`,
        },
      });
    } else {
      await tx.stockAlert.create({
        data: {
          stockId: stock.id,
          alertType: "LOW_STOCK",
          message: `库存不足：当前可用 ${stock.availableQty}，低于预警值 ${stock.minWarningQty}`,
          threshold: stock.minWarningQty,
          currentQty: stock.availableQty,
        },
      });
    }
  }
}

export async function resolveStockAlerts(
  tx: TransactionClient,
  materialId: string,
  warehouseLocation: string | null
) {
  const stock = await tx.stock.findFirst({
    where: { materialId, warehouseLocation },
  });

  if (!stock) return;

  if (stock.availableQty >= stock.minWarningQty) {
    await tx.stockAlert.updateMany({
      where: {
        stockId: stock.id,
        alertType: "LOW_STOCK",
        isRead: false,
      },
      data: { isRead: true },
    });
  }
}

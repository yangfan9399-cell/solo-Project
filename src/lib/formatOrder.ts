import { Order as PrismaOrder, OrderItem, Document, HistoryNode, ClearanceBasis, AmountDiscrepancy, ClassificationNote, User, Invoice } from '@prisma/client';

type OrderWithRelations = PrismaOrder & {
  items: OrderItem[];
  documents: Document[];
  historyNodes: HistoryNode[];
  documentHandler?: { name: string } | null;
  customsReviewer?: { name: string } | null;
  invoice?: (Invoice & { items?: any[] }) | null;
  clearanceBasis?: ClearanceBasis | null;
  amountDiscrepancy?: AmountDiscrepancy | null;
  classificationNote?: ClassificationNote | null;
};

export function formatOrder(order: OrderWithRelations) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    source: order.source,
    sourceOrderNo: order.sourceOrderNo,
    country: order.country,
    category: order.category,
    declaredValue: order.declaredValue.toNumber(),
    actualValue: order.actualValue?.toNumber() || null,
    declaredAmount: order.declaredAmount.toNumber(),
    actualAmount: order.actualAmount?.toNumber() || null,
    recipientName: order.recipientName,
    recipientIdType: order.recipientIdType,
    recipientIdNumber: order.recipientIdNumber,
    trackingNumber: order.trackingNumber,
    status: order.status,
    documentStatus: order.documentStatus,
    documentHandlerName: order.documentHandler?.name || null,
    customsReviewerName: order.customsReviewer?.name || null,
    items: order.items.map(item => ({
      id: item.id,
      name: item.name,
      declaredName: item.declaredName,
      hsCode: item.hsCode,
      declaredHsCode: item.declaredHsCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      total: item.total.toNumber(),
      weight: item.weight?.toNumber() || null,
      classificationNote: item.classificationNote,
    })),
    documents: order.documents.map(doc => ({
      id: doc.id,
      type: doc.type,
      name: doc.name,
      status: doc.status,
      notes: doc.notes,
      uploadedBy: doc.uploadedBy,
    })),
    historyNodes: order.historyNodes.map(node => ({
      id: node.id,
      action: node.action,
      status: node.status,
      notes: node.notes,
      operator: node.operator,
      role: node.role,
      timestamp: node.timestamp.toISOString(),
    })),
    clearanceBasis: order.clearanceBasis ? {
      id: order.clearanceBasis.id,
      basisType: order.clearanceBasis.basisType,
      regulationReference: order.clearanceBasis.regulationReference,
      explanation: order.clearanceBasis.explanation,
      approvedBy: order.clearanceBasis.approvedBy,
    } : null,
    amountDiscrepancy: order.amountDiscrepancy ? {
      id: order.amountDiscrepancy.id,
      declaredAmount: order.amountDiscrepancy.declaredAmount.toNumber(),
      actualAmount: order.amountDiscrepancy.actualAmount.toNumber(),
      difference: order.amountDiscrepancy.difference.toNumber(),
      differencePercent: order.amountDiscrepancy.differencePercent.toNumber(),
      discrepancySource: order.amountDiscrepancy.discrepancySource,
      correctionPath: order.amountDiscrepancy.correctionPath,
      resolved: order.amountDiscrepancy.resolved,
    } : null,
    classificationNote: order.classificationNote ? {
      id: order.classificationNote.id,
      itemName: order.classificationNote.itemName,
      declaredHsCode: order.classificationNote.declaredHsCode,
      suggestedHsCode: order.classificationNote.suggestedHsCode,
      reason: order.classificationNote.reason,
      status: order.classificationNote.status,
      resolved: order.classificationNote.resolved,
    } : null,
    createdAt: order.createdAt.toISOString(),
  };
}

export async function getFormattedOrder(prisma: any, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      documents: true,
      historyNodes: {
        orderBy: {
          timestamp: 'asc',
        },
      },
      documentHandler: {
        select: {
          name: true,
        },
      },
      customsReviewer: {
        select: {
          name: true,
        },
      },
      invoice: {
        include: {
          items: true,
        },
      },
      clearanceBasis: true,
      amountDiscrepancy: true,
      classificationNote: true,
    },
  });

  if (!order) return null;
  return formatOrder(order);
}

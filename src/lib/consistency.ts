import prisma from "./prisma";
import type {
  Inspection,
  InspectionStatus,
  HistoryNode,
  Notification,
} from "@prisma/client";
import { canTransition } from "./utils";
import type { HistoryActionType, NotificationType } from "./types";

type PrismaTransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export interface StateTransitionContext {
  inspectionId: string;
  fromStatus: InspectionStatus;
  toStatus: InspectionStatus;
  operatorId: string;
  actionType: HistoryActionType;
  description: string;
  metadata?: Record<string, any>;
  rectificationId?: string;
  reviewActionId?: string;
}

export async function validateAndTransitionState(
  ctx: StateTransitionContext,
  tx?: PrismaTransactionClient
): Promise<{
  success: boolean;
  inspection?: Inspection & { lastChange: HistoryNode | null };
  historyNode?: HistoryNode;
  error?: string;
}> {
  const { inspectionId, fromStatus, toStatus, operatorId, actionType, description, metadata, rectificationId, reviewActionId } = ctx;

  if (!canTransition(fromStatus, toStatus)) {
    return {
      success: false,
      error: `不允许从 ${fromStatus} 转换到 ${toStatus}`,
    };
  }

  const execute = async (db: PrismaTransactionClient) => {
    const inspection = await db.inspection.findUnique({
      where: { id: inspectionId },
      select: { status: true, updatedAt: true },
    });

    if (!inspection) {
      throw new Error("巡查记录不存在");
    }

    if (inspection.status !== fromStatus) {
      throw new Error(`状态不一致：当前状态为 ${inspection.status}，预期为 ${fromStatus}`);
    }

    const historyNode = await db.historyNode.create({
      data: {
        inspectionId,
        actionType,
        fromStatus,
        toStatus,
        description,
        operatorId,
        metadata: metadata || undefined,
        rectificationId,
        reviewActionId,
      },
    });

    const updatedInspection = await db.inspection.update({
      where: { id: inspectionId },
      data: {
        status: toStatus,
        lastChangeId: historyNode.id,
        updatedAt: new Date(),
      },
      include: {
        lastChange: true,
      },
    });

    return { inspection: updatedInspection, historyNode };
  };

  if (tx) {
    const result = await execute(tx);
    return { success: true, inspection: result.inspection, historyNode: result.historyNode };
  }

  const result = await prisma.$transaction(async (innerTx) => {
    return execute(innerTx);
  });

  return { success: true, inspection: result.inspection, historyNode: result.historyNode };
}

export async function createConsistentNotification(
  data: {
    type: NotificationType;
    title: string;
    content: string;
    inspectionId: string;
    userId: string;
    sentById: string;
  },
  tx?: PrismaTransactionClient
): Promise<Notification> {
  const db = tx || prisma;
  return db.notification.create({
    data: {
      type: data.type,
      title: data.title,
      content: data.content,
      inspectionId: data.inspectionId,
      userId: data.userId,
      sentById: data.sentById,
      isRead: false,
    },
  });
}

export async function getConsistentInspectionDetail(inspectionId: string) {
  return prisma.$transaction(async (tx) => {
    const inspection = await tx.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        building: true,
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        lastChange: {
          include: {
            operator: { select: { id: true, name: true, role: true } },
          },
        },
        evidences: {
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        rectifications: {
          include: {
            submittedBy: { select: { id: true, name: true } },
            evidences: {
              include: {
                uploadedBy: { select: { id: true, name: true } },
              },
            },
            reviewAction: {
              include: {
                reviewedBy: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
        historyNodes: {
          include: {
            operator: { select: { id: true, name: true, role: true } },
          },
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!inspection) {
      return null;
    }

    const latestNotification = await tx.notification.findFirst({
      where: { inspectionId },
      orderBy: { createdAt: "desc" },
      select: {
        inspection: { select: { status: true } },
        type: true,
        createdAt: true,
      },
    });

    const statusFromHistory = inspection.historyNodes[inspection.historyNodes.length - 1]?.toStatus;
    const statusFromInspection = inspection.status;
    const statusFromNotification = latestNotification?.inspection.status;

    const allStatuses = [statusFromInspection, statusFromHistory, statusFromNotification].filter(Boolean);
    const uniqueStatuses = new Set(allStatuses);

    const consistent = uniqueStatuses.size <= 1;

    if (!consistent) {
      console.warn(`状态不一致警告: 巡查记录 ${inspectionId}`, {
        fromInspection: statusFromInspection,
        fromHistory: statusFromHistory,
        fromNotification: statusFromNotification,
      });
    }

    const evidenceFromInspection = inspection.evidences.map((e) => e.id).sort();
    const evidenceFromRectifications = inspection.rectifications
      .flatMap((r) => r.evidences)
      .map((e) => e.id)
      .sort();

    const hasEvidenceInconsistency = evidenceFromRectifications.some(
      (id) => !evidenceFromInspection.includes(id)
    );

    if (hasEvidenceInconsistency) {
      console.warn(`证据不一致警告: 巡查记录 ${inspectionId} 存在证据引用差异`);
    }

    return {
      ...inspection,
      _consistency: {
        statusConsistent: consistent,
        evidenceConsistent: !hasEvidenceInconsistency,
        statusFromInspection,
        statusFromHistory,
        statusFromNotification,
      },
    };
  });
}

export async function validateEvidenceConsistency(
  inspectionId: string,
  _rectificationId: string,
  evidenceIds: string[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    include: { evidences: true },
  });

  if (!inspection) {
    errors.push("巡查记录不存在");
    return { valid: false, errors };
  }

  const inspectionEvidenceIds = new Set(inspection.evidences.map((e) => e.id));
  for (const evidenceId of evidenceIds) {
    if (!inspectionEvidenceIds.has(evidenceId)) {
      errors.push(`证据 ${evidenceId} 不属于该巡查记录`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

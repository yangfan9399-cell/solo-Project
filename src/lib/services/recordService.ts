import prisma from '$lib/prisma';
import type { RecordWithRelations, StatisticsData, ProcessingAction, ReviewAction } from '$lib/types';
import { RecordStatus, FieldChangeType, RecordType, UserRole } from '$lib/types';
import type { Prisma } from '@prisma/client';

export const recordIncludes = {
  creator: true,
  currentAssignee: true,
  nodes: {
    include: {
      handler: true,
      attachments: true
    },
    orderBy: { createdAt: 'asc' }
  },
  diffTrackers: {
    include: {
      changedBy: true
    },
    orderBy: { createdAt: 'desc' }
  },
  attachments: true,
  keyObjects: true
} satisfies Prisma.EquipmentRecordInclude;

export async function getAllRecords(filters?: {
  status?: string;
  type?: string;
  venue?: string;
  search?: string;
}): Promise<RecordWithRelations[]> {
  const where: Prisma.EquipmentRecordWhereInput = {};

  if (filters?.status && filters.status !== 'ALL') {
    where.status = filters.status as RecordStatus;
  }
  if (filters?.type && filters.type !== 'ALL') {
    where.type = filters.type as RecordType;
  }
  if (filters?.venue && filters.venue !== 'ALL') {
    where.venue = { contains: filters.venue };
  }
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { recordNo: { contains: filters.search } },
      { eventName: { contains: filters.search } }
    ];
  }

  return prisma.equipmentRecord.findMany({
    include: recordIncludes,
    orderBy: { createdAt: 'desc' },
    where
  }) as Promise<RecordWithRelations[]>;
}

export async function getRecordById(id: string): Promise<RecordWithRelations | null> {
  return prisma.equipmentRecord.findUnique({
    where: { id },
    include: recordIncludes
  }) as Promise<RecordWithRelations | null>;
}

export async function getStatistics(): Promise<StatisticsData> {
  const allRecords = await prisma.equipmentRecord.findMany({
    include: {
      nodes: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byVenue: Record<string, number> = {};
  let totalAmount = 0;
  let exceptionCount = 0;
  let totalProcessingTime = 0;
  let completedCount = 0;

  for (const record of allRecords) {
    const status = record.status;
    byStatus[status] = (byStatus[status] || 0) + 1;

    const type = record.type;
    byType[type] = (byType[type] || 0) + 1;

    if (record.venue) {
      byVenue[record.venue] = (byVenue[record.venue] || 0) + 1;
    }

    totalAmount += Number(record.amount);

    if (record.type !== RecordType.NORMAL_DELIVERY) {
      exceptionCount++;
    }

    if (record.status === RecordStatus.ARCHIVED && record.nodes.length >= 2) {
      const firstNode = record.nodes[0];
      const lastNode = record.nodes[record.nodes.length - 1];
      const processingTime = lastNode.createdAt.getTime() - firstNode.createdAt.getTime();
      totalProcessingTime += processingTime;
      completedCount++;
    }
  }

  return {
    total: allRecords.length,
    byStatus,
    byType,
    byVenue,
    totalAmount,
    exceptionCount,
    archivedCount: byStatus[RecordStatus.ARCHIVED] || 0,
    processingCount: byStatus[RecordStatus.PROCESSING] || 0,
    reviewingCount: byStatus[RecordStatus.REVIEWING] || 0,
    averageProcessingTime: completedCount > 0 ? totalProcessingTime / completedCount : 0
  };
}

export async function processRecord(
  recordId: string,
  handlerId: string,
  action: ProcessingAction
): Promise<RecordWithRelations | null> {
  const handler = await prisma.user.findUnique({ where: { id: handlerId } });
  if (!handler) {
    throw new Error('400:处理人不存在');
  }

  if (handler.role !== UserRole.FIELD_HANDLER && handler.role !== UserRole.ADMIN) {
    throw new Error('400:只有一线处理人或管理员可以执行处理操作');
  }

  const record = await prisma.equipmentRecord.findUnique({ where: { id: recordId } });
  if (!record || record.isArchived) {
    return null;
  }

  const latestNode = await prisma.recordNode.findFirst({
    where: { recordId },
    orderBy: { createdAt: 'desc' }
  });

  return prisma.$transaction(async (tx) => {
    const isSubmitReview = action.type === 'SUBMIT_REVIEW';

    const newNode = await tx.recordNode.create({
      data: {
        recordId,
        nodeType: '现场处理',
        status: RecordStatus.PROCESSING,
        description: '一线处理人补充记录',
        fieldNotes: action.fieldNotes,
        onSiteNotes: action.onSiteNotes,
        handlerId,
        parentNodeId: latestNode?.id
      }
    });

    const updateData: Prisma.EquipmentRecordUpdateInput = {};

    const isAdmin = handler.role === UserRole.ADMIN;

    if (isAdmin) {
      if (action.status) {
        updateData.status = action.status;
      }
      if (action.blockReason) {
        updateData.blockReason = action.blockReason;
      }
      if (action.remediationPath) {
        updateData.remediationPath = action.remediationPath;
      }
      if (action.basisAdopted) {
        updateData.basisAdopted = action.basisAdopted;
      }
      if (action.conclusion) {
        updateData.conclusion = action.conclusion;
      }
      if (action.amount !== undefined) {
        updateData.amount = action.amount;
      }
      if (action.scheduledTime) {
        updateData.scheduledTime = action.scheduledTime;
      }
      if (action.actualTime) {
        updateData.actualTime = action.actualTime;
      }
      if (action.responsibleParty) {
        updateData.responsibleParty = action.responsibleParty;
      }
    }

    if (action.fieldChanges && action.fieldChanges.length > 0) {
      for (const change of action.fieldChanges) {
        const isCriticalChange = [
          FieldChangeType.CRITICAL_TIME,
          FieldChangeType.RESPONSIBLE_PARTY,
          FieldChangeType.AMOUNT,
          FieldChangeType.EVIDENCE_CONCLUSION
        ].includes(change.changeType);

        if (isCriticalChange && !isAdmin) {
          continue;
        }

        await tx.diffTracker.create({
          data: {
            recordId,
            nodeId: newNode.id,
            fieldName: change.fieldName,
            changeType: change.changeType,
            oldValue: change.oldValue,
            newValue: change.newValue,
            diffDescription: change.diffDescription,
            changedById: handlerId,
            affectsSummary: isCriticalChange
          }
        });
      }
    }

    if (action.attachments && action.attachments.length > 0) {
      for (const att of action.attachments) {
        await tx.attachment.create({
          data: {
            recordId,
            nodeId: newNode.id,
            fileName: att.fileName,
            fileType: att.fileType,
            fileUrl: att.fileUrl,
            description: att.description,
            uploadedById: handlerId
          }
        });
      }
    }

    let lastNode = newNode;

    if (isSubmitReview) {
      const summaryParts: string[] = [];
      if (action.fieldNotes) summaryParts.push('补充业务记录');
      if (action.onSiteNotes) summaryParts.push('记录现场说明');
      if (action.attachments?.length) summaryParts.push(`上传${action.attachments.length}个证据附件`);
      const summary = summaryParts.length > 0 ? summaryParts.join('、') : '处理完成';

      const reviewNode = await tx.recordNode.create({
        data: {
          recordId,
          nodeType: '申请复核',
          status: RecordStatus.REVIEWING,
          description: `${summary}，已提交质控复核`,
          fieldNotes: action.fieldNotes,
          onSiteNotes: action.onSiteNotes,
          conclusion: '处理完成，申请质控复核',
          handlerId,
          parentNodeId: newNode.id
        }
      });

      updateData.status = RecordStatus.REVIEWING;
      lastNode = reviewNode;
    }

    await tx.equipmentRecord.update({
      where: { id: recordId },
      data: updateData
    });

    return tx.equipmentRecord.findUnique({
      where: { id: recordId },
      include: recordIncludes
    });
  }) as Promise<RecordWithRelations | null>;
}

export async function reviewRecord(
  recordId: string,
  reviewerId: string,
  action: ReviewAction
): Promise<RecordWithRelations | null> {
  const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } });
  if (!reviewer) {
    throw new Error('400:复核人不存在');
  }

  if (reviewer.role !== UserRole.QUALITY_REVIEWER && reviewer.role !== UserRole.ADMIN) {
    throw new Error('400:只有质控复核人或管理员可以执行复核操作');
  }

  const record = await prisma.equipmentRecord.findUnique({ where: { id: recordId } });
  if (!record || record.isArchived) {
    return null;
  }

  const latestNode = await prisma.recordNode.findFirst({
    where: { recordId },
    orderBy: { createdAt: 'desc' }
  });

  return prisma.$transaction(async (tx) => {
    let newStatus: RecordStatus;
    let nodeType: string;

    switch (action.type) {
      case 'CONFIRM':
        newStatus = RecordStatus.REVIEWING;
        nodeType = '质量复核-确认';
        break;
      case 'RETURN':
        newStatus = RecordStatus.RETURNED_FOR_SUPPLEMENT;
        nodeType = '质量复核-退回补证';
        break;
      case 'ARCHIVE':
        newStatus = RecordStatus.ARCHIVED;
        nodeType = '归档完成';
        break;
    }

    const newNode = await tx.recordNode.create({
      data: {
        recordId,
        nodeType,
        status: newStatus,
        description: action.conclusion,
        fieldNotes: action.fieldNotes,
        conclusion: action.conclusion,
        handlerId: reviewerId,
        parentNodeId: latestNode?.id,
        isArchived: action.type === 'ARCHIVE'
      }
    });

    const updateData: Prisma.EquipmentRecordUpdateInput = {
      status: newStatus,
      conclusion: action.conclusion,
      isArchived: action.type === 'ARCHIVE'
    };

    if (action.type === 'ARCHIVE') {
      updateData.currentAssigneeId = null;
    }

    if (action.fieldChanges && action.fieldChanges.length > 0) {
      for (const change of action.fieldChanges) {
        await tx.diffTracker.create({
          data: {
            recordId,
            nodeId: newNode.id,
            fieldName: change.fieldName,
            changeType: change.changeType,
            oldValue: change.oldValue,
            newValue: change.newValue,
            diffDescription: change.diffDescription,
            changedById: reviewerId,
            affectsSummary: [
              FieldChangeType.CRITICAL_TIME,
              FieldChangeType.RESPONSIBLE_PARTY,
              FieldChangeType.AMOUNT,
              FieldChangeType.EVIDENCE_CONCLUSION
            ].includes(change.changeType)
          }
        });
      }
    }

    await tx.equipmentRecord.update({
      where: { id: recordId },
      data: updateData
    });

    return tx.equipmentRecord.findUnique({
      where: { id: recordId },
      include: recordIncludes
    });
  }) as Promise<RecordWithRelations | null>;
}

export async function reprocessRecord(
  recordId: string,
  handlerId: string,
  reason: string
): Promise<RecordWithRelations | null> {
  const handler = await prisma.user.findUnique({ where: { id: handlerId } });
  if (!handler) {
    throw new Error('400:操作人不存在');
  }

  if (handler.role !== UserRole.QUALITY_REVIEWER && handler.role !== UserRole.ADMIN) {
    throw new Error('400:只有质控复核人或管理员可以执行重新处理操作');
  }

  const record = await prisma.equipmentRecord.findUnique({ where: { id: recordId } });
  if (!record || !record.isArchived) {
    return null;
  }

  const latestNode = await prisma.recordNode.findFirst({
    where: { recordId },
    orderBy: { createdAt: 'desc' }
  });

  return prisma.$transaction(async (tx) => {
    const newNode = await tx.recordNode.create({
      data: {
        recordId,
        nodeType: '重新处理',
        status: RecordStatus.PROCESSING,
        description: reason,
        fieldNotes: `归档后重新处理原因：${reason}`,
        conclusion: '已重新启动处理流程',
        handlerId,
        parentNodeId: latestNode?.id
      }
    });

    await tx.equipmentRecord.update({
      where: { id: recordId },
      data: {
        status: RecordStatus.PROCESSING,
        isArchived: false,
        currentAssigneeId: handlerId
      }
    });

    return tx.equipmentRecord.findUnique({
      where: { id: recordId },
      include: recordIncludes
    });
  }) as Promise<RecordWithRelations | null>;
}

export async function getExceptionRecords(): Promise<RecordWithRelations[]> {
  return prisma.equipmentRecord.findMany({
    where: {
      type: {
        in: [
          RecordType.QUALIFICATION_MISMATCH,
          RecordType.TIME_WINDOW_CONFLICT,
          RecordType.NOTIFICATION_UNCONFIRMED
        ]
      }
    },
    include: recordIncludes,
    orderBy: { createdAt: 'desc' }
  }) as Promise<RecordWithRelations[]>;
}

export async function getUsers() {
  return prisma.user.findMany({
    orderBy: { name: 'asc' }
  });
}

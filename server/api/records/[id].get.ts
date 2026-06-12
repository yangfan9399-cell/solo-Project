import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少记录ID' })
  }

  const record = await prisma.alarmRecord.findUnique({
    where: { id },
    include: {
      station: true,
      currentHandler: true,
      nodes: {
        include: {
          attachments: true,
          fieldDiffs: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      attachments: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      fieldDiffs: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!record) {
    throw createError({ statusCode: 404, message: '记录不存在' })
  }

  const result = {
    id: record.id,
    recordNo: record.recordNo,
    title: record.title,
    description: record.description,
    status: record.status,
    source: record.source,
    station: record.station,
    stationName: record.station.name,
    currentHandler: record.currentHandler,
    currentHandlerId: record.currentHandlerId,
    currentHandlerName: record.currentHandler.name,
    keyObject: record.keyObject,
    occurrenceTime: record.occurrenceTime.toISOString(),
    amount: record.amount.toString(),
    evidenceConclusion: record.evidenceConclusion,
    sampleType: record.sampleType,
    isArchived: record.isArchived,
    archivedAt: record.archivedAt?.toISOString(),
    archivedBy: record.archivedBy,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    nodes: record.nodes.map((node: any) => ({
      id: node.id,
      nodeType: node.nodeType,
      operatorId: node.operatorId,
      operatorName: node.operatorName,
      remark: node.remark,
      blockReason: node.blockReason,
      remedyPath: node.remedyPath,
      beforeSnapshot: node.beforeSnapshot,
      afterSnapshot: node.afterSnapshot,
      createdAt: node.createdAt.toISOString(),
      attachments: node.attachments.map((att: any) => ({
        id: att.id,
        name: att.name,
        url: att.url,
        version: att.version,
        fileType: att.fileType,
        size: Number(att.size)
      })),
      fieldDiffs: node.fieldDiffs.map((diff: any) => ({
        fieldName: diff.fieldName,
        fieldLabel: diff.fieldLabel,
        oldValue: diff.oldValue,
        newValue: diff.newValue,
        diffType: diff.diffType
      }))
    })),
    attachments: record.attachments.map((att: any) => ({
      id: att.id,
      name: att.name,
      url: att.url,
      version: att.version,
      fileType: att.fileType,
      size: Number(att.size)
    })),
    fieldDiffs: record.fieldDiffs.map((diff: any) => ({
      fieldName: diff.fieldName,
      fieldLabel: diff.fieldLabel,
      oldValue: diff.oldValue,
      newValue: diff.newValue,
      diffType: diff.diffType
    }))
  }

  return { success: true, data: result }
})

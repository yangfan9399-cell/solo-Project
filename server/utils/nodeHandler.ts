import prisma from './prisma'
import type { RecordStatus, NodeType } from '~/types'
import type { NodeActionPayload } from '~/types'

const KEY_FIELDS = ['occurrenceTime', 'keyObject', 'amount', 'evidenceConclusion']
const FIELD_LABELS: Record<string, string> = {
  occurrenceTime: '发生时间',
  keyObject: '责任对象',
  amount: '金额数量',
  evidenceConclusion: '证据结论'
}

async function getRecordSnapshot(recordId: string, tx: any = prisma) {
  const record = await tx.alarmRecord.findUnique({
    where: { id: recordId },
    include: { station: true, currentHandler: true }
  })
  if (!record) return {}
  return {
    title: record.title,
    description: record.description,
    source: record.source,
    keyObject: record.keyObject,
    occurrenceTime: record.occurrenceTime.toISOString(),
    amount: record.amount.toString(),
    evidenceConclusion: record.evidenceConclusion
  }
}

function calculateFieldDiffs(
  oldSnapshot: Record<string, any>,
  newSnapshot: Record<string, any>,
  updatedFields?: NodeActionPayload['updatedFields']
) {
  const diffs: Array<{
    fieldName: string
    fieldLabel: string
    oldValue: string
    newValue: string
    diffType: string
  }> = []

  const sourceFields = updatedFields || (newSnapshot as any)

  if (sourceFields) {
    for (const [key, value] of Object.entries(sourceFields)) {
      if (KEY_FIELDS.includes(key) && value !== undefined) {
        const oldVal = oldSnapshot[key] !== undefined ? String(oldSnapshot[key]) : ''
        const newVal = String(value)
        if (oldVal !== newVal) {
          diffs.push({
            fieldName: key,
            fieldLabel: FIELD_LABELS[key] || key,
            oldValue: oldVal,
            newValue: newVal,
            diffType: key === 'amount' ? 'amount' : key === 'occurrenceTime' ? 'time' : key === 'keyObject' ? 'object' : 'conclusion'
          })
        }
      }
    }
  }

  for (const key of KEY_FIELDS) {
    const oldVal = oldSnapshot[key] !== undefined ? String(oldSnapshot[key]) : ''
    const newVal = newSnapshot[key] !== undefined ? String(newSnapshot[key]) : ''
    if (oldVal !== newVal && !diffs.find(d => d.fieldName === key)) {
      diffs.push({
        fieldName: key,
        fieldLabel: FIELD_LABELS[key] || key,
        oldValue: oldVal,
        newValue: newVal,
        diffType: key === 'amount' ? 'amount' : key === 'occurrenceTime' ? 'time' : key === 'keyObject' ? 'object' : 'conclusion'
      })
    }
  }

  return diffs
}

export async function createNode(
  recordId: string,
  nodeType: string,
  newStatus: string,
  payload: NodeActionPayload,
  newHandlerId?: string
) {
  return await prisma.$transaction(async (tx: any) => {
    const record = await tx.alarmRecord.findUnique({
      where: { id: recordId },
      include: { currentHandler: true }
    })

    if (!record) {
      throw new Error('记录不存在')
    }

    const beforeSnapshot = await getRecordSnapshot(recordId, tx)

    const updateData: any = {
      status: newStatus,
      updatedAt: new Date()
    }

    if (newHandlerId) {
      updateData.currentHandlerId = newHandlerId
    }

    const uf = payload.updatedFields || (payload as any)

    if (uf.occurrenceTime) {
      updateData.occurrenceTime = new Date(uf.occurrenceTime)
    }
    if (uf.keyObject !== undefined) {
      updateData.keyObject = uf.keyObject
    }
    if (uf.amount !== undefined) {
      updateData.amount = uf.amount
    }
    if (uf.evidenceConclusion !== undefined) {
      updateData.evidenceConclusion = uf.evidenceConclusion
    }

    if (nodeType === 'ARCHIVE') {
      updateData.isArchived = true
      updateData.archivedAt = new Date()
      updateData.archivedBy = payload.operatorName
    }

    if (nodeType === 'REOPEN') {
      updateData.isArchived = false
      updateData.archivedAt = null
      updateData.archivedBy = null
    }

    const updatedRecord = await tx.alarmRecord.update({
      where: { id: recordId },
      data: updateData
    })

    const uf2 = payload.updatedFields || (payload as any)
    const afterSnapshot = {
      ...beforeSnapshot,
      ...(uf2.occurrenceTime && { occurrenceTime: uf2.occurrenceTime }),
      ...(uf2.keyObject !== undefined && { keyObject: uf2.keyObject }),
      ...(uf2.amount !== undefined && { amount: String(uf2.amount) }),
      ...(uf2.evidenceConclusion !== undefined && { evidenceConclusion: uf2.evidenceConclusion })
    }

    const fieldDiffs = calculateFieldDiffs(beforeSnapshot, afterSnapshot, payload.updatedFields || uf2)

    const node = await tx.recordNode.create({
      data: {
        recordId,
        nodeType,
        operatorId: payload.operatorId,
        operatorName: payload.operatorName,
        remark: payload.remark,
        blockReason: payload.blockReason,
        remedyPath: payload.remedyPath,
        beforeSnapshot,
        afterSnapshot
      }
    })

    if (fieldDiffs.length > 0) {
      for (const diff of fieldDiffs) {
        await tx.fieldDiff.create({
          data: {
            ...diff,
            recordId,
            nodeId: node.id
          }
        })
      }
    }

    if (payload.attachments && payload.attachments.length > 0) {
      for (const att of payload.attachments) {
        await tx.attachment.create({
          data: {
            recordId,
            nodeId: node.id,
            name: att.name,
            url: att.url,
            version: att.version,
            fileType: att.fileType || 'application/octet-stream',
            size: BigInt(att.size || 0),
            uploadedBy: payload.operatorName
          }
        })
      }
    }

    return {
      record: updatedRecord,
      node,
      fieldDiffs
    }
  })
}

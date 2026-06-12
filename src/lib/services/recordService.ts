import { query, transaction, cuid, type TxClient } from '$lib/db';
import type {
  RecordWithRelations,
  StatisticsData,
  ProcessingAction,
  ReviewAction,
  User,
  RecordNode,
  DiffTracker,
  Attachment,
  KeyObject,
} from '$lib/types';
import { RecordStatus, FieldChangeType, RecordType, UserRole } from '$lib/types';

type AnyRow = Record<string, any>;

function rowToUser(row: AnyRow): User {
  return {
    id: row.id,
    name: row.name,
    employeeId: row.employeeId,
    role: row.role,
    department: row.department,
    phone: row.phone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToRecord(row: AnyRow) {
  return {
    id: row.id,
    recordNo: row.recordNo,
    title: row.title,
    type: row.type,
    status: row.status,
    source: row.source,
    venue: row.venue,
    eventName: row.eventName,
    equipmentList: row.equipmentList,
    scheduledTime: row.scheduledTime,
    actualTime: row.actualTime,
    amount: row.amount,
    isArchived: row.isArchived,
    currentAssigneeId: row.currentAssigneeId,
    conclusion: row.conclusion,
    blockReason: row.blockReason,
    remediationPath: row.remediationPath,
    basisAdopted: row.basisAdopted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    creatorId: row.creatorId,
  };
}

function rowToNode(row: AnyRow): RecordNode {
  return {
    id: row.id,
    recordId: row.recordId,
    nodeType: row.nodeType,
    status: row.status,
    description: row.description,
    fieldNotes: row.fieldNotes,
    onSiteNotes: row.onSiteNotes,
    conclusion: row.conclusion,
    handlerId: row.handlerId,
    createdAt: row.createdAt,
    isArchived: row.isArchived,
    parentNodeId: row.parentNodeId,
  };
}

function rowToDiff(row: AnyRow): DiffTracker {
  return {
    id: row.id,
    recordId: row.recordId,
    nodeId: row.nodeId,
    fieldName: row.fieldName,
    changeType: row.changeType,
    oldValue: row.oldValue,
    newValue: row.newValue,
    diffDescription: row.diffDescription,
    changedById: row.changedById,
    createdAt: row.createdAt,
    affectsSummary: row.affectsSummary,
  };
}

function rowToAttachment(row: AnyRow): Attachment {
  return {
    id: row.id,
    recordId: row.recordId,
    nodeId: row.nodeId,
    fileName: row.fileName,
    fileType: row.fileType,
    fileUrl: row.fileUrl,
    description: row.description,
    uploadedById: row.uploadedById,
    createdAt: row.createdAt,
  };
}

function rowToKeyObject(row: AnyRow): KeyObject {
  return {
    id: row.id,
    recordId: row.recordId,
    objectType: row.objectType,
    objectName: row.objectName,
    objectValue: row.objectValue,
    isCritical: row.isCritical,
    createdAt: row.createdAt,
  };
}

async function assembleRecords(records: AnyRow[]): Promise<RecordWithRelations[]> {
  if (records.length === 0) return [];

  const recordIds = records.map((r) => r.id);
  const idList = recordIds.map((_, i) => `$${i + 1}`).join(', ');

  const [nodesRes, diffsRes, attsRes, keysRes, usersRes, nodeAttsRes] = await Promise.all([
    query(
      `SELECT * FROM "RecordNode" WHERE "recordId" IN (${idList}) ORDER BY "createdAt" ASC`,
      recordIds,
    ),
    query(
      `SELECT * FROM "DiffTracker" WHERE "recordId" IN (${idList}) ORDER BY "createdAt" DESC`,
      recordIds,
    ),
    query(
      `SELECT * FROM "Attachment" WHERE "recordId" IN (${idList}) AND "nodeId" IS NULL ORDER BY "createdAt" DESC`,
      recordIds,
    ),
    query(
      `SELECT * FROM "KeyObject" WHERE "recordId" IN (${idList}) ORDER BY "createdAt" ASC`,
      recordIds,
    ),
    query(`SELECT * FROM "User"`),
    query(
      `SELECT * FROM "Attachment" WHERE "recordId" IN (${idList}) AND "nodeId" IS NOT NULL ORDER BY "createdAt" ASC`,
      recordIds,
    ),
  ]);

  const userMap = new Map<string, User>();
  for (const row of usersRes.rows) {
    userMap.set(row.id, rowToUser(row));
  }

  const nodesByRecord = new Map<string, AnyRow[]>();
  for (const row of nodesRes.rows) {
    if (!nodesByRecord.has(row.recordId)) nodesByRecord.set(row.recordId, []);
    nodesByRecord.get(row.recordId)!.push(row);
  }

  const diffsByRecord = new Map<string, AnyRow[]>();
  for (const row of diffsRes.rows) {
    if (!diffsByRecord.has(row.recordId)) diffsByRecord.set(row.recordId, []);
    diffsByRecord.get(row.recordId)!.push(row);
  }

  const attsByRecord = new Map<string, AnyRow[]>();
  for (const row of attsRes.rows) {
    if (!attsByRecord.has(row.recordId)) attsByRecord.set(row.recordId, []);
    attsByRecord.get(row.recordId)!.push(row);
  }

  const keysByRecord = new Map<string, AnyRow[]>();
  for (const row of keysRes.rows) {
    if (!keysByRecord.has(row.recordId)) keysByRecord.set(row.recordId, []);
    keysByRecord.get(row.recordId)!.push(row);
  }

  const attsByNode = new Map<string, AnyRow[]>();
  for (const row of nodeAttsRes.rows) {
    if (!attsByNode.has(row.nodeId)) attsByNode.set(row.nodeId, []);
    attsByNode.get(row.nodeId)!.push(row);
  }

  return records.map((row) => {
    const rec = rowToRecord(row);
    const nodeRows = nodesByRecord.get(rec.id) || [];
    const diffRows = diffsByRecord.get(rec.id) || [];
    const attRows = attsByRecord.get(rec.id) || [];
    const keyRows = keysByRecord.get(rec.id) || [];

    const nodes = nodeRows.map((nr) => {
      const node = rowToNode(nr);
      const handler = userMap.get(node.handlerId) || ({} as User);
      const nodeAtts = (attsByNode.get(node.id) || []).map(rowToAttachment);
      return { ...node, handler, attachments: nodeAtts };
    });

    const diffTrackers = diffRows.map((dr) => {
      const diff = rowToDiff(dr);
      const changedBy = userMap.get(diff.changedById) || ({} as User);
      return { ...diff, changedBy };
    });

    const attachments = attRows.map(rowToAttachment);
    const keyObjects = keyRows.map(rowToKeyObject);

    return {
      ...rec,
      creator: userMap.get(rec.creatorId) || null,
      currentAssignee: rec.currentAssigneeId ? userMap.get(rec.currentAssigneeId) || null : null,
      nodes,
      diffTrackers,
      attachments,
      keyObjects,
    };
  });
}

export async function getAllRecords(filters?: {
  status?: string;
  type?: string;
  venue?: string;
  search?: string;
}): Promise<RecordWithRelations[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters?.status && filters.status !== 'ALL') {
    params.push(filters.status);
    whereClauses.push(`status::text = $${params.length}`);
  }
  if (filters?.type && filters.type !== 'ALL') {
    params.push(filters.type);
    whereClauses.push(`type::text = $${params.length}`);
  }
  if (filters?.venue && filters.venue !== 'ALL') {
    params.push(`%${filters.venue}%`);
    whereClauses.push(`venue LIKE $${params.length}`);
  }
  if (filters?.search) {
    params.push(`%${filters.search}%`);
    whereClauses.push(`(title LIKE $${params.length} OR "recordNo" LIKE $${params.length} OR "eventName" LIKE $${params.length})`);
  }

  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const res = await query(
    `SELECT * FROM "EquipmentRecord" ${where} ORDER BY "createdAt" DESC`,
    params,
  );

  return assembleRecords(res.rows);
}

export async function getRecordById(id: string): Promise<RecordWithRelations | null> {
  const res = await query(`SELECT * FROM "EquipmentRecord" WHERE id = $1`, [id]);
  if (res.rows.length === 0) return null;
  const records = await assembleRecords(res.rows);
  return records[0] || null;
}

export async function getStatistics(): Promise<StatisticsData> {
  const res = await query(`SELECT * FROM "EquipmentRecord"`);
  const allRecords = res.rows;

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byVenue: Record<string, number> = {};
  let totalAmount = 0;
  let exceptionCount = 0;
  let totalProcessingTime = 0;
  let completedCount = 0;

  const nodeRes = await query(`
    SELECT rn.* 
    FROM "RecordNode" rn
    WHERE rn."recordId" IN (SELECT id FROM "EquipmentRecord")
    ORDER BY rn."createdAt" ASC
  `);

  const nodesByRecord = new Map<string, AnyRow[]>();
  for (const row of nodeRes.rows) {
    if (!nodesByRecord.has(row.recordId)) nodesByRecord.set(row.recordId, []);
    nodesByRecord.get(row.recordId)!.push(row);
  }

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

    const nodes = nodesByRecord.get(record.id) || [];
    if (record.status === RecordStatus.ARCHIVED && nodes.length >= 2) {
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      const processingTime =
        new Date(lastNode.createdAt).getTime() - new Date(firstNode.createdAt).getTime();
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
    averageProcessingTime: completedCount > 0 ? totalProcessingTime / completedCount : 0,
  };
}

export async function processRecord(
  recordId: string,
  handlerId: string,
  action: ProcessingAction,
): Promise<RecordWithRelations | null> {
  const userRes = await query(`SELECT * FROM "User" WHERE id = $1`, [handlerId]);
  const handler = userRes.rows[0];
  if (!handler) {
    throw new Error('400:处理人不存在');
  }

  if (handler.role !== UserRole.FIELD_HANDLER && handler.role !== UserRole.ADMIN) {
    throw new Error('400:只有一线处理人或管理员可以执行处理操作');
  }

  const recordRes = await query(`SELECT * FROM "EquipmentRecord" WHERE id = $1`, [recordId]);
  const record = recordRes.rows[0];
  if (!record || record.isArchived) {
    return null;
  }

  const latestNodeRes = await query(
    `SELECT * FROM "RecordNode" WHERE "recordId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [recordId],
  );
  const latestNode = latestNodeRes.rows[0];

  const isSubmitReview = action.type === 'SUBMIT_REVIEW';
  const isAdmin = handler.role === UserRole.ADMIN;

  return transaction(async (tx) => {
    const newNodeId = cuid();
    const now = new Date();

    await tx.query(
      `INSERT INTO "RecordNode" (
        id, "recordId", "nodeType", status, description,
        "fieldNotes", "onSiteNotes", "handlerId", "parentNodeId",
        "createdAt", "isArchived"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        newNodeId,
        recordId,
        '现场处理',
        RecordStatus.PROCESSING,
        '一线处理人补充记录',
        action.fieldNotes || null,
        action.onSiteNotes || null,
        handlerId,
        latestNode?.id || null,
        now,
        false,
      ],
    );

    const updateFields: string[] = [];
    const updateParams: any[] = [];

    if (isAdmin) {
      if (action.status) {
        updateParams.push(action.status);
        updateFields.push(`status = $${updateParams.length}`);
      }
      if (action.blockReason) {
        updateParams.push(action.blockReason);
        updateFields.push(`"blockReason" = $${updateParams.length}`);
      }
      if (action.remediationPath) {
        updateParams.push(action.remediationPath);
        updateFields.push(`"remediationPath" = $${updateParams.length}`);
      }
      if (action.basisAdopted) {
        updateParams.push(action.basisAdopted);
        updateFields.push(`"basisAdopted" = $${updateParams.length}`);
      }
      if (action.conclusion) {
        updateParams.push(action.conclusion);
        updateFields.push(`conclusion = $${updateParams.length}`);
      }
      if (action.amount !== undefined) {
        updateParams.push(action.amount);
        updateFields.push(`amount = $${updateParams.length}`);
      }
      if (action.scheduledTime) {
        updateParams.push(action.scheduledTime);
        updateFields.push(`"scheduledTime" = $${updateParams.length}`);
      }
      if (action.actualTime) {
        updateParams.push(action.actualTime);
        updateFields.push(`"actualTime" = $${updateParams.length}`);
      }
      if (action.responsibleParty) {
        updateParams.push(action.responsibleParty);
        updateFields.push(`"responsibleParty" = $${updateParams.length}`);
      }
    }

    if (action.fieldChanges && action.fieldChanges.length > 0) {
      for (const change of action.fieldChanges) {
        const isCriticalChange = [
          FieldChangeType.CRITICAL_TIME,
          FieldChangeType.RESPONSIBLE_PARTY,
          FieldChangeType.AMOUNT,
          FieldChangeType.EVIDENCE_CONCLUSION,
        ].includes(change.changeType);

        if (isCriticalChange && !isAdmin) {
          continue;
        }

        const diffId = cuid();
        await tx.query(
          `INSERT INTO "DiffTracker" (
            id, "recordId", "nodeId", "fieldName", "changeType",
            "oldValue", "newValue", "diffDescription", "changedById",
            "createdAt", "affectsSummary"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            diffId,
            recordId,
            newNodeId,
            change.fieldName,
            change.changeType,
            change.oldValue ?? null,
            change.newValue ?? null,
            change.diffDescription,
            handlerId,
            now,
            isCriticalChange,
          ],
        );
      }
    }

    if (action.attachments && action.attachments.length > 0) {
      for (const att of action.attachments) {
        const attId = cuid();
        await tx.query(
          `INSERT INTO "Attachment" (
            id, "recordId", "nodeId", "fileName", "fileType",
            "fileUrl", description, "uploadedById", "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            attId,
            recordId,
            newNodeId,
            att.fileName,
            att.fileType,
            att.fileUrl,
            att.description || null,
            handlerId,
            now,
          ],
        );
      }
    }

    let lastNodeId = newNodeId;

    if (isSubmitReview) {
      const summaryParts: string[] = [];
      if (action.fieldNotes) summaryParts.push('补充业务记录');
      if (action.onSiteNotes) summaryParts.push('记录现场说明');
      if (action.attachments?.length) summaryParts.push(`上传${action.attachments.length}个证据附件`);
      const summary = summaryParts.length > 0 ? summaryParts.join('、') : '处理完成';

      const reviewNodeId = cuid();
      await tx.query(
        `INSERT INTO "RecordNode" (
          id, "recordId", "nodeType", status, description,
          "fieldNotes", "onSiteNotes", conclusion, "handlerId",
          "parentNodeId", "createdAt", "isArchived"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          reviewNodeId,
          recordId,
          '申请复核',
          RecordStatus.REVIEWING,
          `${summary}，已提交质控复核`,
          action.fieldNotes || null,
          action.onSiteNotes || null,
          '处理完成，申请质控复核',
          handlerId,
          newNodeId,
          now,
          false,
        ],
      );

      updateParams.push(RecordStatus.REVIEWING);
      updateFields.push(`status = $${updateParams.length}`);
      lastNodeId = reviewNodeId;
    }

    if (updateFields.length > 0) {
      updateParams.push(recordId);
      await tx.query(
        `UPDATE "EquipmentRecord" SET ${updateFields.join(', ')}, "updatedAt" = NOW() WHERE id = $${updateParams.length}`,
        updateParams,
      );
    }

    return null;
  }).then(async () => {
    return getRecordById(recordId);
  });
}

export async function reviewRecord(
  recordId: string,
  reviewerId: string,
  action: ReviewAction,
): Promise<RecordWithRelations | null> {
  const userRes = await query(`SELECT * FROM "User" WHERE id = $1`, [reviewerId]);
  const reviewer = userRes.rows[0];
  if (!reviewer) {
    throw new Error('400:复核人不存在');
  }

  if (reviewer.role !== UserRole.QUALITY_REVIEWER && reviewer.role !== UserRole.ADMIN) {
    throw new Error('400:只有质控复核人或管理员可以执行复核操作');
  }

  const recordRes = await query(`SELECT * FROM "EquipmentRecord" WHERE id = $1`, [recordId]);
  const record = recordRes.rows[0];
  if (!record || record.isArchived) {
    return null;
  }

  const latestNodeRes = await query(
    `SELECT * FROM "RecordNode" WHERE "recordId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [recordId],
  );
  const latestNode = latestNodeRes.rows[0];

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
    default:
      throw new Error('400:无效的复核操作类型');
  }

  return transaction(async (tx) => {
    const newNodeId = cuid();
    const now = new Date();

    await tx.query(
      `INSERT INTO "RecordNode" (
        id, "recordId", "nodeType", status, description,
        "fieldNotes", conclusion, "handlerId", "parentNodeId",
        "createdAt", "isArchived"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        newNodeId,
        recordId,
        nodeType,
        newStatus,
        action.conclusion,
        action.fieldNotes || null,
        action.conclusion,
        reviewerId,
        latestNode?.id || null,
        now,
        action.type === 'ARCHIVE',
      ],
    );

    if (action.fieldChanges && action.fieldChanges.length > 0) {
      for (const change of action.fieldChanges) {
        const isCriticalChange = [
          FieldChangeType.CRITICAL_TIME,
          FieldChangeType.RESPONSIBLE_PARTY,
          FieldChangeType.AMOUNT,
          FieldChangeType.EVIDENCE_CONCLUSION,
        ].includes(change.changeType);

        const diffId = cuid();
        await tx.query(
          `INSERT INTO "DiffTracker" (
            id, "recordId", "nodeId", "fieldName", "changeType",
            "oldValue", "newValue", "diffDescription", "changedById",
            "createdAt", "affectsSummary"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            diffId,
            recordId,
            newNodeId,
            change.fieldName,
            change.changeType,
            change.oldValue ?? null,
            change.newValue ?? null,
            change.diffDescription,
            reviewerId,
            now,
            isCriticalChange,
          ],
        );
      }
    }

    const updateFields: string[] = [];
    const updateParams: any[] = [];

    updateParams.push(newStatus);
    updateFields.push(`status = $${updateParams.length}`);

    updateParams.push(action.conclusion);
    updateFields.push(`conclusion = $${updateParams.length}`);

    updateParams.push(action.type === 'ARCHIVE');
    updateFields.push(`"isArchived" = $${updateParams.length}`);

    if (action.type === 'ARCHIVE') {
      updateParams.push(null);
      updateFields.push(`"currentAssigneeId" = $${updateParams.length}`);
    }

    updateParams.push(recordId);
    await tx.query(
      `UPDATE "EquipmentRecord" SET ${updateFields.join(', ')}, "updatedAt" = NOW() WHERE id = $${updateParams.length}`,
      updateParams,
    );

    return null;
  }).then(async () => {
    return getRecordById(recordId);
  });
}

export async function reprocessRecord(
  recordId: string,
  handlerId: string,
  reason: string,
): Promise<RecordWithRelations | null> {
  const userRes = await query(`SELECT * FROM "User" WHERE id = $1`, [handlerId]);
  const handler = userRes.rows[0];
  if (!handler) {
    throw new Error('400:操作人不存在');
  }

  if (handler.role !== UserRole.QUALITY_REVIEWER && handler.role !== UserRole.ADMIN) {
    throw new Error('400:只有质控复核人或管理员可以执行重新处理操作');
  }

  const recordRes = await query(`SELECT * FROM "EquipmentRecord" WHERE id = $1`, [recordId]);
  const record = recordRes.rows[0];
  if (!record || !record.isArchived) {
    return null;
  }

  const latestNodeRes = await query(
    `SELECT * FROM "RecordNode" WHERE "recordId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [recordId],
  );
  const latestNode = latestNodeRes.rows[0];

  return transaction(async (tx) => {
    const newNodeId = cuid();
    const now = new Date();

    await tx.query(
      `INSERT INTO "RecordNode" (
        id, "recordId", "nodeType", status, description,
        "fieldNotes", conclusion, "handlerId", "parentNodeId",
        "createdAt", "isArchived"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        newNodeId,
        recordId,
        '重新处理',
        RecordStatus.PROCESSING,
        reason,
        `归档后重新处理原因：${reason}`,
        '已重新启动处理流程',
        handlerId,
        latestNode?.id || null,
        now,
        false,
      ],
    );

    await tx.query(
      `UPDATE "EquipmentRecord"
       SET status = $1, "isArchived" = $2, "currentAssigneeId" = $3, "updatedAt" = NOW()
       WHERE id = $4`,
      [RecordStatus.PROCESSING, false, handlerId, recordId],
    );

    return null;
  }).then(async () => {
    return getRecordById(recordId);
  });
}

export async function getExceptionRecords(): Promise<RecordWithRelations[]> {
  const res = await query(
    `SELECT * FROM "EquipmentRecord"
     WHERE type::text = ANY($1::text[])
     ORDER BY "createdAt" DESC`,
    [
      [
        RecordType.QUALIFICATION_MISMATCH,
        RecordType.TIME_WINDOW_CONFLICT,
        RecordType.NOTIFICATION_UNCONFIRMED,
      ],
    ],
  );

  return assembleRecords(res.rows);
}

export async function getUsers(): Promise<User[]> {
  const res = await query(`SELECT * FROM "User" ORDER BY name ASC`);
  return res.rows.map(rowToUser);
}

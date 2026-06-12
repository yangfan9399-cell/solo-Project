import {
  UserRole,
  OrderStatus,
  NodeType,
  DifferenceType,
  SampleCategory,
} from "@prisma/client";

export type User = {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DispatchOrder = {
  id: string;
  orderNo: string;
  title: string;
  content: string;
  source: string;
  sourceDept: string;
  sampleCategory?: SampleCategory | null;
  gateNo: string;
  reservoirName: string;
  targetOpening?: number | null;
  actualOpening?: number | null;
  targetFlow?: number | null;
  actualFlow?: number | null;
  amount?: number | null;
  planExecuteTime?: Date | null;
  actualExecuteTime?: Date | null;
  reviewTime?: Date | null;
  responsibleUnit: string;
  responsiblePerson: string;
  operatorId?: string | null;
  status: OrderStatus;
  isArchived: boolean;
  currentNodeId?: string | null;
  blockReason?: string | null;
  remedyPath?: string | null;
  summary?: string | null;
  conclusion?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderNode = {
  id: string;
  orderId: string;
  nodeType: NodeType;
  status: OrderStatus;
  operatorId: string;
  operatorName: string;
  actionSummary?: string | null;
  remark?: string | null;
  evidence?: string | null;
  snapshotData?: any;
  createdAt: Date;
};

export type OrderAttachment = {
  id: string;
  orderId: string;
  nodeId?: string | null;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string | null;
};

export type FieldDifference = {
  id: string;
  orderId: string;
  nodeId?: string | null;
  fieldName: string;
  fieldLabel: string;
  oldValue?: string | null;
  newValue?: string | null;
  differenceType: DifferenceType;
  changedBy: string;
  changedAt: Date;
};

export type ReviewRecord = {
  id: string;
  orderId: string;
  reviewerId: string;
  reviewerName: string;
  conclusion: string;
  opinion?: string | null;
  blockReason?: string | null;
  remedyPath?: string | null;
  isApproved: boolean;
  reviewedAt: Date;
};

function uuid(): string {
  return (
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }) +
    "-" +
    Date.now().toString(36)
  );
}

export class InMemoryDB {
  users: Map<string, User> = new Map();
  dispatchOrders: Map<string, DispatchOrder> = new Map();
  orderNodes: Map<string, OrderNode> = new Map();
  orderAttachments: Map<string, OrderAttachment> = new Map();
  fieldDifferences: Map<string, FieldDifference> = new Map();
  reviewRecords: Map<string, ReviewRecord> = new Map();

  reset() {
    this.users.clear();
    this.dispatchOrders.clear();
    this.orderNodes.clear();
    this.orderAttachments.clear();
    this.fieldDifferences.clear();
    this.reviewRecords.clear();
  }

  pick<T extends Record<string, any>>(obj: T, select: Record<string, boolean> | undefined): any {
    if (!select) return obj;
    const result: any = {};
    for (const key of Object.keys(select)) {
      if (select[key] && key in obj) {
        result[key] = (obj as any)[key];
      }
    }
    return result;
  }

  matchWhere<T extends Record<string, any>>(obj: T, where: any): boolean {
    if (!where) return true;
    for (const key of Object.keys(where)) {
      const val = where[key];
      if (key === "AND") {
        if (!val.every((w: any) => this.matchWhere(obj, w))) return false;
      } else if (key === "OR") {
        if (!val.some((w: any) => this.matchWhere(obj, w))) return false;
      } else if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
        const objVal = (obj as any)[key];
        if ("equals" in val) {
          if (objVal !== val.equals) return false;
        }
        if ("contains" in val) {
          if (
            typeof objVal !== "string" ||
            !objVal.includes(String(val.contains))
          )
            return false;
        }
      } else {
        if ((obj as any)[key] !== val) return false;
      }
    }
    return true;
  }

  sortList<T>(list: T[], orderBy: any): T[] {
    if (!orderBy) return list;
    const entries = Object.entries(orderBy);
    return [...list].sort((a: any, b: any) => {
      for (const [field, dir] of entries as [string, "asc" | "desc"][]) {
        const va = a[field];
        const vb = b[field];
        if (va instanceof Date && vb instanceof Date) {
          const cmp = va.getTime() - vb.getTime();
          if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
        }
        if (va !== vb) {
          return dir === "asc"
            ? va > vb
              ? 1
              : -1
            : va > vb
            ? -1
            : 1;
        }
      }
      return 0;
    });
  }

  // ====== User ======
  async userUpsert(args: {
    where: { id: string };
    update: any;
    create: any;
  }): Promise<User> {
    const existing = this.users.get(args.where.id);
    if (existing) {
      const updated: User = { ...existing, ...args.update, updatedAt: new Date() };
      this.users.set(args.where.id, updated);
      return updated;
    }
    const created: User = {
      id: args.where.id,
      name: args.create.name,
      role: args.create.role,
      avatar: args.create.avatar ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...args.create,
    };
    this.users.set(created.id, created);
    return created;
  }

  // ====== DispatchOrder ======
  orderFindMany(args?: {
    where?: any;
    select?: Record<string, boolean>;
    orderBy?: any;
  }): any[] {
    let list = Array.from(this.dispatchOrders.values());
    if (args?.where) list = list.filter((o) => this.matchWhere(o, args.where));
    if (args?.orderBy) list = this.sortList(list, args.orderBy);
    if (args?.select) return list.map((o) => this.pick(o, args.select));
    return list;
  }

  orderFindUnique(args: { where: { id: string }; include?: any }): any | null {
    const order = this.dispatchOrders.get(args.where.id) ?? null;
    if (!order) return null;
    if (!args.include) return order;
    const result: any = { ...order };
    if (args.include.nodes) {
      const ob = args.include.nodes?.orderBy;
      let nodes = Array.from(this.orderNodes.values()).filter(
        (n) => n.orderId === order.id
      );
      if (ob) nodes = this.sortList(nodes, ob);
      result.nodes = nodes;
    }
    if (args.include.attachments) {
      const ob = args.include.attachments?.orderBy;
      let atts = Array.from(this.orderAttachments.values()).filter(
        (a) => a.orderId === order.id
      );
      if (ob) atts = this.sortList(atts, ob);
      result.attachments = atts;
    }
    if (args.include.differences) {
      const ob = args.include.differences?.orderBy;
      let diffs = Array.from(this.fieldDifferences.values()).filter(
        (d) => d.orderId === order.id
      );
      if (ob) diffs = this.sortList(diffs, ob);
      result.differences = diffs;
    }
    if (args.include.reviewRecords) {
      const ob = args.include.reviewRecords?.orderBy;
      let recs = Array.from(this.reviewRecords.values()).filter(
        (r) => r.orderId === order.id
      );
      if (ob) recs = this.sortList(recs, ob);
      result.reviewRecords = recs;
    }
    return result;
  }

  orderGroupBy(args: { by: string[]; _count: true }): any[] {
    const groups = new Map<string, { key: any; _count: number }>();
    for (const order of this.dispatchOrders.values()) {
      const keyParts = args.by.map((f) => (order as any)[f]);
      const keyStr = JSON.stringify(keyParts);
      if (!groups.has(keyStr)) {
        const obj: any = { _count: 0 };
        args.by.forEach((f, i) => (obj[f] = keyParts[i]));
        groups.set(keyStr, obj);
      }
      (groups.get(keyStr)! as any)._count++;
    }
    return Array.from(groups.values());
  }

  orderUpdate(args: {
    where: { id: string };
    data: any;
    include?: any;
    select?: Record<string, boolean>;
  }): any | null {
    const existing = this.dispatchOrders.get(args.where.id);
    if (!existing) return null;
    const data = args.data;
    for (const [k, v] of Object.entries(data)) {
      if (k === "nodes" || k === "attachments" || k === "differences" || k === "reviewRecords") continue;
      (existing as any)[k] = v;
    }
    existing.updatedAt = new Date();
    this.dispatchOrders.set(existing.id, existing);
    if (args.include) return this.orderFindUnique({ where: { id: existing.id }, include: args.include });
    if (args.select) return this.pick(existing, args.select);
    return existing;
  }

  orderCreate(data: any): DispatchOrder {
    const order: DispatchOrder = {
      id: data.id ?? uuid(),
      orderNo: data.orderNo,
      title: data.title,
      content: data.content,
      source: data.source,
      sourceDept: data.sourceDept,
      sampleCategory: data.sampleCategory ?? null,
      gateNo: data.gateNo,
      reservoirName: data.reservoirName,
      targetOpening: data.targetOpening ?? null,
      actualOpening: data.actualOpening ?? null,
      targetFlow: data.targetFlow ?? null,
      actualFlow: data.actualFlow ?? null,
      amount: data.amount ?? null,
      planExecuteTime: data.planExecuteTime ?? null,
      actualExecuteTime: data.actualExecuteTime ?? null,
      reviewTime: data.reviewTime ?? null,
      responsibleUnit: data.responsibleUnit,
      responsiblePerson: data.responsiblePerson,
      operatorId: data.operatorId ?? null,
      status: data.status ?? OrderStatus.PENDING_ACCEPT,
      isArchived: data.isArchived ?? false,
      currentNodeId: data.currentNodeId ?? null,
      blockReason: data.blockReason ?? null,
      remedyPath: data.remedyPath ?? null,
      summary: data.summary ?? null,
      conclusion: data.conclusion ?? null,
      createdAt: data.createdAt ?? new Date(),
      updatedAt: data.updatedAt ?? new Date(),
    };
    this.dispatchOrders.set(order.id, order);
    return order;
  }

  // ====== Node ======
  nodeCreate(data: any): OrderNode {
    const node: OrderNode = {
      id: data.id ?? uuid(),
      orderId: data.orderId,
      nodeType: data.nodeType,
      status: data.status,
      operatorId: data.operatorId,
      operatorName: data.operatorName,
      actionSummary: data.actionSummary ?? null,
      remark: data.remark ?? null,
      evidence: data.evidence ?? null,
      snapshotData: data.snapshotData ?? null,
      createdAt: data.createdAt ?? new Date(),
    };
    this.orderNodes.set(node.id, node);
    return node;
  }

  // ====== Attachment ======
  attachmentCreateMany(data: { data: any[] }) {
    for (const item of data.data) {
      const att: OrderAttachment = {
        id: item.id ?? uuid(),
        orderId: item.orderId,
        nodeId: item.nodeId ?? null,
        name: item.name,
        type: item.type,
        size: item.size,
        url: item.url,
        uploadedBy: item.uploadedBy,
        uploadedAt: item.uploadedAt ?? new Date(),
        description: item.description ?? null,
      };
      this.orderAttachments.set(att.id, att);
    }
    return { count: data.data.length };
  }

  // ====== Difference ======
  differenceCreateMany(data: { data: any[] }) {
    for (const item of data.data) {
      const d: FieldDifference = {
        id: item.id ?? uuid(),
        orderId: item.orderId,
        nodeId: item.nodeId ?? null,
        fieldName: item.fieldName,
        fieldLabel: item.fieldLabel,
        oldValue: item.oldValue ?? null,
        newValue: item.newValue ?? null,
        differenceType: item.differenceType,
        changedBy: item.changedBy,
        changedAt: item.changedAt ?? new Date(),
      };
      this.fieldDifferences.set(d.id, d);
    }
    return { count: data.data.length };
  }

  differenceCreate(data: any): FieldDifference {
    const d: FieldDifference = {
      id: data.id ?? uuid(),
      orderId: data.orderId,
      nodeId: data.nodeId ?? null,
      fieldName: data.fieldName,
      fieldLabel: data.fieldLabel,
      oldValue: data.oldValue ?? null,
      newValue: data.newValue ?? null,
      differenceType: data.differenceType,
      changedBy: data.changedBy,
      changedAt: data.changedAt ?? new Date(),
    };
    this.fieldDifferences.set(d.id, d);
    return d;
  }

  // ====== Review ======
  reviewRecordCreate(data: any): ReviewRecord {
    const r: ReviewRecord = {
      id: data.id ?? uuid(),
      orderId: data.orderId,
      reviewerId: data.reviewerId,
      reviewerName: data.reviewerName,
      conclusion: data.conclusion,
      opinion: data.opinion ?? null,
      blockReason: data.blockReason ?? null,
      remedyPath: data.remedyPath ?? null,
      isApproved: data.isApproved,
      reviewedAt: data.reviewedAt ?? new Date(),
    };
    this.reviewRecords.set(r.id, r);
    return r;
  }
}

export const inMemoryDB = new InMemoryDB();

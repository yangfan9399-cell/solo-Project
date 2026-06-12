import type { RecordSummary, RecordDetail, NodeDetail, DashboardStats, AttachmentInfo, EvidenceItemInfo } from "~/types";
import { STATUS, EXCEPTION_TYPES, NODE_TYPES } from "~/db/schema";

const now = new Date();
const dayMs = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(now.getTime() - days * dayMs).toISOString();
}

const mockNodes: Record<number, NodeDetail[]> = {
  1: [
    {
      id: 1,
      recordId: 1,
      nodeType: NODE_TYPES.ACCEPT,
      nodeName: "受理登记",
      status: "completed",
      operatorName: "张伟",
      comment: "系统自动识别铅封信息，人工确认受理",
      sequence: 1,
      isReProcess: false,
      createdAt: daysAgo(10),
    },
    {
      id: 2,
      recordId: 1,
      nodeType: NODE_TYPES.PROCESS,
      nodeName: "现场核验",
      status: "completed",
      operatorName: "李明",
      comment: "现场核对铅封编号 SEAL-A001234 与系统记录一致，铅封完好无破损",
      basis: "现场照片、铅封登记台账",
      sequence: 2,
      isReProcess: false,
      createdAt: daysAgo(8),
    },
    {
      id: 3,
      recordId: 1,
      nodeType: NODE_TYPES.REVIEW,
      nodeName: "复核审批",
      status: "completed",
      operatorName: "王芳",
      comment: "核验材料齐全，流程规范，同意放箱",
      basis: "《铅封核验管理办法》第十二条",
      sequence: 3,
      isReProcess: false,
      createdAt: daysAgo(5),
    },
    {
      id: 4,
      recordId: 1,
      nodeType: NODE_TYPES.ARCHIVE,
      nodeName: "归档结案",
      status: "completed",
      operatorName: "陈杰",
      comment: "材料完整，归档保存",
      sequence: 4,
      isReProcess: false,
      createdAt: daysAgo(3),
    },
  ],
  2: [
    {
      id: 5,
      recordId: 2,
      nodeType: NODE_TYPES.ACCEPT,
      nodeName: "受理登记",
      status: "completed",
      operatorName: "张伟",
      comment: "人工申报铅封异常，初步受理",
      sequence: 1,
      isReProcess: false,
      createdAt: daysAgo(6),
    },
    {
      id: 6,
      recordId: 2,
      nodeType: NODE_TYPES.PROCESS,
      nodeName: "现场核验",
      status: "completed",
      operatorName: "李明",
      comment: "现场核验发现记录不完整，到达时间未填写",
      fieldChanges: { status: { before: "pending_accept", after: "processing" } },
      sequence: 2,
      isReProcess: false,
      createdAt: daysAgo(4),
    },
    {
      id: 7,
      recordId: 2,
      nodeType: NODE_TYPES.RETURN,
      nodeName: "复核退回",
      status: "returned",
      operatorName: "王芳",
      comment: "记录不完整，需要补证。具体问题：到达时间缺失、签字不全、编号不连续",
      basis: "《集装箱核验操作规范》第5条",
      fieldChanges: {
        status: { before: "pending_review", after: "returned" },
      },
      snapshotBefore: {
        arrivalTime: null,
        hasSignature: false,
        recordSerial: "不连续",
      },
      snapshotAfter: {
        arrivalTime: "待补充",
        hasSignature: "待补签",
        recordSerial: "待说明",
      },
      sequence: 3,
      isReProcess: false,
      createdAt: daysAgo(1),
    },
  ],
  3: [
    {
      id: 8,
      recordId: 3,
      nodeType: NODE_TYPES.ACCEPT,
      nodeName: "受理登记",
      status: "completed",
      operatorName: "刘洋",
      comment: "现场申报铅封核验",
      sequence: 1,
      isReProcess: false,
      createdAt: daysAgo(9),
    },
    {
      id: 9,
      recordId: 3,
      nodeType: NODE_TYPES.SUPPLEMENT,
      nodeName: "补充材料",
      status: "completed",
      operatorName: "刘洋",
      comment: "补充了第二版照片（光线更好）",
      fieldChanges: { attachmentCount: { before: 1, after: 2 } },
      sequence: 2,
      isReProcess: false,
      createdAt: daysAgo(6),
    },
    {
      id: 10,
      recordId: 3,
      nodeType: NODE_TYPES.PROCESS,
      nodeName: "版本核验",
      status: "processing",
      operatorName: "李明",
      comment: "系统比对发现两个版本照片存在差异，正在核实原因",
      basis: "《电子证据管理规定》第8条",
      fieldChanges: {
        status: { before: "pending_accept", after: "processing" },
        exceptionType: { before: "normal", after: "attachment_version_mismatch" },
      },
      snapshotBefore: {
        version: "1.0",
        photoTime: "10:23",
        hash: "a1b2c3d4",
      },
      snapshotAfter: {
        version: "1.1",
        photoTime: "14:56",
        hash: "e5f6g7h8",
      },
      sequence: 3,
      isReProcess: false,
      createdAt: daysAgo(2),
    },
  ],
  4: [
    {
      id: 11,
      recordId: 4,
      nodeType: NODE_TYPES.ACCEPT,
      nodeName: "受理登记",
      status: "completed",
      operatorName: "张伟",
      comment: "系统自动受理",
      sequence: 1,
      isReProcess: false,
      createdAt: daysAgo(20),
    },
    {
      id: 12,
      recordId: 4,
      nodeType: NODE_TYPES.PROCESS,
      nodeName: "现场核验",
      status: "completed",
      operatorName: "李明",
      comment: "铅封完好，核验通过（原记录）",
      sequence: 2,
      isReProcess: false,
      createdAt: daysAgo(18),
    },
    {
      id: 13,
      recordId: 4,
      nodeType: NODE_TYPES.REVIEW,
      nodeName: "复核审批",
      status: "completed",
      operatorName: "王芳",
      comment: "同意正常放箱（原结论）",
      sequence: 3,
      isReProcess: false,
      createdAt: daysAgo(15),
    },
    {
      id: 14,
      recordId: 4,
      nodeType: NODE_TYPES.ARCHIVE,
      nodeName: "归档结案",
      status: "completed",
      operatorName: "陈杰",
      comment: "已归档（原归档）",
      sequence: 4,
      isReProcess: false,
      createdAt: daysAgo(12),
    },
    {
      id: 15,
      recordId: 4,
      nodeType: NODE_TYPES.RE_PROCESS,
      nodeName: "重新处理-启动",
      status: "completed",
      operatorName: "陈杰",
      comment: "档案抽检发现铅封编号记录错误，申请重新处理。原铅封编号 SEAL-D003421 应为 SEAL-D003427",
      basis: "《档案质量抽检办法》第6条",
      isReProcess: true,
      parentNodeId: 14,
      fieldChanges: {
        isArchived: { before: true, after: false },
        status: { before: "archived", after: "processing" },
        sealNo: { before: "SEAL-D003421", after: "SEAL-D003427（待确认）" },
      },
      snapshotBefore: {
        sealNo: "SEAL-D003421",
        status: "archived",
        conclusion: "核验通过，正常放箱",
      },
      snapshotAfter: {
        sealNo: "SEAL-D003427（待确认）",
        status: "processing",
        conclusion: "原结论撤销，重新核验",
      },
      sequence: 5,
      createdAt: daysAgo(3),
    },
    {
      id: 16,
      recordId: 4,
      nodeType: NODE_TYPES.PROCESS,
      nodeName: "重新核验",
      status: "completed",
      operatorName: "李明",
      comment: "现场重新核验，确认实际铅封编号为 SEAL-D003427，原记录确实有误",
      isReProcess: true,
      fieldChanges: {
        sealNo: { before: "SEAL-D003421", after: "SEAL-D003427" },
      },
      sequence: 6,
      createdAt: daysAgo(2),
    },
    {
      id: 17,
      recordId: 4,
      nodeType: NODE_TYPES.REVIEW,
      nodeName: "重新复核",
      status: "pending",
      operatorName: "王芳",
      comment: "待复核确认",
      isReProcess: true,
      sequence: 7,
      createdAt: daysAgo(1),
    },
  ],
};

const mockAttachments: Record<number, AttachmentInfo[]> = {
  1: [
    {
      id: 1,
      recordId: 1,
      fileName: "铅封正面照.jpg",
      fileType: "image/jpeg",
      fileSize: 2048000,
      fileUrl: "#",
      version: "1.0",
      uploaderName: "李明",
      description: "铅封正面清晰照片，编号 SEAL-A001234",
      isEvidence: true,
      createdAt: daysAgo(8),
    },
    {
      id: 2,
      recordId: 1,
      fileName: "铅封侧面照.jpg",
      fileType: "image/jpeg",
      fileSize: 1850000,
      fileUrl: "#",
      version: "1.0",
      uploaderName: "李明",
      description: "铅封侧面完好性照片",
      isEvidence: true,
      createdAt: daysAgo(8),
    },
    {
      id: 3,
      recordId: 1,
      fileName: "放箱通知单.pdf",
      fileType: "application/pdf",
      fileSize: 156000,
      fileUrl: "#",
      version: "1.0",
      uploaderName: "王芳",
      description: "复核通过后的放箱通知单",
      isEvidence: false,
      createdAt: daysAgo(5),
    },
  ],
  2: [
    {
      id: 4,
      recordId: 2,
      fileName: "铅封照片.jpg",
      fileType: "image/jpeg",
      fileSize: 1980000,
      fileUrl: "#",
      version: "1.0",
      uploaderName: "李明",
      description: "铅封外观照片，编号 SEAL-B005678",
      isEvidence: true,
      createdAt: daysAgo(4),
    },
    {
      id: 5,
      recordId: 2,
      fileName: "核验记录单.pdf",
      fileType: "application/pdf",
      fileSize: 245000,
      fileUrl: "#",
      version: "1.0",
      uploaderName: "李明",
      description: "现场核验记录单（不完整）",
      isEvidence: true,
      createdAt: daysAgo(4),
    },
  ],
  3: [
    {
      id: 6,
      recordId: 3,
      fileName: "铅封照片_v1.jpg",
      fileType: "image/jpeg",
      fileSize: 2100000,
      fileUrl: "#",
      version: "1.0",
      uploaderName: "刘洋",
      description: "原始铅封照片（第一版），拍摄时间 10:23",
      isEvidence: true,
      createdAt: daysAgo(9),
    },
    {
      id: 7,
      recordId: 3,
      fileName: "铅封照片_v2.jpg",
      fileType: "image/jpeg",
      fileSize: 2250000,
      fileUrl: "#",
      version: "1.1",
      uploaderName: "刘洋",
      description: "重新拍摄的铅封照片（第二版），拍摄时间 14:56",
      isEvidence: true,
      createdAt: daysAgo(6),
    },
    {
      id: 8,
      recordId: 3,
      fileName: "铅封使用登记台账.xlsx",
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileSize: 45000,
      fileUrl: "#",
      version: "1.0",
      uploaderName: "李明",
      description: "铅封使用登记台账",
      isEvidence: false,
      createdAt: daysAgo(2),
    },
  ],
  4: [
    {
      id: 9,
      recordId: 4,
      fileName: "原铅封照片.jpg",
      fileType: "image/jpeg",
      fileSize: 1780000,
      fileUrl: "#",
      version: "1.0",
      uploaderName: "李明",
      description: "原始核验时的铅封照片（编号记录错误）",
      isEvidence: true,
      createdAt: daysAgo(18),
    },
    {
      id: 10,
      recordId: 4,
      fileName: "抽检发现说明.pdf",
      fileType: "application/pdf",
      fileSize: 189000,
      fileUrl: "#",
      version: "1.0",
      uploaderName: "陈杰",
      description: "档案抽检发现问题的说明文档",
      isEvidence: true,
      createdAt: daysAgo(3),
    },
    {
      id: 11,
      recordId: 4,
      fileName: "重新核验照片.jpg",
      fileType: "image/jpeg",
      fileSize: 2050000,
      fileUrl: "#",
      version: "2.0",
      uploaderName: "李明",
      description: "重新核验拍摄的照片，可见编号为 SEAL-D003427",
      isEvidence: true,
      createdAt: daysAgo(2),
    },
  ],
};

const mockEvidenceItems: Record<number, EvidenceItemInfo[]> = {
  1: [
    {
      id: 1,
      recordId: 1,
      type: "photo",
      title: "铅封正面照片",
      content: "铅封编号 SEAL-A001234，清晰可见",
      status: "valid",
      verified: true,
      createdAt: daysAgo(8),
    },
    {
      id: 2,
      recordId: 1,
      type: "document",
      title: "铅封登记台账记录",
      content: "台账编号：LD-2024-0105，记录人与时间一致",
      status: "valid",
      verified: true,
      createdAt: daysAgo(8),
    },
  ],
  2: [
    {
      id: 3,
      recordId: 2,
      type: "photo",
      title: "铅封照片",
      content: "铅封外观完好，编号 SEAL-B005678",
      status: "valid",
      verified: false,
      createdAt: daysAgo(4),
    },
  ],
  3: [
    {
      id: 4,
      recordId: 3,
      type: "photo",
      title: "铅封照片 v1.0",
      content: "拍摄时间 10:23，哈希 a1b2c3d4",
      status: "questioned",
      verified: false,
      createdAt: daysAgo(9),
    },
    {
      id: 5,
      recordId: 3,
      type: "photo",
      title: "铅封照片 v1.1",
      content: "拍摄时间 14:56，哈希 e5f6g7h8",
      status: "questioned",
      verified: false,
      createdAt: daysAgo(6),
    },
  ],
  4: [
    {
      id: 6,
      recordId: 4,
      type: "photo",
      title: "原始铅封照片",
      content: "原记录编号 SEAL-D003421，经核实为记录错误",
      status: "invalid",
      verified: true,
      createdAt: daysAgo(18),
    },
    {
      id: 7,
      recordId: 4,
      type: "photo",
      title: "重新核验照片",
      content: "确认实际编号为 SEAL-D003427",
      status: "valid",
      verified: false,
      createdAt: daysAgo(2),
    },
    {
      id: 8,
      recordId: 4,
      type: "document",
      title: "档案抽检报告",
      content: "抽检编号：CJ-2024-03，发现铅封编号记录错误",
      status: "valid",
      verified: true,
      createdAt: daysAgo(3),
    },
  ],
};

const mockRecords: RecordSummary[] = [
  {
    id: 1,
    recordNo: "SEAL-2024-0001",
    containerNo: "MSKU1234567",
    sealNo: "SEAL-A001234",
    vesselName: "马士基埃德蒙顿",
    voyageNo: "V2401E",
    exceptionType: EXCEPTION_TYPES.NORMAL,
    status: STATUS.ARCHIVED,
    currentHandler: "陈杰",
    summary: "铅封完好无损，核验通过，正常放箱",
    amount: "0.00",
    source: "系统自动核验",
    isArchived: true,
    customer: "上海振华物流有限公司",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
  },
  {
    id: 2,
    recordNo: "SEAL-2024-0028",
    containerNo: "CMAU9876543",
    sealNo: "SEAL-B005678",
    vesselName: "达飞泰特斯",
    voyageNo: "FT2412W",
    exceptionType: EXCEPTION_TYPES.MISSING_RECORD,
    status: STATUS.RETURNED,
    currentHandler: "张伟",
    summary: "现场记录缺失到达时间，退回补证",
    amount: "5000.00",
    source: "人工申报",
    isArchived: false,
    customer: "宁波远洋运输股份有限公司",
    createdAt: daysAgo(6),
    updatedAt: daysAgo(1),
  },
  {
    id: 3,
    recordNo: "SEAL-2024-0045",
    containerNo: "COSCO5678901",
    sealNo: "SEAL-C009876",
    vesselName: "中远荷兰号",
    voyageNo: "COS-2408N",
    exceptionType: EXCEPTION_TYPES.ATTACHMENT_VERSION_MISMATCH,
    status: STATUS.PROCESSING,
    currentHandler: "李明",
    summary: "附件版本不一致，铅封照片有两个版本",
    amount: "12000.00",
    source: "系统比对发现",
    isArchived: false,
    customer: "中远海运集装箱运输有限公司",
    createdAt: daysAgo(9),
    updatedAt: daysAgo(2),
  },
  {
    id: 4,
    recordNo: "SEAL-2024-0019",
    containerNo: "ONE4567890",
    sealNo: "SEAL-D003421",
    vesselName: "海洋网联东京",
    voyageNo: "ONE-2405T",
    exceptionType: EXCEPTION_TYPES.RE_PROCESS,
    status: STATUS.PENDING_REVIEW,
    currentHandler: "王芳",
    summary: "原已归档，后抽检发现铅封编号有误，重新处理中",
    amount: "8000.00",
    source: "档案抽检发现",
    isArchived: false,
    customer: "东方海外货柜航运有限公司",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  },
  {
    id: 5,
    recordNo: "SEAL-2024-0002",
    containerNo: "MSKU7654321",
    sealNo: "SEAL-A001235",
    vesselName: "马士基埃德蒙顿",
    voyageNo: "V2401E",
    exceptionType: EXCEPTION_TYPES.NORMAL,
    status: STATUS.ARCHIVED,
    currentHandler: "陈杰",
    summary: "铅封完好，正常放箱",
    amount: "0.00",
    source: "系统自动核验",
    isArchived: true,
    customer: "上海振华物流有限公司",
    createdAt: daysAgo(11),
    updatedAt: daysAgo(4),
  },
  {
    id: 6,
    recordNo: "SEAL-2024-0003",
    containerNo: "CMAU1122334",
    sealNo: "SEAL-B005679",
    vesselName: "达飞泰特斯",
    voyageNo: "FT2412W",
    exceptionType: EXCEPTION_TYPES.NORMAL,
    status: STATUS.ARCHIVED,
    currentHandler: "陈杰",
    summary: "铅封完好无损",
    amount: "0.00",
    source: "人工申报",
    isArchived: true,
    customer: "宁波远洋运输股份有限公司",
    createdAt: daysAgo(12),
    updatedAt: daysAgo(5),
  },
  {
    id: 7,
    recordNo: "SEAL-2024-0030",
    containerNo: "COSCO1357924",
    sealNo: "SEAL-C009877",
    vesselName: "中远荷兰号",
    voyageNo: "COS-2408N",
    exceptionType: EXCEPTION_TYPES.MISSING_RECORD,
    status: STATUS.PENDING_REVIEW,
    currentHandler: "王芳",
    summary: "补证后提交待复核",
    amount: "3000.00",
    source: "系统比对发现",
    isArchived: false,
    customer: "中远海运集装箱运输有限公司",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
  },
  {
    id: 8,
    recordNo: "SEAL-2024-0050",
    containerNo: "ONE9876543",
    sealNo: "SEAL-D003422",
    vesselName: "海洋网联东京",
    voyageNo: "ONE-2405T",
    exceptionType: EXCEPTION_TYPES.NORMAL,
    status: STATUS.PENDING_ACCEPT,
    currentHandler: "李明",
    summary: "新申报待受理",
    amount: "0.00",
    source: "人工申报",
    isArchived: false,
    customer: "东方海外货柜航运有限公司",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 9,
    recordNo: "SEAL-2024-0051",
    containerNo: "MSKU5566778",
    sealNo: "SEAL-E002345",
    vesselName: "马士基吉隆坡",
    voyageNo: "V2403K",
    exceptionType: EXCEPTION_TYPES.NORMAL,
    status: STATUS.PENDING_REVIEW,
    currentHandler: "王芳",
    summary: "核验完成待复核",
    amount: "0.00",
    source: "系统自动核验",
    isArchived: false,
    customer: "深圳华南物流",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
  },
  {
    id: 10,
    recordNo: "SEAL-2024-0052",
    containerNo: "CMAU2233445",
    sealNo: "SEAL-F005432",
    vesselName: "达飞马赛",
    voyageNo: "FT2415M",
    exceptionType: EXCEPTION_TYPES.ATTACHMENT_VERSION_MISMATCH,
    status: STATUS.PENDING_REVIEW,
    currentHandler: "王芳",
    summary: "附件版本问题已说明，待复核",
    amount: "6500.00",
    source: "人工申报",
    isArchived: false,
    customer: "青岛港国际物流",
    createdAt: daysAgo(8),
    updatedAt: daysAgo(1),
  },
];

const recordDetails: Record<number, RecordDetail> = {
  1: {
    ...mockRecords[0],
    blNo: "MAEU202401001",
    applicantName: "张伟",
    reviewerName: "王芳",
    currentHandlerName: "陈杰",
    sealTime: daysAgo(10),
    arrivalTime: daysAgo(7),
    conclusion: "经核验，集装箱铅封完好，编号一致，无异常情况，准予正常放箱。",
    basis: "《港口集装箱铅封管理规范》第3.2条；现场检验照片2张；铅封编号匹配记录",
    nodes: mockNodes[1],
    attachments: mockAttachments[1],
    evidenceItems: mockEvidenceItems[1],
  },
  2: {
    ...mockRecords[1],
    blNo: "CMDU202402056",
    applicantName: "张伟",
    reviewerName: "王芳",
    currentHandlerName: "张伟",
    sealTime: daysAgo(5),
    arrivalTime: daysAgo(3),
    conclusion: "待补充完整记录后重新提交复核",
    basis: "《集装箱核验操作规范》第5条：所有关键时间节点必须记录在案",
    blockReason:
      "1. 到达时间记录缺失；2. 现场操作人员签字不完整；3. 铅封核验记录单编号不连续",
    remedyPath:
      "1. 补充到达时间的系统日志截图；2. 补签现场操作人员姓名；3. 说明记录单编号不连续的原因并提供证明",
    diffFields: {
      arrivalTime: { before: null, after: "待补充", label: "到达时间" },
      operatorSignature: { before: null, after: "待补签", label: "操作人签字" },
      recordSerial: { before: "断号", after: "待说明", label: "记录编号连续性" },
    },
    nodes: mockNodes[2],
    attachments: mockAttachments[2],
    evidenceItems: mockEvidenceItems[2],
  },
  3: {
    ...mockRecords[2],
    blNo: "COSU202403120",
    applicantName: "刘洋",
    reviewerName: "王芳",
    currentHandlerName: "李明",
    sealTime: daysAgo(8),
    arrivalTime: daysAgo(5),
    conclusion: "待确认附件版本，查明版本差异原因",
    basis: "《电子证据管理规定》第8条：证据附件必须版本唯一、可追溯",
    blockReason:
      "同一铅封存在两个不同版本的照片附件：v1.0（拍摄时间10:23）和 v1.1（拍摄时间14:56），两版照片背景光线不同，疑似重新拍摄",
    remedyPath:
      "1. 核实两个版本照片的拍摄人和拍摄原因；2. 确认哪一版为首次拍摄的原始照片；3. 说明重新拍摄的原因并提供相关审批记录",
    diffFields: {
      attachmentVersion: { before: "1.0", after: "1.1", label: "附件版本号" },
      photoTimestamp: { before: "2024-03-15 10:23", after: "2024-03-15 14:56", label: "照片拍摄时间" },
      fileHash: { before: "a1b2c3d4", after: "e5f6g7h8", label: "文件哈希值" },
    },
    nodes: mockNodes[3],
    attachments: mockAttachments[3],
    evidenceItems: mockEvidenceItems[3],
  },
  4: {
    ...mockRecords[3],
    blNo: "ONEY202402089",
    applicantName: "张伟",
    reviewerName: "王芳",
    currentHandlerName: "王芳",
    sealTime: daysAgo(20),
    arrivalTime: daysAgo(17),
    conclusion: "重新核验中，原结论因铅封编号记录错误予以撤销",
    basis: "《档案质量抽检办法》第6条：抽检发现问题的档案必须重新核验",
    blockReason:
      "原归档记录中铅封编号 SEAL-D003421 与实际 SEAL-D003427 不符，数字 1 和 7 混淆，属于记录错误",
    remedyPath:
      "1. 重新核验实际铅封编号；2. 修正系统中错误的铅封编号记录；3. 调查编号记录错误的原因；4. 对相关责任人进行培训",
    diffFields: {
      sealNo: { before: "SEAL-D003421", after: "SEAL-D003427", label: "铅封编号" },
      sealStatus: { before: "正常完好", after: "需重新核验", label: "铅封状态" },
      conclusion: { before: "核验通过", after: "原结论撤销，重新核验", label: "核验结论" },
    },
    nodes: mockNodes[4],
    attachments: mockAttachments[4],
    evidenceItems: mockEvidenceItems[4],
  },
};

for (let i = 5; i <= 10; i++) {
  const record = mockRecords[i - 1];
  recordDetails[i] = {
    ...record,
    blNo: `BL-${record.recordNo}`,
    applicantName: i % 2 === 0 ? "张伟" : "刘洋",
    reviewerName: "王芳",
    currentHandlerName: record.currentHandler,
    sealTime: daysAgo(i + 3),
    arrivalTime: daysAgo(i),
    conclusion: record.summary,
    basis: "铅封核验管理规范",
    nodes: [
      {
        id: i * 10,
        recordId: i,
        nodeType: NODE_TYPES.ACCEPT,
        nodeName: "受理登记",
        status: "completed",
        operatorName: i % 2 === 0 ? "张伟" : "刘洋",
        sequence: 1,
        isReProcess: false,
        createdAt: daysAgo(i + 5),
      },
    ],
    attachments: [],
    evidenceItems: [],
  };
}

export function getMockRecords(filters?: {
  status?: string;
  exceptionType?: string;
  search?: string;
}): RecordSummary[] {
  let result = [...mockRecords];

  if (filters?.status) {
    result = result.filter((r) => r.status === filters.status);
  }
  if (filters?.exceptionType) {
    result = result.filter((r) => r.exceptionType === filters.exceptionType);
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.recordNo.toLowerCase().includes(s) ||
        r.containerNo.toLowerCase().includes(s) ||
        r.sealNo.toLowerCase().includes(s) ||
        r.customer?.toLowerCase().includes(s)
    );
  }

  return result;
}

export function getMockRecordDetail(id: number): RecordDetail | null {
  return recordDetails[id] || null;
}

export function getMockDashboardStats(): DashboardStats {
  const total = mockRecords.length;
  const pending = mockRecords.filter(
    (r) => r.status === STATUS.PENDING_ACCEPT || r.status === STATUS.RETURNED
  ).length;
  const processing = mockRecords.filter(
    (r) => r.status === STATUS.PROCESSING || r.status === STATUS.PENDING_REVIEW
  ).length;
  const archived = mockRecords.filter((r) => r.isArchived).length;
  const exceptionCount = mockRecords.filter(
    (r) => r.exceptionType !== EXCEPTION_TYPES.NORMAL
  ).length;
  const normalCount = mockRecords.filter(
    (r) => r.exceptionType === EXCEPTION_TYPES.NORMAL
  ).length;

  const byStatus: Record<string, number> = {
    [STATUS.PENDING_ACCEPT]: mockRecords.filter(
      (r) => r.status === STATUS.PENDING_ACCEPT
    ).length,
    [STATUS.PROCESSING]: mockRecords.filter(
      (r) => r.status === STATUS.PROCESSING
    ).length,
    [STATUS.PENDING_REVIEW]: mockRecords.filter(
      (r) => r.status === STATUS.PENDING_REVIEW
    ).length,
    [STATUS.RETURNED]: mockRecords.filter(
      (r) => r.status === STATUS.RETURNED
    ).length,
    [STATUS.ARCHIVED]: mockRecords.filter(
      (r) => r.status === STATUS.ARCHIVED
    ).length,
  };

  const byType: Record<string, number> = {
    [EXCEPTION_TYPES.NORMAL]: mockRecords.filter(
      (r) => r.exceptionType === EXCEPTION_TYPES.NORMAL
    ).length,
    [EXCEPTION_TYPES.MISSING_RECORD]: mockRecords.filter(
      (r) => r.exceptionType === EXCEPTION_TYPES.MISSING_RECORD
    ).length,
    [EXCEPTION_TYPES.ATTACHMENT_VERSION_MISMATCH]: mockRecords.filter(
      (r) => r.exceptionType === EXCEPTION_TYPES.ATTACHMENT_VERSION_MISMATCH
    ).length,
    [EXCEPTION_TYPES.RE_PROCESS]: mockRecords.filter(
      (r) => r.exceptionType === EXCEPTION_TYPES.RE_PROCESS
    ).length,
  };

  const recentRecords = [...mockRecords]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return {
    total,
    pending,
    processing,
    completed: archived,
    archived,
    exceptionCount,
    normalCount,
    avgProcessTime: 3.5,
    byType,
    byStatus,
    recentRecords,
  };
}

export function updateMockRecord(id: number, updates: Partial<RecordDetail>): RecordDetail | null {
  if (!recordDetails[id]) return null;
  recordDetails[id] = { ...recordDetails[id], ...updates, updatedAt: new Date().toISOString() };
  const summaryIndex = mockRecords.findIndex((r) => r.id === id);
  if (summaryIndex >= 0) {
    mockRecords[summaryIndex] = {
      ...mockRecords[summaryIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    } as RecordSummary;
  }
  return recordDetails[id];
}

export function addMockNode(recordId: number, node: Omit<NodeDetail, "id" | "createdAt">): NodeDetail | null {
  const detail = recordDetails[recordId];
  if (!detail) return null;

  const newNode: NodeDetail = {
    ...node,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  };

  detail.nodes.push(newNode);
  detail.updatedAt = new Date().toISOString();

  const summaryIndex = mockRecords.findIndex((r) => r.id === recordId);
  if (summaryIndex >= 0) {
    mockRecords[summaryIndex].updatedAt = new Date().toISOString();
  }

  return newNode;
}

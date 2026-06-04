import type {
  Application,
  User,
  SubsidyStandard,
  SubsidyLevel,
  SubsidyCalculation,
} from "./types";

export const mockUsers: User[] = [
  { id: "handler-1", name: "张经办", role: "HANDLER" },
  { id: "handler-2", name: "李经办", role: "HANDLER" },
  { id: "reviewer-1", name: "王复核", role: "REVIEWER" },
  { id: "reviewer-2", name: "赵复核", role: "REVIEWER" },
];

export const subsidyStandards: SubsidyStandard[] = [
  {
    id: "std-1",
    level: "LEVEL_1",
    name: "特困一档",
    minIncome: 0,
    maxIncome: 800,
    amount: 2000,
    description: "家庭人均月收入800元以下",
  },
  {
    id: "std-2",
    level: "LEVEL_2",
    name: "困难二档",
    minIncome: 801,
    maxIncome: 1500,
    amount: 1500,
    description: "家庭人均月收入801-1500元",
  },
  {
    id: "std-3",
    level: "LEVEL_3",
    name: "一般三档",
    minIncome: 1501,
    maxIncome: 2500,
    amount: 1000,
    description: "家庭人均月收入1501-2500元",
  },
  {
    id: "std-4",
    level: "LEVEL_4",
    name: "临时四档",
    minIncome: 2501,
    maxIncome: 3500,
    amount: 600,
    description: "家庭人均月收入2501-3500元，临时困难",
  },
  {
    id: "std-5",
    level: "LEVEL_5",
    name: "特殊五档",
    minIncome: 3501,
    maxIncome: 99999,
    amount: 300,
    description: "特殊情况补助，需工会主席审批",
  },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function createBaseLogs(
  userName: string,
  userId: string
): Application["approvalLogs"] {
  return [
    {
      id: generateId(),
      userId,
      userName,
      actionType: "SUBMIT_APPLICATION",
      description: "提交困难补助申请",
      createdAt: "2026-06-01T10:00:00Z",
    },
  ];
}

export const sample1: Application = {
  id: "app-complete-001",
  applicantName: "陈大明",
  applicantIdCard: "110101197001011234",
  phone: "13800138001",
  address: "北京市朝阳区建国路88号院3号楼2单元501",
  source: "基层工会推荐",
  status: "PENDING_REVIEW",
  subsidyLevel: "LEVEL_2",
  exceedsStandard: false,
  currentHandlerId: "handler-1",
  currentReviewerId: "reviewer-1",
  createdAt: "2026-06-01T10:00:00Z",
  updatedAt: "2026-06-02T14:30:00Z",
  isArchived: false,
  currentHandler: mockUsers[0],
  currentReviewer: mockUsers[2],
  familyMembers: [
    {
      id: generateId(),
      name: "陈大明",
      relation: "本人",
      age: 45,
      occupation: "企业职工",
      monthlyIncome: 2200,
      healthStatus: "良好",
    },
    {
      id: generateId(),
      name: "刘桂芳",
      relation: "配偶",
      age: 43,
      occupation: "无业",
      monthlyIncome: 0,
      healthStatus: "长期患病",
    },
    {
      id: generateId(),
      name: "陈晓宇",
      relation: "子女",
      age: 18,
      occupation: "学生",
      monthlyIncome: 0,
      healthStatus: "良好",
    },
  ],
  documents: [
    {
      id: generateId(),
      type: "ID_CARD",
      name: "身份证复印件",
      status: "VERIFIED",
      uploadDate: "2026-06-01T10:05:00Z",
    },
    {
      id: generateId(),
      type: "HOUSEHOLD_REGISTER",
      name: "户口本复印件",
      status: "VERIFIED",
      uploadDate: "2026-06-01T10:05:00Z",
    },
    {
      id: generateId(),
      type: "INCOME_PROOF",
      name: "收入证明",
      status: "VERIFIED",
      uploadDate: "2026-06-01T10:10:00Z",
    },
    {
      id: generateId(),
      type: "MEDICAL_CERTIFICATE",
      name: "配偶疾病诊断证明",
      status: "VERIFIED",
      uploadDate: "2026-06-01T10:15:00Z",
    },
    {
      id: generateId(),
      type: "DIFFICULTY_PROOF",
      name: "困难情况说明",
      status: "VERIFIED",
      uploadDate: "2026-06-01T10:20:00Z",
    },
  ],
  approvalLogs: [
    ...createBaseLogs("张经办", "handler-1"),
    {
      id: generateId(),
      userId: "handler-1",
      userName: "张经办",
      actionType: "ADD_NOTE",
      description: "核实家庭情况，配偶长期患病需治疗，子女在读",
      createdAt: "2026-06-01T15:00:00Z",
    },
    {
      id: generateId(),
      userId: "handler-1",
      userName: "张经办",
      actionType: "UPLOAD_DOCUMENT",
      description: "所有材料已审核通过",
      createdAt: "2026-06-02T10:00:00Z",
    },
    {
      id: generateId(),
      userId: "handler-1",
      userName: "张经办",
      actionType: "ADD_NOTE",
      description: "提交复核",
      createdAt: "2026-06-02T14:30:00Z",
    },
  ],
  archiveRecords: [],
  reopenRecords: [],
};

export const sample2: Application = {
  id: "app-missing-002",
  applicantName: "王秀兰",
  applicantIdCard: "110102196505055678",
  phone: "13900139002",
  address: "北京市海淀区中关村大街1号院5号楼3单元102",
  source: "个人申请",
  status: "PENDING_HANDLER",
  subsidyLevel: "LEVEL_3",
  exceedsStandard: false,
  currentHandlerId: "handler-2",
  createdAt: "2026-06-03T09:00:00Z",
  updatedAt: "2026-06-03T09:00:00Z",
  isArchived: false,
  currentHandler: mockUsers[1],
  familyMembers: [
    {
      id: generateId(),
      name: "王秀兰",
      relation: "本人",
      age: 58,
      occupation: "退休",
      monthlyIncome: 3200,
      healthStatus: "患糖尿病",
    },
    {
      id: generateId(),
      name: "李建国",
      relation: "配偶",
      age: 60,
      occupation: "退休",
      monthlyIncome: 3500,
      healthStatus: "良好",
    },
  ],
  documents: [
    {
      id: generateId(),
      type: "ID_CARD",
      name: "身份证复印件",
      status: "PROVIDED",
      uploadDate: "2026-06-03T09:05:00Z",
    },
    {
      id: generateId(),
      type: "HOUSEHOLD_REGISTER",
      name: "户口本复印件",
      status: "PROVIDED",
      uploadDate: "2026-06-03T09:05:00Z",
    },
    {
      id: generateId(),
      type: "INCOME_PROOF",
      name: "收入证明",
      status: "MISSING",
    },
    {
      id: generateId(),
      type: "MEDICAL_CERTIFICATE",
      name: "糖尿病诊断证明",
      status: "PROVIDED",
      uploadDate: "2026-06-03T09:10:00Z",
    },
  ],
  approvalLogs: createBaseLogs("李经办", "handler-2"),
  archiveRecords: [],
  reopenRecords: [],
};

export const sample3: Application = {
  id: "app-exceed-003",
  applicantName: "张志伟",
  applicantIdCard: "110105198008089012",
  phone: "13700137003",
  address: "北京市丰台区丰台路5号院2号楼1单元301",
  source: "车间申报",
  status: "PENDING_REVIEW",
  subsidyLevel: "LEVEL_1",
  originalLevel: "LEVEL_3",
  exceedsStandard: true,
  approvalPath: "经办人申请→工会副主席→工会主席",
  currentHandlerId: "handler-1",
  currentReviewerId: "reviewer-2",
  createdAt: "2026-05-28T14:00:00Z",
  updatedAt: "2026-06-01T16:00:00Z",
  isArchived: false,
  currentHandler: mockUsers[0],
  currentReviewer: mockUsers[3],
  familyMembers: [
    {
      id: generateId(),
      name: "张志伟",
      relation: "本人",
      age: 42,
      occupation: "车间工人",
      monthlyIncome: 4500,
      healthStatus: "工伤致残",
    },
    {
      id: generateId(),
      name: "赵小敏",
      relation: "配偶",
      age: 40,
      occupation: "服务员",
      monthlyIncome: 3000,
      healthStatus: "良好",
    },
    {
      id: generateId(),
      name: "张浩",
      relation: "子女",
      age: 15,
      occupation: "学生",
      monthlyIncome: 0,
      healthStatus: "良好",
    },
    {
      id: generateId(),
      name: "张父",
      relation: "父亲",
      age: 70,
      occupation: "无",
      monthlyIncome: 0,
      healthStatus: "瘫痪在床",
    },
  ],
  documents: [
    {
      id: generateId(),
      type: "ID_CARD",
      name: "身份证复印件",
      status: "VERIFIED",
      uploadDate: "2026-05-28T14:05:00Z",
    },
    {
      id: generateId(),
      type: "HOUSEHOLD_REGISTER",
      name: "户口本复印件",
      status: "VERIFIED",
      uploadDate: "2026-05-28T14:05:00Z",
    },
    {
      id: generateId(),
      type: "INCOME_PROOF",
      name: "收入证明",
      status: "VERIFIED",
      uploadDate: "2026-05-28T14:10:00Z",
    },
    {
      id: generateId(),
      type: "MEDICAL_CERTIFICATE",
      name: "工伤鉴定证明",
      status: "VERIFIED",
      uploadDate: "2026-05-28T14:15:00Z",
    },
    {
      id: generateId(),
      type: "DIFFICULTY_PROOF",
      name: "特殊困难情况说明",
      status: "VERIFIED",
      uploadDate: "2026-05-28T14:20:00Z",
    },
  ],
  approvalLogs: [
    ...createBaseLogs("张经办", "handler-1"),
    {
      id: generateId(),
      userId: "handler-1",
      userName: "张经办",
      actionType: "ADD_NOTE",
      description: "申请人因工伤致残，父亲瘫痪在床，虽收入超标准但情况特殊",
      createdAt: "2026-05-29T10:00:00Z",
    },
    {
      id: generateId(),
      userId: "handler-1",
      userName: "张经办",
      actionType: "ADJUST_SUBSIDY_LEVEL",
      description: "申请升级补助标准",
      oldValue: "LEVEL_3",
      newValue: "LEVEL_1",
      createdAt: "2026-05-30T11:00:00Z",
    },
    {
      id: generateId(),
      userId: "handler-1",
      userName: "张经办",
      actionType: "ADD_NOTE",
      description: "工会副主席已同意，报请主席审批",
      createdAt: "2026-06-01T16:00:00Z",
    },
  ],
  archiveRecords: [],
  reopenRecords: [],
};

export const sample4: Application = {
  id: "app-duplicate-004",
  applicantName: "刘建国",
  applicantIdCard: "110106197503034567",
  phone: "13600136004",
  address: "北京市西城区西单大街10号院4号楼4单元201",
  source: "街道工会转介",
  status: "PENDING_HANDLER",
  subsidyLevel: "LEVEL_3",
  exceedsStandard: false,
  currentHandlerId: "handler-2",
  createdAt: "2026-06-04T08:30:00Z",
  updatedAt: "2026-06-04T08:30:00Z",
  isArchived: false,
  currentHandler: mockUsers[1],
  familyMembers: [
    {
      id: generateId(),
      name: "刘建国",
      relation: "本人",
      age: 48,
      occupation: "下岗职工",
      monthlyIncome: 1800,
      healthStatus: "良好",
    },
    {
      id: generateId(),
      name: "孙丽",
      relation: "配偶",
      age: 46,
      occupation: "保洁",
      monthlyIncome: 2000,
      healthStatus: "良好",
    },
  ],
  documents: [
    {
      id: generateId(),
      type: "ID_CARD",
      name: "身份证复印件",
      status: "PROVIDED",
      uploadDate: "2026-06-04T08:35:00Z",
    },
    {
      id: generateId(),
      type: "HOUSEHOLD_REGISTER",
      name: "户口本复印件",
      status: "PROVIDED",
      uploadDate: "2026-06-04T08:35:00Z",
    },
    {
      id: generateId(),
      type: "INCOME_PROOF",
      name: "收入证明",
      status: "PROVIDED",
      uploadDate: "2026-06-04T08:40:00Z",
    },
  ],
  approvalLogs: [
    ...createBaseLogs("李经办", "handler-2"),
    {
      id: generateId(),
      userId: "handler-2",
      userName: "李经办",
      actionType: "ADD_NOTE",
      description: "系统检测到该申请人2026年第一季度已领取过补助，请核实是否重复申请",
      createdAt: "2026-06-04T08:30:00Z",
    },
  ],
  archiveRecords: [],
  reopenRecords: [],
};

export const sample5: Application = {
  id: "app-archived-005",
  applicantName: "周国华",
  applicantIdCard: "110107196812127890",
  phone: "13500135005",
  address: "北京市东城区东直门外大街8号院1号楼5单元602",
  source: "工会走访",
  status: "ARCHIVED",
  subsidyLevel: "LEVEL_2",
  exceedsStandard: false,
  currentHandlerId: "handler-1",
  currentReviewerId: "reviewer-1",
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-15T16:00:00Z",
  isArchived: true,
  archiveReason: "补助已发放，流程结束",
  archivedAt: "2026-03-15T16:00:00Z",
  currentHandler: mockUsers[0],
  currentReviewer: mockUsers[2],
  familyMembers: [
    {
      id: generateId(),
      name: "周国华",
      relation: "本人",
      age: 55,
      occupation: "内退",
      monthlyIncome: 2000,
      healthStatus: "心脏病",
    },
    {
      id: generateId(),
      name: "王玉英",
      relation: "配偶",
      age: 53,
      occupation: "无业",
      monthlyIncome: 0,
      healthStatus: "良好",
    },
  ],
  documents: [
    {
      id: generateId(),
      type: "ID_CARD",
      name: "身份证复印件",
      status: "VERIFIED",
      uploadDate: "2026-03-01T10:05:00Z",
    },
    {
      id: generateId(),
      type: "HOUSEHOLD_REGISTER",
      name: "户口本复印件",
      status: "VERIFIED",
      uploadDate: "2026-03-01T10:05:00Z",
    },
    {
      id: generateId(),
      type: "INCOME_PROOF",
      name: "收入证明",
      status: "VERIFIED",
      uploadDate: "2026-03-01T10:10:00Z",
    },
  ],
  approvalLogs: [
    ...createBaseLogs("张经办", "handler-1"),
    {
      id: generateId(),
      userId: "handler-1",
      userName: "张经办",
      actionType: "ADD_NOTE",
      description: "申请人患有心脏病，需长期服药",
      createdAt: "2026-03-02T09:00:00Z",
    },
    {
      id: generateId(),
      userId: "handler-1",
      userName: "张经办",
      actionType: "ADD_NOTE",
      description: "材料齐全，提交复核",
      createdAt: "2026-03-05T14:00:00Z",
    },
    {
      id: generateId(),
      userId: "reviewer-1",
      userName: "王复核",
      actionType: "APPROVE",
      description: "同意发放困难补助1500元",
      createdAt: "2026-03-10T10:00:00Z",
    },
    {
      id: generateId(),
      userId: "reviewer-1",
      userName: "王复核",
      actionType: "ARCHIVE",
      description: "补助已发放，归档保存",
      createdAt: "2026-03-15T16:00:00Z",
    },
  ],
  archiveRecords: [
    {
      id: generateId(),
      conclusion: "同意发放困难补助1500元",
      finalAmount: 1500,
      archivedBy: "王复核",
      archivedAt: "2026-03-15T16:00:00Z",
    },
  ],
  reopenRecords: [],
};

export const mockApplications: Application[] = [
  sample1,
  sample2,
  sample3,
  sample4,
  sample5,
];

export function calculateSubsidy(
  familyMembers: { monthlyIncome: number }[],
  requestedLevel: SubsidyLevel
): SubsidyCalculation {
  const totalIncome = familyMembers.reduce(
    (sum, member) => sum + member.monthlyIncome,
    0
  );
  const familySize = familyMembers.length;
  const averageIncome = totalIncome / familySize;

  let calculatedLevel: SubsidyLevel = "LEVEL_5";
  for (const standard of subsidyStandards) {
    if (averageIncome >= standard.minIncome && averageIncome <= standard.maxIncome) {
      calculatedLevel = standard.level;
      break;
    }
  }

  const levelOrder: SubsidyLevel[] = [
    "LEVEL_1",
    "LEVEL_2",
    "LEVEL_3",
    "LEVEL_4",
    "LEVEL_5",
  ];
  const calculatedIndex = levelOrder.indexOf(calculatedLevel);
  const requestedIndex = levelOrder.indexOf(requestedLevel);
  const exceedsStandard = requestedIndex < calculatedIndex;
  const difference = requestedIndex - calculatedIndex;

  let approvalPath: string[] = [];
  if (exceedsStandard) {
    if (difference <= -1) {
      approvalPath.push("经办人核实");
    }
    if (difference <= -2) {
      approvalPath.push("工会副主席审批");
    }
    if (difference <= -3) {
      approvalPath.push("工会主席审批");
    }
  }

  return {
    totalIncome,
    familySize,
    averageIncome,
    calculatedLevel,
    requestedLevel,
    exceedsStandard,
    difference: Math.abs(difference),
    approvalPath,
  };
}

export function getSubsidyAmount(level: SubsidyLevel): number {
  const standard = subsidyStandards.find((s) => s.level === level);
  return standard?.amount || 0;
}

export function getSubsidyLevelName(level: SubsidyLevel): string {
  const standard = subsidyStandards.find((s) => s.level === level);
  return standard?.name || level;
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING_HANDLER: "待经办人处理",
    PENDING_REVIEW: "待复核",
    APPROVED: "已批准",
    REJECTED: "已驳回",
    ARCHIVED: "已归档",
  };
  return statusMap[status] || status;
}

export function getDocumentTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    ID_CARD: "身份证",
    HOUSEHOLD_REGISTER: "户口本",
    INCOME_PROOF: "收入证明",
    MEDICAL_CERTIFICATE: "医疗证明",
    DIFFICULTY_PROOF: "困难证明",
    OTHER: "其他材料",
  };
  return typeMap[type] || type;
}

export function getActionTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    SUBMIT_APPLICATION: "提交申请",
    UPLOAD_DOCUMENT: "上传材料",
    ADJUST_SUBSIDY_LEVEL: "调整补助档位",
    ADD_NOTE: "添加备注",
    APPROVE: "批准发放",
    REJECT: "驳回申请",
    ARCHIVE: "归档",
    REOPEN: "重新开启",
  };
  return typeMap[type] || type;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

import { PrismaClient, ApplicationStatus, DocumentType, DocumentStatus, SubsidyLevel, ActionType, UserRole } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.approvalLog.deleteMany();
  await prisma.reopenRecord.deleteMany();
  await prisma.archiveRecord.deleteMany();
  await prisma.document.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.application.deleteMany();
  await prisma.subsidyStandard.deleteMany();
  await prisma.user.deleteMany();

  const handler1 = await prisma.user.create({ data: { name: "张经办", role: UserRole.HANDLER } });
  const handler2 = await prisma.user.create({ data: { name: "李经办", role: UserRole.HANDLER } });
  const reviewer1 = await prisma.user.create({ data: { name: "王复核", role: UserRole.REVIEWER } });
  const reviewer2 = await prisma.user.create({ data: { name: "赵复核", role: UserRole.REVIEWER } });

  await prisma.subsidyStandard.createMany({
    data: [
      { level: SubsidyLevel.LEVEL_1, name: "特困一档", minIncome: 0, maxIncome: 800, amount: 2000, description: "家庭人均月收入800元以下" },
      { level: SubsidyLevel.LEVEL_2, name: "困难二档", minIncome: 801, maxIncome: 1500, amount: 1500, description: "家庭人均月收入801-1500元" },
      { level: SubsidyLevel.LEVEL_3, name: "一般三档", minIncome: 1501, maxIncome: 2500, amount: 1000, description: "家庭人均月收入1501-2500元" },
      { level: SubsidyLevel.LEVEL_4, name: "临时四档", minIncome: 2501, maxIncome: 3500, amount: 600, description: "家庭人均月收入2501-3500元，临时困难" },
      { level: SubsidyLevel.LEVEL_5, name: "特殊五档", minIncome: 3501, maxIncome: 99999, amount: 300, description: "特殊情况补助，需工会主席审批" },
    ],
  });

  // sample1: 资料齐全
  await prisma.application.create({
    data: {
      applicantName: "陈大明",
      applicantIdCard: "110101197001011234",
      phone: "13800138001",
      address: "北京市朝阳区建国路88号院3号楼2单元501",
      source: "基层工会推荐",
      status: ApplicationStatus.PENDING_REVIEW,
      subsidyLevel: SubsidyLevel.LEVEL_2,
      exceedsStandard: false,
      currentHandlerId: handler1.id,
      currentReviewerId: reviewer1.id,
      createdAt: new Date("2026-06-01T10:00:00Z"),
      familyMembers: {
        create: [
          { name: "陈大明", relation: "本人", age: 45, occupation: "企业职工", monthlyIncome: 2200, healthStatus: "良好" },
          { name: "刘桂芳", relation: "配偶", age: 43, occupation: "无业", monthlyIncome: 0, healthStatus: "长期患病" },
          { name: "陈晓宇", relation: "子女", age: 18, occupation: "学生", monthlyIncome: 0, healthStatus: "良好" },
        ],
      },
      documents: {
        create: [
          { type: DocumentType.ID_CARD, name: "身份证复印件", status: DocumentStatus.VERIFIED, uploadDate: new Date("2026-06-01T10:05:00Z") },
          { type: DocumentType.HOUSEHOLD_REGISTER, name: "户口本复印件", status: DocumentStatus.VERIFIED, uploadDate: new Date("2026-06-01T10:05:00Z") },
          { type: DocumentType.INCOME_PROOF, name: "收入证明", status: DocumentStatus.VERIFIED, uploadDate: new Date("2026-06-01T10:10:00Z") },
          { type: DocumentType.MEDICAL_CERTIFICATE, name: "配偶疾病诊断证明", status: DocumentStatus.VERIFIED, uploadDate: new Date("2026-06-01T10:15:00Z") },
          { type: DocumentType.DIFFICULTY_PROOF, name: "困难情况说明", status: DocumentStatus.VERIFIED, uploadDate: new Date("2026-06-01T10:20:00Z") },
        ],
      },
      approvalLogs: {
        create: [
          { userId: handler1.id, actionType: ActionType.SUBMIT_APPLICATION, description: "提交困难补助申请", createdAt: new Date("2026-06-01T10:00:00Z") },
          { userId: handler1.id, actionType: ActionType.ADD_NOTE, description: "核实家庭情况，配偶长期患病需治疗，子女在读", createdAt: new Date("2026-06-01T15:00:00Z") },
          { userId: handler1.id, actionType: ActionType.UPLOAD_DOCUMENT, description: "所有材料已审核通过", createdAt: new Date("2026-06-02T10:00:00Z") },
          { userId: handler1.id, actionType: ActionType.ADD_NOTE, description: "提交复核", createdAt: new Date("2026-06-02T14:30:00Z") },
        ],
      },
    },
  });

  // sample2: 收入证明缺失
  await prisma.application.create({
    data: {
      applicantName: "王秀兰",
      applicantIdCard: "110102196505055678",
      phone: "13900139002",
      address: "北京市海淀区中关村大街1号院5号楼3单元102",
      source: "个人申请",
      status: ApplicationStatus.PENDING_HANDLER,
      subsidyLevel: SubsidyLevel.LEVEL_3,
      exceedsStandard: false,
      currentHandlerId: handler2.id,
      createdAt: new Date("2026-06-03T09:00:00Z"),
      familyMembers: {
        create: [
          { name: "王秀兰", relation: "本人", age: 58, occupation: "退休", monthlyIncome: 3200, healthStatus: "患糖尿病" },
          { name: "李建国", relation: "配偶", age: 60, occupation: "退休", monthlyIncome: 3500, healthStatus: "良好" },
        ],
      },
      documents: {
        create: [
          { type: DocumentType.ID_CARD, name: "身份证复印件", status: DocumentStatus.PROVIDED, uploadDate: new Date("2026-06-03T09:05:00Z") },
          { type: DocumentType.HOUSEHOLD_REGISTER, name: "户口本复印件", status: DocumentStatus.PROVIDED, uploadDate: new Date("2026-06-03T09:05:00Z") },
          { type: DocumentType.INCOME_PROOF, name: "收入证明", status: DocumentStatus.MISSING },
          { type: DocumentType.MEDICAL_CERTIFICATE, name: "糖尿病诊断证明", status: DocumentStatus.PROVIDED, uploadDate: new Date("2026-06-03T09:10:00Z") },
        ],
      },
      approvalLogs: {
        create: [
          { userId: handler2.id, actionType: ActionType.SUBMIT_APPLICATION, description: "提交困难补助申请", createdAt: new Date("2026-06-03T09:00:00Z") },
        ],
      },
    },
  });

  // sample3: 补助标准超限
  await prisma.application.create({
    data: {
      applicantName: "张志伟",
      applicantIdCard: "110105198008089012",
      phone: "13700137003",
      address: "北京市丰台区丰台路5号院2号楼1单元301",
      source: "车间申报",
      status: ApplicationStatus.PENDING_REVIEW,
      subsidyLevel: SubsidyLevel.LEVEL_1,
      originalLevel: SubsidyLevel.LEVEL_3,
      exceedsStandard: true,
      approvalPath: "经办人申请→工会副主席→工会主席",
      currentHandlerId: handler1.id,
      currentReviewerId: reviewer2.id,
      createdAt: new Date("2026-05-28T14:00:00Z"),
      familyMembers: {
        create: [
          { name: "张志伟", relation: "本人", age: 42, occupation: "车间工人", monthlyIncome: 4500, healthStatus: "工伤致残" },
          { name: "赵小敏", relation: "配偶", age: 40, occupation: "服务员", monthlyIncome: 3000, healthStatus: "良好" },
          { name: "张浩", relation: "子女", age: 15, occupation: "学生", monthlyIncome: 0, healthStatus: "良好" },
          { name: "张父", relation: "父亲", age: 70, occupation: "无", monthlyIncome: 0, healthStatus: "瘫痪在床" },
        ],
      },
      documents: {
        create: [
          { type: DocumentType.ID_CARD, name: "身份证复印件", status: DocumentStatus.VERIFIED, uploadDate: new Date("2026-05-28T14:05:00Z") },
          { type: DocumentType.HOUSEHOLD_REGISTER, name: "户口本复印件", status: DocumentStatus.VERIFIED, uploadDate: new Date("2026-05-28T14:05:00Z") },
          { type: DocumentType.INCOME_PROOF, name: "收入证明", status: DocumentStatus.VERIFIED, uploadDate: new Date("2026-05-28T14:10:00Z") },
          { type: DocumentType.MEDICAL_CERTIFICATE, name: "工伤鉴定证明", status: DocumentStatus.VERIFIED, uploadDate: new Date("2026-05-28T14:15:00Z") },
          { type: DocumentType.DIFFICULTY_PROOF, name: "特殊困难情况说明", status: DocumentStatus.VERIFIED, uploadDate: new Date("2026-05-28T14:20:00Z") },
        ],
      },
      approvalLogs: {
        create: [
          { userId: handler1.id, actionType: ActionType.SUBMIT_APPLICATION, description: "提交困难补助申请", createdAt: new Date("2026-05-28T14:00:00Z") },
          { userId: handler1.id, actionType: ActionType.ADD_NOTE, description: "申请人因工伤致残，父亲瘫痪在床，虽收入超标准但情况特殊", createdAt: new Date("2026-05-29T10:00:00Z") },
          { userId: handler1.id, actionType: ActionType.ADJUST_SUBSIDY_LEVEL, description: "申请升级补助标准", oldValue: "LEVEL_3", newValue: "LEVEL_1", createdAt: new Date("2026-05-30T11:00:00Z") },
          { userId: handler1.id, actionType: ActionType.ADD_NOTE, description: "工会副主席已同意，报请主席审批", createdAt: new Date("2026-06-01T16:00:00Z") },
        ],
      },
    },
  });

  // sample4: 重复申请
  await prisma.application.create({
    data: {
      applicantName: "刘建国",
      applicantIdCard: "110106197503034567",
      phone: "13600136004",
      address: "北京市西城区西单大街10号院4号楼4单元201",
      source: "街道工会转介",
      status: ApplicationStatus.PENDING_HANDLER,
      subsidyLevel: SubsidyLevel.LEVEL_3,
      exceedsStandard: false,
      currentHandlerId: handler2.id,
      createdAt: new Date("2026-06-04T08:30:00Z"),
      familyMembers: {
        create: [
          { name: "刘建国", relation: "本人", age: 48, occupation: "下岗职工", monthlyIncome: 1800, healthStatus: "良好" },
          { name: "孙丽", relation: "配偶", age: 46, occupation: "保洁", monthlyIncome: 2000, healthStatus: "良好" },
        ],
      },
      documents: {
        create: [
          { type: DocumentType.ID_CARD, name: "身份证复印件", status: DocumentStatus.PROVIDED, uploadDate: new Date("2026-06-04T08:35:00Z") },
          { type: DocumentType.HOUSEHOLD_REGISTER, name: "户口本复印件", status: DocumentStatus.PROVIDED, uploadDate: new Date("2026-06-04T08:35:00Z") },
          { type: DocumentType.INCOME_PROOF, name: "收入证明", status: DocumentStatus.PROVIDED, uploadDate: new Date("2026-06-04T08:40:00Z") },
        ],
      },
      approvalLogs: {
        create: [
          { userId: handler2.id, actionType: ActionType.SUBMIT_APPLICATION, description: "提交困难补助申请", createdAt: new Date("2026-06-04T08:30:00Z") },
          { userId: handler2.id, actionType: ActionType.ADD_NOTE, description: "系统检测到该申请人2026年第一季度已领取过补助，请核实是否重复申请", createdAt: new Date("2026-06-04T08:30:00Z") },
        ],
      },
    },
  });

  // sample5: 已归档
  await prisma.application.create({
    data: {
      applicantName: "周国华",
      applicantIdCard: "110107196812127890",
      phone: "13500135005",
      address: "北京市东城区东直门外大街8号院1号楼5单元602",
      source: "工会走访",
      status: ApplicationStatus.ARCHIVED,
      subsidyLevel: SubsidyLevel.LEVEL_2,
      exceedsStandard: false,
      isArchived: true,
      archiveReason: "补助已发放，流程结束",
      archivedAt: new Date("2026-03-15T16:00:00Z"),
      currentHandlerId: handler1.id,
      currentReviewerId: reviewer1.id,
      createdAt: new Date("2026-03-01T10:00:00Z"),
      familyMembers: {
        create: [
          { name: "周国华", relation: "本人", age: 55, occupation: "内退", monthlyIncome: 2000, healthStatus: "心脏病" },
          { name: "王玉英", relation: "配偶", age: 53, occupation: "无业", monthlyIncome: 0, healthStatus: "良好" },
        ],
      },
      documents: {
        create: [
          { type: DocumentType.ID_CARD, name: "身份证复印件", status: DocumentStatus.VERIFIED, uploadDate: new Date("2026-03-01T10:05:00Z") },
          { type: DocumentType.HOUSEHOLD_REGISTER, name: "户口本复印件", status: DocumentStatus.VERIFIED, uploadDate: new Date("2026-03-01T10:05:00Z") },
          { type: DocumentType.INCOME_PROOF, name: "收入证明", status: DocumentStatus.VERIFIED, uploadDate: new Date("2026-03-01T10:10:00Z") },
        ],
      },
      approvalLogs: {
        create: [
          { userId: handler1.id, actionType: ActionType.SUBMIT_APPLICATION, description: "提交困难补助申请", createdAt: new Date("2026-03-01T10:00:00Z") },
          { userId: handler1.id, actionType: ActionType.ADD_NOTE, description: "申请人患有心脏病，需长期服药", createdAt: new Date("2026-03-02T09:00:00Z") },
          { userId: handler1.id, actionType: ActionType.ADD_NOTE, description: "材料齐全，提交复核", createdAt: new Date("2026-03-05T14:00:00Z") },
          { userId: reviewer1.id, actionType: ActionType.APPROVE, description: "同意发放困难补助1500元", createdAt: new Date("2026-03-10T10:00:00Z") },
          { userId: reviewer1.id, actionType: ActionType.ARCHIVE, description: "补助已发放，归档保存", createdAt: new Date("2026-03-15T16:00:00Z") },
        ],
      },
      archiveRecords: {
        create: [
          { conclusion: "同意发放困难补助1500元", finalAmount: 1500, archivedBy: "王复核", archivedAt: new Date("2026-03-15T16:00:00Z") },
        ],
      },
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

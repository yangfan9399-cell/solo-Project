import { db } from "./index";
import { registrations, courses, materials, grades, certificates, auditLogs, disputes } from "./schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const COURSE_ID_1 = randomUUID();
const COURSE_ID_2 = randomUUID();

async function seed() {
  await db.insert(courses).values([
    {
      id: COURSE_ID_1,
      name: "安全生产管理人员培训",
      code: "SAF-2025-01",
      passingScore: "60.00",
      description: "安全生产管理人员资格培训课程",
    },
    {
      id: COURSE_ID_2,
      name: "特种作业操作培训",
      code: "SPE-2025-01",
      passingScore: "70.00",
      description: "特种作业操作资格培训课程",
    },
  ]);

  const regPassed = randomUUID();
  const regMissing = randomUUID();
  const regGradeFail = randomUUID();
  const regDuplicate1 = randomUUID();
  const regDuplicate2 = randomUUID();

  await db.insert(registrations).values([
    {
      id: regPassed,
      regNo: "REG-2025-0001",
      applicantName: "张伟",
      applicantIdNo: "110101199001011234",
      source: "单位集体报名",
      courseId: COURSE_ID_1,
      status: "course_completed",
      currentRole: "reviewer",
      currentAssignee: "复核人李主任",
    },
    {
      id: regMissing,
      regNo: "REG-2025-0002",
      applicantName: "李娜",
      applicantIdNo: "310101198805052345",
      source: "个人网上报名",
      courseId: COURSE_ID_1,
      status: "material_missing",
      currentRole: "handler",
      currentAssignee: "经办人王明",
    },
    {
      id: regGradeFail,
      regNo: "REG-2025-0003",
      applicantName: "王强",
      applicantIdNo: "440101199203033456",
      source: "单位集体报名",
      courseId: COURSE_ID_2,
      status: "grade_not_met",
      currentRole: "handler",
      currentAssignee: "经办人赵红",
    },
    {
      id: regDuplicate1,
      regNo: "REG-2025-0004",
      applicantName: "陈刚",
      applicantIdNo: "510101198706064567",
      source: "个人网上报名",
      courseId: COURSE_ID_1,
      status: "duplicate",
      currentRole: "reviewer",
      currentAssignee: "复核人李主任",
      conflictRegNo: "REG-2025-0005",
    },
    {
      id: regDuplicate2,
      regNo: "REG-2025-0005",
      applicantName: "陈刚",
      applicantIdNo: "510101198706064567",
      source: "单位集体报名",
      courseId: COURSE_ID_1,
      status: "duplicate",
      currentRole: "reviewer",
      currentAssignee: "复核人李主任",
      conflictRegNo: "REG-2025-0004",
    },
  ]);

  await db.insert(materials).values([
    { id: randomUUID(), registrationId: regPassed, name: "身份证复印件", type: "id_copy", fileUrl: "/uploads/zhangwei_id.pdf", status: "verified", reviewedBy: "复核人李主任" },
    { id: randomUUID(), registrationId: regPassed, name: "学历证书", type: "certificate", fileUrl: "/uploads/zhangwei_degree.pdf", status: "verified", reviewedBy: "复核人李主任" },
    { id: randomUUID(), registrationId: regPassed, name: "培训成绩单", type: "transcript", fileUrl: "/uploads/zhangwei_transcript.pdf", status: "verified", reviewedBy: "复核人李主任" },
    { id: randomUUID(), registrationId: regMissing, name: "身份证复印件", type: "id_copy", fileUrl: "/uploads/lina_id.pdf", status: "submitted" },
    { id: randomUUID(), registrationId: regMissing, name: "学历证书", type: "certificate", status: "pending" },
    { id: randomUUID(), registrationId: regGradeFail, name: "身份证复印件", type: "id_copy", fileUrl: "/uploads/wangqiang_id.pdf", status: "verified", reviewedBy: "复核人李主任" },
    { id: randomUUID(), registrationId: regGradeFail, name: "学历证书", type: "certificate", fileUrl: "/uploads/wangqiang_degree.pdf", status: "verified", reviewedBy: "复核人李主任" },
    { id: randomUUID(), registrationId: regDuplicate1, name: "身份证复印件", type: "id_copy", fileUrl: "/uploads/chengang_id.pdf", status: "verified", reviewedBy: "复核人李主任" },
    { id: randomUUID(), registrationId: regDuplicate2, name: "身份证复印件", type: "id_copy", fileUrl: "/uploads/chengang_id2.pdf", status: "submitted" },
  ]);

  await db.insert(grades).values([
    { id: randomUUID(), registrationId: regPassed, courseId: COURSE_ID_1, score: "85.50", passed: 1, recordedBy: "经办人王明" },
    { id: randomUUID(), registrationId: regGradeFail, courseId: COURSE_ID_2, score: "55.00", passed: 0, recordedBy: "经办人赵红" },
  ]);

  await db.insert(auditLogs).values([
    { id: randomUUID(), registrationId: regPassed, action: "submit_registration", operator: "系统", operatorRole: "handler", detail: "张伟提交报名申请" },
    { id: randomUUID(), registrationId: regPassed, action: "review_qualified", operator: "复核人李主任", operatorRole: "reviewer", detail: "材料齐全，资格审核通过" },
    { id: randomUUID(), registrationId: regPassed, action: "record_grade", operator: "经办人王明", operatorRole: "handler", detail: "成绩录入：85.50分，达标" },
    { id: randomUUID(), registrationId: regMissing, action: "submit_registration", operator: "系统", operatorRole: "handler", detail: "李娜提交报名申请" },
    { id: randomUUID(), registrationId: regMissing, action: "mark_material_missing", operator: "复核人李主任", operatorRole: "reviewer", detail: "缺少学历证书，退回补材料" },
    { id: randomUUID(), registrationId: regGradeFail, action: "submit_registration", operator: "系统", operatorRole: "handler", detail: "王强提交报名申请" },
    { id: randomUUID(), registrationId: regGradeFail, action: "record_grade", operator: "经办人赵红", operatorRole: "handler", detail: "成绩录入：55.00分，未达标（要求70分）" },
    { id: randomUUID(), registrationId: regDuplicate1, action: "submit_registration", operator: "系统", operatorRole: "handler", detail: "陈刚提交报名申请（个人网上报名）" },
    { id: randomUUID(), registrationId: regDuplicate2, action: "submit_registration", operator: "系统", operatorRole: "handler", detail: "陈刚提交报名申请（单位集体报名）" },
    { id: randomUUID(), registrationId: regDuplicate1, action: "detect_duplicate", operator: "系统", operatorRole: "reviewer", detail: "检测到重复报名，冲突报名编号：REG-2025-0005" },
    { id: randomUUID(), registrationId: regDuplicate2, action: "detect_duplicate", operator: "系统", operatorRole: "reviewer", detail: "检测到重复报名，冲突报名编号：REG-2025-0004" },
  ]);

  await db.insert(disputes).values([
    {
      id: randomUUID(),
      registrationId: regDuplicate1,
      conflictRegNo: "REG-2025-0005",
      reason: "同一人同一课程重复报名，其中一条是误报，请核实后保留正确报名并解除证书阻断",
      status: "open",
      submittedBy: "经办人王明",
    },
    {
      id: randomUUID(),
      registrationId: regGradeFail,
      conflictRegNo: null,
      reason: "成绩录入有误，实际考试成绩应为82分（已达70分及格线），请复核",
      status: "open",
      submittedBy: "经办人赵红",
    },
    {
      id: randomUUID(),
      registrationId: regMissing,
      conflictRegNo: null,
      reason: "材料补交后仍被标记缺失，已重新上传学历证书，请重新审核",
      status: "resolved",
      submittedBy: "经办人王明",
      resolvedBy: "复核人李主任",
      resolution: "已核实补交材料，材料已齐全，状态变更为待审核",
      resolvedAt: new Date(),
    },
  ]);

  await db.insert(auditLogs).values([
    {
      id: randomUUID(),
      registrationId: regDuplicate1,
      action: "create_dispute",
      operator: "经办人王明",
      operatorRole: "handler",
      detail: "提交资格争议（重复报名，冲突编号：REG-2025-0005）：同一人同一课程重复报名，其中一条是误报，请核实后保留正确报名并解除证书阻断",
    },
    {
      id: randomUUID(),
      registrationId: regGradeFail,
      action: "create_dispute",
      operator: "经办人赵红",
      operatorRole: "handler",
      detail: "提交资格争议：成绩录入有误，实际考试成绩应为82分（已达70分及格线），请复核",
    },
  ]);

  console.log("Seed data inserted successfully!");
}

seed().catch(console.error);

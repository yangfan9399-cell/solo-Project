import { db } from "./index.server";
import { users, elders, staff, serviceRecords, reviewNodes, changeLogs } from "./schema.server";

async function seed() {
  console.log("🌱 Seeding database...");

  await db.delete(changeLogs);
  await db.delete(reviewNodes);
  await db.delete(serviceRecords);
  await db.delete(users);
  await db.delete(elders);
  await db.delete(staff);

  const [adminUser, operatorUser, reviewerUser] = await db
    .insert(users)
    .values([
      { name: "系统管理员", role: "admin", phone: "13800000000" },
      { name: "张经办人", role: "operator", phone: "13800000001" },
      { name: "李复核人", role: "reviewer", phone: "13800000002" },
    ])
    .returning();

  const elderData = await db
    .insert(elders)
    .values([
      {
        name: "王爷爷",
        phone: "13900000001",
        address: "阳光社区1号楼2单元301室",
        gender: "男",
        age: 78,
        emergencyContact: "王小明（儿子）",
        emergencyPhone: "13800001111",
        healthNotes: "高血压，需每日服药",
      },
      {
        name: "刘奶奶",
        phone: "13900000002",
        address: "阳光社区3号楼1单元102室",
        gender: "女",
        age: 82,
        emergencyContact: "刘小红（女儿）",
        emergencyPhone: "13800002222",
        healthNotes: "糖尿病，腿脚不便",
      },
      {
        name: "陈爷爷",
        phone: "13900000003",
        address: "阳光社区5号楼3单元401室",
        gender: "男",
        age: 75,
        emergencyContact: "陈大伟（侄子）",
        emergencyPhone: "13800003333",
        healthNotes: "轻度老年痴呆",
      },
      {
        name: "赵奶奶",
        phone: "13900000004",
        address: "阳光社区2号楼2单元502室",
        gender: "女",
        age: 85,
        emergencyContact: "赵明（孙子）",
        emergencyPhone: "13800004444",
        healthNotes: "心脏病，术后恢复中",
      },
      {
        name: "孙大爷",
        phone: "13900000005",
        address: "阳光社区7号楼1单元203室",
        gender: "男",
        age: 80,
        emergencyContact: "孙丽（女儿）",
        emergencyPhone: "13800005555",
        healthNotes: "骨关节炎，行动缓慢",
      },
    ])
    .returning();

  const staffData = await db
    .insert(staff)
    .values([
      {
        name: "护工小王",
        phone: "13700000001",
        skills: ["日常护理", "康复训练", "家务协助"],
      },
      {
        name: "护工小李",
        phone: "13700000002",
        skills: ["医疗护理", "心理疏导", "送餐服务"],
      },
      {
        name: "护工小张",
        phone: "13700000003",
        skills: ["康复训练", "日常护理", "陪诊服务"],
      },
    ])
    .returning();

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const scheduledTime1 = new Date(today);
  scheduledTime1.setHours(9, 0, 0, 0);

  const scheduledTime2 = new Date(today);
  scheduledTime2.setHours(10, 30, 0, 0);

  const scheduledTime3 = new Date(yesterday);
  scheduledTime3.setHours(14, 0, 0, 0);

  const scheduledTime4 = new Date(today);
  scheduledTime4.setHours(15, 0, 0, 0);

  const scheduledTime5 = new Date(today);
  scheduledTime5.setHours(11, 0, 0, 0);

  const [record1, record2, record3, record4, record5] = await db
    .insert(serviceRecords)
    .values([
      {
        elderId: elderData[0].id,
        staffId: staffData[0].id,
        operatorId: operatorUser.id,
        serviceType: "日常护理",
        scheduledTime: scheduledTime1,
        status: "scheduled",
        serviceNotes: "今日待上门服务",
      },
      {
        elderId: elderData[1].id,
        staffId: staffData[1].id,
        operatorId: operatorUser.id,
        serviceType: "康复训练",
        scheduledTime: scheduledTime2,
        status: "completed",
        actualStartTime: scheduledTime2,
        actualEndTime: new Date(scheduledTime2.getTime() + 60 * 60 * 1000),
        serviceNotes: "服务完成，老人状态良好",
      },
      {
        elderId: elderData[2].id,
        staffId: staffData[0].id,
        operatorId: operatorUser.id,
        serviceType: "医疗护理",
        scheduledTime: scheduledTime3,
        status: "no_answer",
        actualStartTime: scheduledTime3,
        actualEndTime: new Date(scheduledTime3.getTime() + 30 * 60 * 1000),
        serviceNotes: "上门时老人未接听电话，敲门无应答",
      },
      {
        elderId: elderData[3].id,
        staffId: staffData[2].id,
        operatorId: operatorUser.id,
        serviceType: "家务协助",
        scheduledTime: scheduledTime4,
        status: "complaint",
        actualStartTime: scheduledTime4,
        actualEndTime: new Date(scheduledTime4.getTime() + 45 * 60 * 1000),
        serviceNotes: "家属投诉服务质量问题",
      },
      {
        elderId: elderData[4].id,
        staffId: staffData[1].id,
        operatorId: operatorUser.id,
        serviceType: "康复训练",
        scheduledTime: scheduledTime5,
        status: "time_conflict",
        actualStartTime: scheduledTime5,
        actualEndTime: new Date(scheduledTime5.getTime() + 20 * 60 * 1000),
        serviceNotes: "预约时长60分钟，实际仅服务20分钟。护工称老人当日状态不佳，提前结束训练。预约时长与实际服务时长严重不符，需经办人补充说明。",
      },
    ])
    .returning();

  const [reviewNode1, reviewNode2, reviewNode3, reviewNode4, reviewNode5] = await db
    .insert(reviewNodes)
    .values([
      {
        serviceRecordId: record1.id,
        operatorId: operatorUser.id,
        reviewStatus: "pending",
        nodeOrder: 1,
      },
      {
        serviceRecordId: record2.id,
        operatorId: operatorUser.id,
        reviewerId: reviewerUser.id,
        reviewStatus: "approved",
        reviewConclusion: "服务正常完成，老人满意",
        reviewNotes: "服务记录完整，无需补充材料",
        isArchived: true,
        nodeOrder: 1,
        reviewedAt: new Date(),
      },
      {
        serviceRecordId: record3.id,
        operatorId: operatorUser.id,
        reviewerId: reviewerUser.id,
        reviewStatus: "rework",
        reviewConclusion: "需再次联系确认老人安全",
        reviewNotes: "已电话联系紧急联系人，确认老人安全。请安排二次上门回访",
        nodeOrder: 1,
        reviewedAt: new Date(),
      },
      {
        serviceRecordId: record4.id,
        operatorId: operatorUser.id,
        reviewerId: reviewerUser.id,
        reviewStatus: "pending",
        nodeOrder: 1,
      },
      {
        serviceRecordId: record5.id,
        operatorId: operatorUser.id,
        reviewStatus: "pending",
        nodeOrder: 1,
      },
    ])
    .returning();

  await db.insert(reviewNodes).values({
    serviceRecordId: record3.id,
    parentId: reviewNode3.id,
    operatorId: operatorUser.id,
    reviewStatus: "pending",
    supplementNotes: "已重新预约今日下午再次上门",
    nodeOrder: 2,
  });

  await db.insert(changeLogs).values([
    {
      serviceRecordId: record3.id,
      reviewNodeId: reviewNode3.id,
      userId: reviewerUser.id,
      fieldName: "reviewStatus",
      oldValue: "pending",
      newValue: "rework",
      reason: "根据回访结果，老人未接听，需要二次上门确认",
    },
    {
      serviceRecordId: record3.id,
      reviewNodeId: reviewNode3.id,
      userId: operatorUser.id,
      fieldName: "supplementNotes",
      oldValue: "",
      newValue: "已重新预约今日下午再次上门",
      reason: "联系紧急联系人后，安排二次上门",
    },
    {
      serviceRecordId: record5.id,
      reviewNodeId: reviewNode5.id,
      userId: operatorUser.id,
      fieldName: "supplementNotes",
      oldValue: "",
      newValue: "预约时长60分钟，实际仅20分钟，等待护工提交书面说明",
      reason: "系统检测到服务时长与预约时长差异超过30分钟",
    },
  ]);

  console.log("✅ Seeding completed!");
  console.log("👤 Users:", adminUser.name, operatorUser.name, reviewerUser.name);
  console.log("👴 Elders:", elderData.length);
  console.log("👩‍⚕️ Staff:", staffData.length);
  console.log("📋 Service records: 5 (含服务时长冲突样本)");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

import { db } from "./index";
import { projects, groups, participants, registrations, reviews, history } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  await db.transaction(async (tx) => {
    await tx.delete(history);
    await tx.delete(reviews);
    await tx.delete(registrations);
    await tx.delete(participants);
    await tx.delete(groups);
    await tx.delete(projects);

    const [project1, project2] = await tx
      .insert(projects)
      .values([
        { name: "男子100米短跑", description: "田径短跑项目" },
        { name: "女子跳远", description: "田径跳跃项目" },
      ])
      .returning();

    const [group1, group2, group3, group4] = await tx
      .insert(groups)
      .values([
        {
          projectId: project1.id,
          name: "18-25岁组",
          ageMin: 18,
          ageMax: 25,
          gender: "男",
          checkInTime: new Date("2026-06-10T08:00:00"),
        },
        {
          projectId: project1.id,
          name: "26-35岁组",
          ageMin: 26,
          ageMax: 35,
          gender: "男",
          checkInTime: new Date("2026-06-10T08:30:00"),
        },
        {
          projectId: project2.id,
          name: "18-25岁组",
          ageMin: 18,
          ageMax: 25,
          gender: "女",
          checkInTime: new Date("2026-06-10T09:00:00"),
        },
        {
          projectId: project2.id,
          name: "26-35岁组",
          ageMin: 26,
          ageMax: 35,
          gender: "女",
          checkInTime: new Date("2026-06-10T09:30:00"),
        },
      ])
      .returning();

    const [p1, p2, p3, p4] = await tx
      .insert(participants)
      .values([
        {
          name: "张三",
          idNumber: "110101199501011234",
          birthDate: new Date("1995-01-01"),
          gender: "男",
          phone: "13800138001",
          idExpiryDate: new Date("2030-12-31"),
        },
        {
          name: "李四",
          idNumber: "110101199002022345",
          birthDate: new Date("1990-02-02"),
          gender: "男",
          phone: "13800138002",
          idExpiryDate: new Date("2025-12-31"),
        },
        {
          name: "王五",
          idNumber: "110101199203033456",
          birthDate: new Date("1992-03-03"),
          gender: "女",
          phone: "13800138003",
          idExpiryDate: new Date("2030-12-31"),
        },
        {
          name: "赵六",
          idNumber: "110101199804044567",
          birthDate: new Date("1998-04-04"),
          gender: "男",
          phone: "13800138004",
          idExpiryDate: new Date("2030-12-31"),
        },
      ] as any)
      .returning();

    const [r1, r2, r3, r4] = await tx
      .insert(registrations)
      .values([
        {
          participantId: p1.id,
          projectId: project1.id,
          groupId: group1.id,
          registrationStatus: "qualified",
          checkInStatus: "checked_in",
          clerkNotes: "资料齐全",
          refereeNotes: "资格审核通过",
          score: 1050,
          rank: 1,
        },
        {
          participantId: p2.id,
          projectId: project1.id,
          groupId: group1.id,
          registrationStatus: "disqualified",
          checkInStatus: "rejected",
          clerkNotes: "证件已过期",
          refereeNotes: "证件有效期不足，不予通过",
        },
        {
          participantId: p3.id,
          projectId: project1.id,
          groupId: group1.id,
          registrationStatus: "qualified",
          checkInStatus: "wrong_group",
          clerkNotes: "性别不符",
          refereeNotes: "组别错误，需调整",
        },
        {
          participantId: p4.id,
          projectId: project1.id,
          groupId: group1.id,
          registrationStatus: "qualified",
          checkInStatus: "late",
          clerkNotes: "资料齐全",
          refereeNotes: "资格审核通过",
        },
      ])
      .returning();

    await tx.insert(reviews).values([
      {
        registrationId: r1.id,
        reviewerRole: "clerk",
        reviewerName: "经办人小王",
        decision: "资料完整",
        notes: "所有资料齐全，信息无误",
      },
      {
        registrationId: r1.id,
        reviewerRole: "referee",
        reviewerName: "裁判李老师",
        decision: "通过",
        notes: "符合参赛条件，资格审核通过",
      },
      {
        registrationId: r2.id,
        reviewerRole: "clerk",
        reviewerName: "经办人小王",
        decision: "需补充",
        notes: "证件已过期，请更新",
      },
      {
        registrationId: r2.id,
        reviewerRole: "referee",
        reviewerName: "裁判李老师",
        decision: "不通过",
        notes: "证件过期，不符合参赛要求",
      },
      {
        registrationId: r3.id,
        reviewerRole: "clerk",
        reviewerName: "经办人小王",
        decision: "待调整",
        notes: "性别与组别不符，建议调整到女子组",
      },
      {
        registrationId: r3.id,
        reviewerRole: "referee",
        reviewerName: "裁判李老师",
        decision: "待调整",
        notes: "组别错误，请联系经办人调整",
      },
      {
        registrationId: r4.id,
        reviewerRole: "clerk",
        reviewerName: "经办人小王",
        decision: "资料完整",
        notes: "所有资料齐全",
      },
      {
        registrationId: r4.id,
        reviewerRole: "referee",
        reviewerName: "裁判李老师",
        decision: "通过",
        notes: "资格审核通过",
      },
    ]);

    await tx.insert(history).values([
      {
        registrationId: r1.id,
        action: "registered",
        actorName: "系统",
        details: "在线报名成功",
      },
      {
        registrationId: r1.id,
        action: "clerk_updated",
        actorName: "经办人小王",
        details: "资料审核完成，信息无误",
      },
      {
        registrationId: r1.id,
        action: "referee_approved",
        actorName: "裁判李老师",
        details: "资格审核通过",
      },
      {
        registrationId: r1.id,
        action: "checked_in",
        actorName: "检录员小张",
        details: "准时到场，检录完成",
      },
      {
        registrationId: r1.id,
        action: "score_submitted",
        actorName: "裁判李老师",
        details: "成绩：10.50秒，排名第1",
      },
      {
        registrationId: r2.id,
        action: "registered",
        actorName: "系统",
        details: "在线报名成功",
      },
      {
        registrationId: r2.id,
        action: "document_expired",
        actorName: "经办人小王",
        details: "发现证件已过期",
      },
      {
        registrationId: r2.id,
        action: "referee_rejected",
        actorName: "裁判李老师",
        details: "证件过期，取消参赛资格",
      },
      {
        registrationId: r3.id,
        action: "registered",
        actorName: "系统",
        details: "在线报名成功",
      },
      {
        registrationId: r3.id,
        action: "clerk_updated",
        actorName: "经办人小王",
        details: "发现性别与组别不符",
      },
      {
        registrationId: r3.id,
        action: "wrong_group_detected",
        actorName: "检录员小张",
        details: "检录时发现组别错误，已阻止检录",
      },
      {
        registrationId: r4.id,
        action: "registered",
        actorName: "系统",
        details: "在线报名成功",
      },
      {
        registrationId: r4.id,
        action: "clerk_updated",
        actorName: "经办人小王",
        details: "资料审核完成",
      },
      {
        registrationId: r4.id,
        action: "referee_approved",
        actorName: "裁判李老师",
        details: "资格审核通过",
      },
      {
        registrationId: r4.id,
        action: "checked_in",
        actorName: "检录员小张",
        details: "迟到15分钟，准予参赛",
      },
    ]);
  });

  console.log("✅ Seeding completed!");
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

import { db } from "./index";
import {
  contractors,
  workers,
  certificates,
  workZones,
  workPermits,
  permitWorkers,
  approvalNodes,
  riskItems,
  permitIssues,
} from "./schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 开始种子数据...");

  await db.execute(sql`TRUNCATE TABLE permit_issues, risk_items, approval_nodes, permit_workers, work_permits, certificates, workers, contractors, work_zones RESTART IDENTITY CASCADE`);

  console.log("✅ 清空数据表");

  const [contractor1, contractor2, contractor3] = await db
    .insert(contractors)
    .values([
      {
        name: "华盛舞台搭建工程有限公司",
        contactPerson: "张建国",
        phone: "13800138001",
        email: "zhangjg@huasheng.com",
        licenseNumber: "HS-TJ-2024-001",
      },
      {
        name: "星辰灯光音响工程有限公司",
        contactPerson: "李明辉",
        phone: "13900139002",
        email: "limh@starlight.com",
        licenseNumber: "XC-GY-2024-002",
      },
      {
        name: "宏远起重安装有限公司",
        contactPerson: "王大志",
        phone: "13700137003",
        email: "wangdz@hongyuan.com",
        licenseNumber: "HY-QZ-2024-003",
      },
    ])
    .returning();

  console.log("✅ 创建承包商数据");

  const [worker1, worker2, worker3, worker4, worker5, worker6, worker7, worker8] =
    await db
      .insert(workers)
      .values([
        {
          contractorId: contractor1.id,
          name: "陈大伟",
          idNumber: "110101199001011234",
          phone: "13600136001",
        },
        {
          contractorId: contractor1.id,
          name: "刘小强",
          idNumber: "110101199203045678",
          phone: "13600136002",
        },
        {
          contractorId: contractor1.id,
          name: "赵德胜",
          idNumber: "110101198805069012",
          phone: "13600136003",
        },
        {
          contractorId: contractor2.id,
          name: "孙明亮",
          idNumber: "310101199102033456",
          phone: "13600136004",
        },
        {
          contractorId: contractor2.id,
          name: "周云峰",
          idNumber: "310101199304057890",
          phone: "13600136005",
        },
        {
          contractorId: contractor3.id,
          name: "吴建军",
          idNumber: "440101198706072345",
          phone: "13600136006",
        },
        {
          contractorId: contractor3.id,
          name: "郑海涛",
          idNumber: "440101199008096789",
          phone: "13600136007",
        },
        {
          contractorId: contractor3.id,
          name: "黄建国",
          idNumber: "440101198510110123",
          phone: "13600136008",
        },
      ])
      .returning();

  console.log("✅ 创建人员数据");

  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setFullYear(today.getFullYear() + 2);
  const pastDate = new Date(today);
  pastDate.setFullYear(today.getFullYear() - 1);
  const soonDate = new Date(today);
  soonDate.setMonth(today.getMonth() + 1);

  await db.insert(certificates).values([
    {
      workerId: worker1.id,
      type: "height_work",
      certificateNumber: "DG-2023-001234",
      issueDate: new Date("2023-06-15"),
      expiryDate: futureDate,
      issuingAuthority: "北京市应急管理局",
    },
    {
      workerId: worker1.id,
      type: "scaffolding",
      certificateNumber: "SJ-2022-005678",
      issueDate: new Date("2022-09-20"),
      expiryDate: futureDate,
      issuingAuthority: "中国建筑协会",
    },
    {
      workerId: worker2.id,
      type: "height_work",
      certificateNumber: "DG-2022-008765",
      issueDate: new Date("2022-04-10"),
      expiryDate: pastDate,
      issuingAuthority: "北京市应急管理局",
    },
    {
      workerId: worker2.id,
      type: "electrician",
      certificateNumber: "DG-2023-001111",
      issueDate: new Date("2023-03-15"),
      expiryDate: futureDate,
      issuingAuthority: "国家能源局",
    },
    {
      workerId: worker3.id,
      type: "welding",
      certificateNumber: "HH-2023-002222",
      issueDate: new Date("2023-01-20"),
      expiryDate: futureDate,
      issuingAuthority: "中国焊接协会",
    },
    {
      workerId: worker3.id,
      type: "height_work",
      certificateNumber: "DG-2023-003333",
      issueDate: new Date("2023-08-05"),
      expiryDate: futureDate,
      issuingAuthority: "北京市应急管理局",
    },
    {
      workerId: worker4.id,
      type: "electrician",
      certificateNumber: "DG-2022-004444",
      issueDate: new Date("2022-11-30"),
      expiryDate: futureDate,
      issuingAuthority: "上海市应急管理局",
    },
    {
      workerId: worker4.id,
      type: "height_work",
      certificateNumber: "DG-2023-005555",
      issueDate: new Date("2023-05-12"),
      expiryDate: futureDate,
      issuingAuthority: "上海市应急管理局",
    },
    {
      workerId: worker5.id,
      type: "electrician",
      certificateNumber: "DG-2023-006666",
      issueDate: new Date("2023-02-28"),
      expiryDate: futureDate,
      issuingAuthority: "上海市应急管理局",
    },
    {
      workerId: worker6.id,
      type: "crane_operator",
      certificateNumber: "QZ-2023-007777",
      issueDate: new Date("2023-07-10"),
      expiryDate: futureDate,
      issuingAuthority: "广东省市场监督管理局",
    },
    {
      workerId: worker6.id,
      type: "height_work",
      certificateNumber: "DG-2022-008888",
      issueDate: new Date("2022-12-01"),
      expiryDate: pastDate,
      issuingAuthority: "广东省应急管理厅",
    },
    {
      workerId: worker7.id,
      type: "crane_operator",
      certificateNumber: "QZ-2023-009999",
      issueDate: new Date("2023-04-18"),
      expiryDate: futureDate,
      issuingAuthority: "广东省市场监督管理局",
    },
    {
      workerId: worker7.id,
      type: "height_work",
      certificateNumber: "DG-2023-001010",
      issueDate: new Date("2023-09-25"),
      expiryDate: futureDate,
      issuingAuthority: "广东省应急管理厅",
    },
    {
      workerId: worker8.id,
      type: "scaffolding",
      certificateNumber: "SJ-2021-011111",
      issueDate: new Date("2021-06-30"),
      expiryDate: pastDate,
      issuingAuthority: "中国建筑协会",
    },
    {
      workerId: worker8.id,
      type: "first_aid",
      certificateNumber: "JJ-2023-012121",
      issueDate: new Date("2023-03-10"),
      expiryDate: futureDate,
      issuingAuthority: "中国红十字会",
    },
  ] as any[]);

  console.log("✅ 创建资质证书数据");

  const [zone1, zone2, zone3, zone4, zone5] = await db
    .insert(workZones)
    .values([
      {
        name: "主舞台区域",
        code: "ZONE-MAIN-01",
        description: "演唱会主舞台搭建区域，包含舞台台面和背景桁架",
        isHighRisk: true,
        capacity: 50,
      },
      {
        name: "左侧观众区",
        code: "ZONE-LEFT-02",
        description: "左侧观众席搭建区域",
        isHighRisk: false,
        capacity: 30,
      },
      {
        name: "右侧观众区",
        code: "ZONE-RIGHT-03",
        description: "右侧观众席搭建区域",
        isHighRisk: false,
        capacity: 30,
      },
      {
        name: "灯光吊挂区",
        code: "ZONE-LIGHT-04",
        description: "顶部灯光音响吊挂区域，高空作业",
        isHighRisk: true,
        capacity: 20,
      },
      {
        name: "后场装卸区",
        code: "ZONE-BACK-05",
        description: "后台设备装卸和临时存放区",
        isHighRisk: false,
        capacity: 40,
      },
    ])
    .returning();

  console.log("✅ 创建施工区域数据");

  const startDate1 = new Date(today);
  startDate1.setDate(today.getDate() + 3);
  startDate1.setHours(9, 0, 0, 0);
  const endDate1 = new Date(startDate1);
  endDate1.setDate(startDate1.getDate() + 2);
  endDate1.setHours(18, 0, 0, 0);

  const startDate2 = new Date(today);
  startDate2.setDate(today.getDate() + 1);
  startDate2.setHours(20, 0, 0, 0);
  const endDate2 = new Date(startDate2);
  endDate2.setDate(startDate2.getDate() + 1);
  endDate2.setHours(6, 0, 0, 0);

  const startDate3 = new Date(today);
  startDate3.setDate(today.getDate() + 5);
  startDate3.setHours(8, 0, 0, 0);
  const endDate3 = new Date(startDate3);
  endDate3.setDate(startDate3.getDate() + 3);
  endDate3.setHours(20, 0, 0, 0);

  const startDate4 = new Date(today);
  startDate4.setDate(today.getDate() - 2);
  startDate4.setHours(9, 0, 0, 0);
  const endDate4 = new Date(startDate4);
  endDate4.setDate(startDate4.getDate() + 1);
  endDate4.setHours(18, 0, 0, 0);

  const submittedAt = new Date(today);
  submittedAt.setDate(today.getDate() - 1);
  submittedAt.setHours(14, 30, 0, 0);

  const securityApprovedAt = new Date(submittedAt);
  securityApprovedAt.setHours(16, 0, 0, 0);

  const [permit1, permit2, permit3, permit4] = await db
    .insert(workPermits)
    .values([
      {
        permitNumber: "WP-2024-0001",
        contractorId: contractor1.id,
        workType: "stage_setup",
        title: "主舞台台面搭建作业",
        description: "进行演唱会主舞台台面搭建，包括舞台板铺设、舞台支架安装等工作。",
        workZoneId: zone1.id,
        startTime: startDate1,
        endTime: endDate1,
        isNightWork: false,
        status: "security_approved",
        submittedAt: submittedAt,
        securityApprovedAt: securityApprovedAt,
      },
      {
        permitNumber: "WP-2024-0002",
        contractorId: contractor3.id,
        workType: "truss_hoisting",
        title: "灯光桁架吊装作业",
        description: "进行顶部灯光桁架吊装作业，涉及大型起重设备和高空作业。",
        workZoneId: zone4.id,
        startTime: startDate3,
        endTime: endDate3,
        isNightWork: true,
        nightPermitNumber: "NIGHT-2024-0015",
        status: "submitted",
        submittedAt: new Date(),
      },
      {
        permitNumber: "WP-2024-0003",
        contractorId: contractor2.id,
        workType: "lighting_install",
        title: "舞台灯光设备安装调试",
        description: "进行舞台灯光设备的安装、接线和调试工作。",
        workZoneId: zone1.id,
        startTime: startDate2,
        endTime: endDate2,
        isNightWork: true,
        status: "security_approved",
        submittedAt: new Date(Date.now() - 3600000 * 2),
        securityApprovedAt: new Date(Date.now() - 3600000),
      },
      {
        permitNumber: "WP-2024-0004",
        contractorId: contractor1.id,
        workType: "scaffolding",
        title: "观众席脚手架搭设",
        description: "左侧观众区临时观演脚手架搭设作业。",
        workZoneId: zone2.id,
        startTime: startDate4,
        endTime: endDate4,
        isNightWork: false,
        status: "manager_approved",
        submittedAt: new Date(Date.now() - 86400000 * 3),
        securityApprovedAt: new Date(Date.now() - 86400000 * 2.5),
        safetyApprovedAt: new Date(Date.now() - 86400000 * 2),
        managerApprovedAt: new Date(Date.now() - 86400000),
      },
    ])
    .returning();

  console.log("✅ 创建作业许可证数据");

  await db.insert(permitWorkers).values([
    { permitId: permit1.id, workerId: worker1.id, role: "现场负责人" },
    { permitId: permit1.id, workerId: worker2.id, role: "高空作业人员" },
    { permitId: permit1.id, workerId: worker3.id, role: "焊工" },
    { permitId: permit2.id, workerId: worker6.id, role: "起重司机" },
    { permitId: permit2.id, workerId: worker7.id, role: "信号司索工" },
    { permitId: permit2.id, workerId: worker8.id, role: "架子工" },
    { permitId: permit3.id, workerId: worker4.id, role: "电工" },
    { permitId: permit3.id, workerId: worker5.id, role: "灯光师" },
    { permitId: permit4.id, workerId: worker1.id, role: "现场负责人" },
    { permitId: permit4.id, workerId: worker3.id, role: "架子工" },
  ]);

  console.log("✅ 创建作业人员关联数据");

  await db.insert(approvalNodes).values([
    {
      permitId: permit1.id,
      role: "security",
      action: "approve",
      status: "security_approved",
      comment: "人员身份核验通过，进场物资检查合格",
      operatorName: "安保-赵队长",
      createdAt: securityApprovedAt,
    },
    {
      permitId: permit2.id,
      role: "contractor",
      action: "submit",
      status: "submitted",
      comment: "提交申请，请审核",
      operatorName: "王大志",
      createdAt: new Date(),
    },
    {
      permitId: permit3.id,
      role: "security",
      action: "approve",
      status: "security_approved",
      comment: "安保核验通过",
      operatorName: "安保-孙队",
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      permitId: permit4.id,
      role: "security",
      action: "approve",
      status: "security_approved",
      comment: "核验通过",
      operatorName: "安保-赵队长",
      createdAt: new Date(Date.now() - 86400000 * 2.5),
    },
    {
      permitId: permit4.id,
      role: "safety_officer",
      action: "approve",
      status: "safety_approved",
      comment: "脚手架搭设方案可行",
      operatorName: "安全主管-钱工",
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      permitId: permit4.id,
      role: "project_manager",
      action: "approve",
      status: "manager_approved",
      comment: "批准作业",
      operatorName: "项目经理-周总",
      createdAt: new Date(Date.now() - 86400000),
    },
  ]);

  console.log("✅ 创建审批节点数据");

  await db.insert(riskItems).values([
    {
      permitId: permit1.id,
      title: "高空坠落风险",
      description: "舞台搭建涉及2米以上高空作业，存在坠落风险",
      level: "high",
      mitigation: "作业人员必须系安全带，设置安全网，专人监护",
      isResolved: true,
    },
    {
      permitId: permit1.id,
      title: "物体打击风险",
      description: "高处工具材料可能坠落伤人",
      level: "medium",
      mitigation: "工具系防坠绳，材料堆放稳固，下方设置警戒区",
      isResolved: true,
    },
    {
      permitId: permit2.id,
      title: "起重伤害风险",
      description: "桁架吊装过程中存在起重伤害风险",
      level: "high",
      mitigation: "持证上岗，专人指挥，设置警戒区，定期检查吊具",
      isResolved: false,
    },
    {
      permitId: permit2.id,
      title: "高空坠落风险",
      description: "桁架安装涉及高空作业",
      level: "high",
      mitigation: "系安全带，搭设操作平台",
      isResolved: false,
    },
    {
      permitId: permit3.id,
      title: "触电风险",
      description: "灯光设备接线存在触电风险",
      level: "medium",
      mitigation: "持证电工操作，断电作业，验电确认",
      isResolved: false,
    },
    {
      permitId: permit4.id,
      title: "脚手架坍塌风险",
      description: "脚手架搭设不规范可能导致坍塌",
      level: "high",
      mitigation: "按规范搭设，经验收合格后方可使用",
      isResolved: true,
    },
  ]);

  console.log("✅ 创建风险清单数据");

  await db.insert(permitIssues).values([
    {
      permitId: permit3.id,
      issueType: "night_permit_missing",
      description: "夜间施工但未提供有效的夜间施工审批文件",
      isBlocking: true,
    },
    {
      permitId: permit2.id,
      issueType: "certificate_expired",
      description: "起重司机吴建军的登高证已过期，存在安全隐患",
      isBlocking: true,
    },
    {
      permitId: permit2.id,
      issueType: "zone_conflict",
      description: "吊装区域与主舞台搭建区域存在交叉作业冲突",
      isBlocking: false,
    },
    {
      permitId: permit1.id,
      issueType: "certificate_expired",
      description: "刘小强的登高证已过期，需重新取证后方可进行高空作业",
      isBlocking: true,
    },
  ]);

  console.log("✅ 创建问题记录数据");

  console.log("\n🎉 种子数据创建完成！");
  console.log("\n📋 预置的四类样本：");
  console.log("  1. ✅ 正常进场样本 - WP-2024-0004 (观众席脚手架搭设，已通过项目经理审批)");
  console.log("  2. ⚠️  登高证过期样本 - WP-2024-0001 (主舞台搭建，刘小强登高证已过期)");
  console.log("  3. ⚠️  吊装区域冲突样本 - WP-2024-0002 (灯光桁架吊装，与主舞台区域冲突)");
  console.log("  4. 🌙 夜间施工审批缺失样本 - WP-2024-0003 (灯光安装，夜间施工但无审批)");
}

seed()
  .catch((err) => {
    console.error("❌ 种子数据创建失败:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

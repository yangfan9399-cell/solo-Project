import { prisma } from "../src/lib/prisma";
import {
  PetType,
  StaffRole,
  HospitalizationStatus,
  OrderStatus,
  NursingType,
  FeeStatus,
  AnomalyType,
} from "../src/types/enums";

async function main() {
  console.log("开始播种数据...");

  await prisma.feeReview.deleteMany();
  await prisma.feeItem.deleteMany();
  await prisma.nursingRecord.deleteMany();
  await prisma.medicalOrder.deleteMany();
  await prisma.hospitalization.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.department.deleteMany();

  const internalDept = await prisma.department.create({
    data: { name: "内科" },
  });
  const surgeryDept = await prisma.department.create({
    data: { name: "外科" },
  });
  const dermatologyDept = await prisma.department.create({
    data: { name: "皮肤科" },
  });
  const emergencyDept = await prisma.department.create({
    data: { name: "急诊科" },
  });

  const receptionist = await prisma.staff.create({
    data: {
      name: "王前台",
      role: StaffRole.RECEPTIONIST,
      departmentId: emergencyDept.id,
    },
  });

  const nurse1 = await prisma.staff.create({
    data: {
      name: "李护士",
      role: StaffRole.NURSE,
      departmentId: internalDept.id,
    },
  });

  const nurse2 = await prisma.staff.create({
    data: {
      name: "张护士",
      role: StaffRole.NURSE,
      departmentId: surgeryDept.id,
    },
  });

  const vet1 = await prisma.staff.create({
    data: {
      name: "陈兽医",
      role: StaffRole.VETERINARIAN,
      departmentId: internalDept.id,
    },
  });

  const vet2 = await prisma.staff.create({
    data: {
      name: "刘兽医",
      role: StaffRole.VETERINARIAN,
      departmentId: surgeryDept.id,
    },
  });

  const finance = await prisma.staff.create({
    data: {
      name: "赵财务",
      role: StaffRole.FINANCE,
      departmentId: emergencyDept.id,
    },
  });

  const now = new Date();
  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const hoursAgo = (hours: number) =>
    new Date(now.getTime() - hours * 60 * 60 * 1000);

  // ========== 案例1：正常出院（小黄 - 狗 - 犬细小病毒）==========
  const owner1 = await prisma.owner.create({
    data: {
      name: "王先生",
      phone: "13800000001",
      idCard: "110101199001011234",
      address: "北京市朝阳区XX路1号",
    },
  });

  const pet1 = await prisma.pet.create({
    data: {
      name: "小黄",
      type: PetType.DOG,
      breed: "金毛犬",
      age: 2,
      weight: 25.5,
      gender: "公",
      ownerId: owner1.id,
    },
  });

  const hosp1 = await prisma.hospitalization.create({
    data: {
      petId: pet1.id,
      departmentId: internalDept.id,
      primaryDiagnosis: "犬细小病毒感染",
      secondaryDiagnosis: "轻度脱水",
      admissionDate: daysAgo(7),
      dischargeDate: daysAgo(0),
      status: HospitalizationStatus.DISCHARGED,
      ward: "内科A区",
      cageNumber: "A-101",
      chiefComplaint: "呕吐、腹泻2天，精神萎靡",
      anomalyType: AnomalyType.NONE,
    },
  });

  const order1_1 = await prisma.medicalOrder.create({
    data: {
      hospitalizationId: hosp1.id,
      orderType: "输液治疗",
      content: "复方氯化钠注射液 500ml 静脉滴注",
      dosage: "500ml",
      frequency: "每日1次",
      startDate: daysAgo(7),
      endDate: daysAgo(2),
      status: OrderStatus.CONFIRMED,
      createdById: vet1.id,
      confirmedById: vet1.id,
      confirmedAt: daysAgo(7),
    },
  });

  const order1_2 = await prisma.medicalOrder.create({
    data: {
      hospitalizationId: hosp1.id,
      orderType: "药物治疗",
      content: "干扰素 300万单位 皮下注射",
      dosage: "300万IU",
      frequency: "每日1次",
      startDate: daysAgo(7),
      endDate: daysAgo(2),
      status: OrderStatus.CONFIRMED,
      createdById: vet1.id,
      confirmedById: vet1.id,
      confirmedAt: daysAgo(7),
    },
  });

  const order1_3 = await prisma.medicalOrder.create({
    data: {
      hospitalizationId: hosp1.id,
      orderType: "药物治疗",
      content: "头孢曲松钠 0.5g 静脉推注",
      dosage: "0.5g",
      frequency: "每日2次",
      startDate: daysAgo(7),
      endDate: daysAgo(2),
      status: OrderStatus.CONFIRMED,
      createdById: vet1.id,
      confirmedById: vet1.id,
      confirmedAt: daysAgo(7),
    },
  });

  for (let day = 6; day >= 0; day--) {
    await prisma.nursingRecord.create({
      data: {
        hospitalizationId: hosp1.id,
        type: NursingType.VITAL_SIGNS,
        content: `第${7 - day}天生命体征监测`,
        recordedById: nurse1.id,
        recordTime: hoursAgo(day * 24 + 8),
        temperature: 38.5 + Math.random() * 0.5,
        heartRate: 90 + Math.floor(Math.random() * 20),
        respiratoryRate: 20 + Math.floor(Math.random() * 5),
        appetite: day < 4 ? "差" : "良好",
        stool: day < 3 ? "稀软" : "正常",
        mentalStatus: day < 3 ? "萎靡" : day < 5 ? "一般" : "活泼",
        isAbnormal: false,
      },
    });

    await prisma.nursingRecord.create({
      data: {
        hospitalizationId: hosp1.id,
        type: NursingType.MEDICATION,
        content: `执行输液治疗和药物注射`,
        recordedById: nurse1.id,
        recordTime: hoursAgo(day * 24 + 10),
        orderId: order1_1.id,
        isAbnormal: false,
      },
    });
  }

  await prisma.feeItem.createMany({
    data: [
      {
        hospitalizationId: hosp1.id,
        name: "挂号费",
        category: "挂号",
        quantity: 1,
        unitPrice: 50,
        totalPrice: 50,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(7),
      },
      {
        hospitalizationId: hosp1.id,
        name: "住院费",
        category: "住院",
        quantity: 7,
        unitPrice: 200,
        totalPrice: 1400,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(7),
      },
      {
        hospitalizationId: hosp1.id,
        name: "护理费",
        category: "护理",
        quantity: 7,
        unitPrice: 150,
        totalPrice: 1050,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(7),
      },
      {
        hospitalizationId: hosp1.id,
        name: "输液治疗费",
        category: "治疗",
        quantity: 5,
        unitPrice: 180,
        totalPrice: 900,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(7),
      },
      {
        hospitalizationId: hosp1.id,
        name: "干扰素",
        category: "药品",
        quantity: 5,
        unitPrice: 120,
        totalPrice: 600,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(7),
      },
      {
        hospitalizationId: hosp1.id,
        name: "头孢曲松钠",
        category: "药品",
        quantity: 10,
        unitPrice: 45,
        totalPrice: 450,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(7),
      },
      {
        hospitalizationId: hosp1.id,
        name: "化验检查费",
        category: "检查",
        quantity: 2,
        unitPrice: 300,
        totalPrice: 600,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(7),
      },
    ],
  });

  await prisma.feeReview.create({
    data: {
      hospitalizationId: hosp1.id,
      reviewedById: finance.id,
      totalAmount: 5050,
      actualAmount: 5050,
      reviewNote: "费用核对无误，正常结算",
      isFinal: true,
      reviewedAt: daysAgo(0),
    },
  });

  // ========== 案例2：用药漏记（小白 - 猫 - 猫瘟热）==========
  const owner2 = await prisma.owner.create({
    data: {
      name: "李女士",
      phone: "13800000002",
      idCard: "110101199202022345",
      address: "北京市海淀区XX路2号",
    },
  });

  const pet2 = await prisma.pet.create({
    data: {
      name: "小白",
      type: PetType.CAT,
      breed: "英国短毛猫",
      age: 1.5,
      weight: 3.2,
      gender: "母",
      ownerId: owner2.id,
    },
  });

  const hosp2 = await prisma.hospitalization.create({
    data: {
      petId: pet2.id,
      departmentId: internalDept.id,
      primaryDiagnosis: "猫瘟热病毒感染",
      secondaryDiagnosis: "严重脱水、电解质紊乱",
      admissionDate: daysAgo(5),
      dischargeDate: null,
      status: HospitalizationStatus.IN_TREATMENT,
      ward: "内科B区",
      cageNumber: "B-203",
      chiefComplaint: "持续呕吐腹泻3天，高热不退",
      anomalyType: AnomalyType.MEDICATION_MISSED,
      anomalyNote: "第3天上午的干扰素注射漏记，未执行",
    },
  });

  const order2_1 = await prisma.medicalOrder.create({
    data: {
      hospitalizationId: hosp2.id,
      orderType: "输液治疗",
      content: "乳酸林格氏液 250ml 静脉滴注",
      dosage: "250ml",
      frequency: "每日2次",
      startDate: daysAgo(5),
      status: OrderStatus.CONFIRMED,
      createdById: vet1.id,
      confirmedById: vet1.id,
      confirmedAt: daysAgo(5),
    },
  });

  const order2_2 = await prisma.medicalOrder.create({
    data: {
      hospitalizationId: hosp2.id,
      orderType: "药物治疗",
      content: "猫干扰素 200万单位 皮下注射",
      dosage: "200万IU",
      frequency: "每日1次",
      startDate: daysAgo(5),
      status: OrderStatus.CONFIRMED,
      createdById: vet1.id,
      confirmedById: vet1.id,
      confirmedAt: daysAgo(5),
    },
  });

  const order2_3 = await prisma.medicalOrder.create({
    data: {
      hospitalizationId: hosp2.id,
      orderType: "药物治疗",
      content: "胃复安 0.5ml 皮下注射",
      dosage: "0.5ml",
      frequency: "每日2次",
      startDate: daysAgo(5),
      status: OrderStatus.PENDING,
      createdById: vet1.id,
      note: "待确认补执行",
    },
  });

  for (let day = 4; day >= 0; day--) {
    await prisma.nursingRecord.create({
      data: {
        hospitalizationId: hosp2.id,
        type: NursingType.VITAL_SIGNS,
        content: `第${5 - day}天生命体征监测`,
        recordedById: nurse1.id,
        recordTime: hoursAgo(day * 24 + 8),
        temperature: 39.2 - day * 0.15,
        heartRate: 140 - day * 5,
        respiratoryRate: 28 - day * 2,
        appetite: day > 2 ? "极差" : "一般",
        stool: day > 1 ? "水样便" : "偏软",
        mentalStatus: day > 2 ? "沉郁" : "稍好转",
        isAbnormal: day === 4,
        abnormalNote: day === 4 ? "体温过高，心率偏快" : null,
      },
    });

    if (day !== 2) {
      await prisma.nursingRecord.create({
        data: {
          hospitalizationId: hosp2.id,
          type: NursingType.MEDICATION,
          content: `执行输液和药物注射`,
          recordedById: nurse1.id,
          recordTime: hoursAgo(day * 24 + 10),
          orderId: order2_1.id,
          isAbnormal: false,
        },
      });
    }
  }

  await prisma.feeItem.createMany({
    data: [
      {
        hospitalizationId: hosp2.id,
        name: "挂号费",
        category: "挂号",
        quantity: 1,
        unitPrice: 50,
        totalPrice: 50,
        status: FeeStatus.CONFIRMED,
        recordDate: daysAgo(5),
      },
      {
        hospitalizationId: hosp2.id,
        name: "住院费",
        category: "住院",
        quantity: 5,
        unitPrice: 200,
        totalPrice: 1000,
        status: FeeStatus.PENDING,
        recordDate: daysAgo(5),
      },
      {
        hospitalizationId: hosp2.id,
        name: "护理费",
        category: "护理",
        quantity: 5,
        unitPrice: 180,
        totalPrice: 900,
        status: FeeStatus.PENDING,
        recordDate: daysAgo(5),
      },
      {
        hospitalizationId: hosp2.id,
        name: "输液治疗费",
        category: "治疗",
        quantity: 10,
        unitPrice: 120,
        totalPrice: 1200,
        status: FeeStatus.PENDING,
        recordDate: daysAgo(5),
      },
      {
        hospitalizationId: hosp2.id,
        name: "猫干扰素",
        category: "药品",
        quantity: 5,
        unitPrice: 150,
        totalPrice: 750,
        status: FeeStatus.PENDING,
        recordDate: daysAgo(5),
      },
      {
        hospitalizationId: hosp2.id,
        name: "化验检查费",
        category: "检查",
        quantity: 3,
        unitPrice: 350,
        totalPrice: 1050,
        status: FeeStatus.CONFIRMED,
        recordDate: daysAgo(5),
      },
    ],
  });

  // ========== 案例3：护理异常（小灰 - 兔 - 消化系统疾病）==========
  const owner3 = await prisma.owner.create({
    data: {
      name: "张先生",
      phone: "13800000003",
      idCard: "110101198803033456",
      address: "北京市西城区XX路3号",
    },
  });

  const pet3 = await prisma.pet.create({
    data: {
      name: "小灰",
      type: PetType.RABBIT,
      breed: "荷兰垂耳兔",
      age: 1,
      weight: 1.8,
      gender: "公",
      ownerId: owner3.id,
    },
  });

  const hosp3 = await prisma.hospitalization.create({
    data: {
      petId: pet3.id,
      departmentId: internalDept.id,
      primaryDiagnosis: "毛球症伴发胃肠停滞",
      secondaryDiagnosis: "轻度脱水",
      admissionDate: daysAgo(3),
      dischargeDate: null,
      status: HospitalizationStatus.IN_TREATMENT,
      ward: "内科C区",
      cageNumber: "C-305",
      chiefComplaint: "2天未进食，排便减少",
      anomalyType: AnomalyType.NURSING_ABNORMAL,
      anomalyNote: "护理过程中发现患兔精神突然变差，体温下降，已通知兽医处理",
    },
  });

  const order3_1 = await prisma.medicalOrder.create({
    data: {
      hospitalizationId: hosp3.id,
      orderType: "液体治疗",
      content: "皮下补液 50ml",
      dosage: "50ml",
      frequency: "每日2次",
      startDate: daysAgo(3),
      status: OrderStatus.CONFIRMED,
      createdById: vet1.id,
      confirmedById: vet1.id,
      confirmedAt: daysAgo(3),
    },
  });

  const order3_2 = await prisma.medicalOrder.create({
    data: {
      hospitalizationId: hosp3.id,
      orderType: "药物治疗",
      content: "西沙必利 0.5mg 口服",
      dosage: "0.5mg",
      frequency: "每日2次",
      startDate: daysAgo(3),
      status: OrderStatus.CONFIRMED,
      createdById: vet1.id,
      confirmedById: vet1.id,
      confirmedAt: daysAgo(3),
    },
  });

  for (let day = 2; day >= 0; day--) {
    await prisma.nursingRecord.create({
      data: {
        hospitalizationId: hosp3.id,
        type: NursingType.VITAL_SIGNS,
        content: `第${3 - day}天生命体征监测`,
        recordedById: nurse2.id,
        recordTime: hoursAgo(day * 24 + 8),
        temperature: day === 1 ? 37.8 : 38.5 + Math.random() * 0.3,
        heartRate: day === 1 ? 120 : 140 + Math.floor(Math.random() * 10),
        respiratoryRate: day === 1 ? 40 : 50 + Math.floor(Math.random() * 5),
        appetite: day > 0 ? "废绝" : "少量进食",
        stool: day > 1 ? "未排便" : "少量",
        mentalStatus:
          day === 1 ? "精神沉郁" : day === 2 ? "精神一般" : "稍好转",
        isAbnormal: day === 1,
        abnormalNote:
          day === 1
            ? "体温偏低，心率减慢，呼吸急促，立即通知兽医检查处理"
            : null,
      },
    });

    await prisma.nursingRecord.create({
      data: {
        hospitalizationId: hosp3.id,
        type: NursingType.MEDICATION,
        content: `皮下补液和口服药物`,
        recordedById: nurse2.id,
        recordTime: hoursAgo(day * 24 + 10),
        orderId: order3_1.id,
        isAbnormal: false,
      },
    });
  }

  await prisma.nursingRecord.create({
    data: {
      hospitalizationId: hosp3.id,
      type: NursingType.OTHER,
      content:
        "异常情况处理记录：发现患兔精神沉郁、体温偏低后，立即给予保温处理，通知兽医。兽医检查后调整了治疗方案，增加了补液量和频次。",
      recordedById: nurse2.id,
      recordTime: hoursAgo(2 * 24 + 12),
      isAbnormal: true,
      abnormalNote: "护理异常-体温下降，已处理并记录",
    },
  });

  await prisma.feeItem.createMany({
    data: [
      {
        hospitalizationId: hosp3.id,
        name: "挂号费",
        category: "挂号",
        quantity: 1,
        unitPrice: 50,
        totalPrice: 50,
        status: FeeStatus.CONFIRMED,
        recordDate: daysAgo(3),
      },
      {
        hospitalizationId: hosp3.id,
        name: "住院费",
        category: "住院",
        quantity: 3,
        unitPrice: 150,
        totalPrice: 450,
        status: FeeStatus.PENDING,
        recordDate: daysAgo(3),
      },
      {
        hospitalizationId: hosp3.id,
        name: "护理费",
        category: "护理",
        quantity: 3,
        unitPrice: 120,
        totalPrice: 360,
        status: FeeStatus.PENDING,
        recordDate: daysAgo(3),
      },
      {
        hospitalizationId: hosp3.id,
        name: "皮下补液",
        category: "治疗",
        quantity: 6,
        unitPrice: 60,
        totalPrice: 360,
        status: FeeStatus.PENDING,
        recordDate: daysAgo(3),
      },
      {
        hospitalizationId: hosp3.id,
        name: "西沙必利",
        category: "药品",
        quantity: 6,
        unitPrice: 25,
        totalPrice: 150,
        status: FeeStatus.PENDING,
        recordDate: daysAgo(3),
      },
      {
        hospitalizationId: hosp3.id,
        name: "化验检查费",
        category: "检查",
        quantity: 2,
        unitPrice: 200,
        totalPrice: 400,
        status: FeeStatus.CONFIRMED,
        recordDate: daysAgo(3),
      },
    ],
  });

  // ========== 案例4：费用异议（小花 - 鸟 - 呼吸道感染）==========
  const owner4 = await prisma.owner.create({
    data: {
      name: "赵女士",
      phone: "13800000004",
      idCard: "110101199504044567",
      address: "北京市东城区XX路4号",
    },
  });

  const pet4 = await prisma.pet.create({
    data: {
      name: "小花",
      type: PetType.BIRD,
      breed: "虎皮鹦鹉",
      age: 0.5,
      weight: 0.03,
      gender: "母",
      ownerId: owner4.id,
    },
  });

  const hosp4 = await prisma.hospitalization.create({
    data: {
      petId: pet4.id,
      departmentId: dermatologyDept.id,
      primaryDiagnosis: "呼吸道感染",
      secondaryDiagnosis: "鼻窦炎",
      admissionDate: daysAgo(4),
      dischargeDate: daysAgo(1),
      status: HospitalizationStatus.READY_FOR_DISCHARGE,
      ward: "专科区",
      cageNumber: "D-401",
      chiefComplaint: "打喷嚏、流鼻涕、呼吸有啰音",
      anomalyType: AnomalyType.FEE_DISPUTE,
      anomalyNote: "主人对住院费用和护理费用有异议，认为收费过高，正在协商中",
    },
  });

  const order4_1 = await prisma.medicalOrder.create({
    data: {
      hospitalizationId: hosp4.id,
      orderType: "药物治疗",
      content: "多西环素 5mg 口服",
      dosage: "5mg",
      frequency: "每日2次",
      startDate: daysAgo(4),
      endDate: daysAgo(1),
      status: OrderStatus.CONFIRMED,
      createdById: vet2.id,
      confirmedById: vet2.id,
      confirmedAt: daysAgo(4),
    },
  });

  const order4_2 = await prisma.medicalOrder.create({
    data: {
      hospitalizationId: hosp4.id,
      orderType: "雾化治疗",
      content: "生理盐水雾化吸入",
      dosage: "2ml",
      frequency: "每日2次",
      startDate: daysAgo(4),
      endDate: daysAgo(1),
      status: OrderStatus.CONFIRMED,
      createdById: vet2.id,
      confirmedById: vet2.id,
      confirmedAt: daysAgo(4),
    },
  });

  for (let day = 3; day >= 0; day--) {
    await prisma.nursingRecord.create({
      data: {
        hospitalizationId: hosp4.id,
        type: NursingType.VITAL_SIGNS,
        content: `第${4 - day}天观察记录`,
        recordedById: nurse2.id,
        recordTime: hoursAgo(day * 24 + 9),
        appetite: day > 1 ? "一般" : "良好",
        mentalStatus: day > 1 ? "精神一般" : "精神良好",
        isAbnormal: false,
      },
    });

    await prisma.nursingRecord.create({
      data: {
        hospitalizationId: hosp4.id,
        type: NursingType.TREATMENT,
        content: `雾化治疗和给药`,
        recordedById: nurse2.id,
        recordTime: hoursAgo(day * 24 + 11),
        orderId: order4_2.id,
        isAbnormal: false,
      },
    });
  }

  await prisma.feeItem.createMany({
    data: [
      {
        hospitalizationId: hosp4.id,
        name: "挂号费",
        category: "挂号",
        quantity: 1,
        unitPrice: 50,
        totalPrice: 50,
        status: FeeStatus.CONFIRMED,
        recordDate: daysAgo(4),
      },
      {
        hospitalizationId: hosp4.id,
        name: "住院费",
        category: "住院",
        quantity: 4,
        unitPrice: 300,
        totalPrice: 1200,
        status: FeeStatus.DISPUTED,
        disputeNote: "主人认为鸟类住院费不应与犬猫同价，费用过高",
        recordDate: daysAgo(4),
      },
      {
        hospitalizationId: hosp4.id,
        name: "护理费",
        category: "护理",
        quantity: 4,
        unitPrice: 200,
        totalPrice: 800,
        status: FeeStatus.DISPUTED,
        disputeNote: "主人质疑护理内容和频次，认为收费过高",
        recordDate: daysAgo(4),
      },
      {
        hospitalizationId: hosp4.id,
        name: "雾化治疗费",
        category: "治疗",
        quantity: 8,
        unitPrice: 80,
        totalPrice: 640,
        status: FeeStatus.CONFIRMED,
        recordDate: daysAgo(4),
      },
      {
        hospitalizationId: hosp4.id,
        name: "多西环素",
        category: "药品",
        quantity: 8,
        unitPrice: 15,
        totalPrice: 120,
        status: FeeStatus.CONFIRMED,
        recordDate: daysAgo(4),
      },
      {
        hospitalizationId: hosp4.id,
        name: "化验检查费",
        category: "检查",
        quantity: 1,
        unitPrice: 250,
        totalPrice: 250,
        status: FeeStatus.CONFIRMED,
        recordDate: daysAgo(4),
      },
    ],
  });

  await prisma.feeReview.create({
    data: {
      hospitalizationId: hosp4.id,
      reviewedById: finance.id,
      totalAmount: 3060,
      actualAmount: null,
      reviewNote:
        "费用待确认，主人对住院费和护理费有异议，需进一步沟通协商",
      isFinal: false,
      reviewedAt: daysAgo(1),
    },
  });

  // ========== 案例5：外科骨折（增加数据用于复盘统计）==========
  const owner5 = await prisma.owner.create({
    data: {
      name: "孙先生",
      phone: "13800000005",
      idCard: "110101198705055678",
      address: "北京市丰台区XX路5号",
    },
  });

  const pet5 = await prisma.pet.create({
    data: {
      name: "大黑",
      type: PetType.DOG,
      breed: "拉布拉多",
      age: 3,
      weight: 30,
      gender: "公",
      ownerId: owner5.id,
    },
  });

  const hosp5 = await prisma.hospitalization.create({
    data: {
      petId: pet5.id,
      departmentId: surgeryDept.id,
      primaryDiagnosis: "右前肢桡骨骨折",
      secondaryDiagnosis: "软组织挫伤",
      admissionDate: daysAgo(10),
      dischargeDate: daysAgo(3),
      status: HospitalizationStatus.DISCHARGED,
      ward: "外科A区",
      cageNumber: "S-102",
      chiefComplaint: "从高处跌落，右前肢不能着地",
      anomalyType: AnomalyType.NONE,
    },
  });

  const order5_1 = await prisma.medicalOrder.create({
    data: {
      hospitalizationId: hosp5.id,
      orderType: "手术治疗",
      content: "骨折内固定术",
      dosage: "1次",
      frequency: "单次",
      startDate: daysAgo(9),
      status: OrderStatus.CONFIRMED,
      createdById: vet2.id,
      confirmedById: vet2.id,
      confirmedAt: daysAgo(9),
    },
  });

  const order5_2 = await prisma.medicalOrder.create({
    data: {
      hospitalizationId: hosp5.id,
      orderType: "药物治疗",
      content: "美洛昔康 7.5mg 口服",
      dosage: "7.5mg",
      frequency: "每日1次",
      startDate: daysAgo(9),
      endDate: daysAgo(3),
      status: OrderStatus.CONFIRMED,
      createdById: vet2.id,
      confirmedById: vet2.id,
      confirmedAt: daysAgo(9),
    },
  });

  for (let day = 9; day >= 3; day--) {
    await prisma.nursingRecord.create({
      data: {
        hospitalizationId: hosp5.id,
        type: NursingType.VITAL_SIGNS,
        content: `术后第${9 - day}天观察`,
        recordedById: nurse2.id,
        recordTime: hoursAgo(day * 24 + 9),
        temperature: 38.2 + Math.random() * 0.3,
        heartRate: 85 + Math.floor(Math.random() * 15),
        respiratoryRate: 18 + Math.floor(Math.random() * 4),
        appetite: "良好",
        mentalStatus: day > 7 ? "一般" : "活泼",
        isAbnormal: false,
      },
    });
  }

  await prisma.feeItem.createMany({
    data: [
      {
        hospitalizationId: hosp5.id,
        name: "挂号费",
        category: "挂号",
        quantity: 1,
        unitPrice: 50,
        totalPrice: 50,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(10),
      },
      {
        hospitalizationId: hosp5.id,
        name: "住院费",
        category: "住院",
        quantity: 7,
        unitPrice: 250,
        totalPrice: 1750,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(10),
      },
      {
        hospitalizationId: hosp5.id,
        name: "护理费",
        category: "护理",
        quantity: 7,
        unitPrice: 200,
        totalPrice: 1400,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(10),
      },
      {
        hospitalizationId: hosp5.id,
        name: "骨折内固定术",
        category: "手术",
        quantity: 1,
        unitPrice: 5000,
        totalPrice: 5000,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(10),
      },
      {
        hospitalizationId: hosp5.id,
        name: "麻醉费",
        category: "麻醉",
        quantity: 1,
        unitPrice: 800,
        totalPrice: 800,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(10),
      },
      {
        hospitalizationId: hosp5.id,
        name: "X光检查",
        category: "检查",
        quantity: 3,
        unitPrice: 300,
        totalPrice: 900,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(10),
      },
      {
        hospitalizationId: hosp5.id,
        name: "美洛昔康",
        category: "药品",
        quantity: 7,
        unitPrice: 30,
        totalPrice: 210,
        status: FeeStatus.SETTLED,
        recordDate: daysAgo(10),
      },
    ],
  });

  await prisma.feeReview.create({
    data: {
      hospitalizationId: hosp5.id,
      reviewedById: finance.id,
      totalAmount: 10110,
      actualAmount: 10110,
      reviewNote: "费用核对无误，已结算",
      isFinal: true,
      reviewedAt: daysAgo(3),
    },
  });

  console.log("数据播种完成！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

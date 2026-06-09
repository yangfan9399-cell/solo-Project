import { prisma } from "../src/lib/prisma";
import {
  HospitalizationStatus,
  OrderStatus,
  FeeStatus,
  AnomalyType,
  StaffRole,
  PetType,
  NursingType,
} from "../src/types/enums";

async function main() {
  console.log("开始播种种子数据...");

  await prisma.$transaction(async (tx) => {
    await tx.feeReview.deleteMany();
    await tx.feeItem.deleteMany();
    await tx.nursingRecord.deleteMany();
    await tx.medicalOrder.deleteMany();
    await tx.hospitalization.deleteMany();
    await tx.pet.deleteMany();
    await tx.owner.deleteMany();
    await tx.staff.deleteMany();
    await tx.department.deleteMany();

    const dept1 = await tx.department.create({
      data: { id: "dept_1", name: "内科" },
    });
    const dept2 = await tx.department.create({
      data: { id: "dept_2", name: "外科" },
    });
    const dept3 = await tx.department.create({
      data: { id: "dept_3", name: "皮肤科" },
    });
    const dept4 = await tx.department.create({
      data: { id: "dept_4", name: "急诊科" },
    });
    console.log("✓ 科室数据已创建");

    const staff1 = await tx.staff.create({
      data: {
        id: "staff_1",
        name: "王前台",
        role: StaffRole.RECEPTIONIST,
        departmentId: null,
      },
    });
    const staff2 = await tx.staff.create({
      data: {
        id: "staff_2",
        name: "李护士",
        role: StaffRole.NURSE,
        departmentId: dept1.id,
      },
    });
    const staff3 = await tx.staff.create({
      data: {
        id: "staff_3",
        name: "张护士",
        role: StaffRole.NURSE,
        departmentId: dept2.id,
      },
    });
    const staff4 = await tx.staff.create({
      data: {
        id: "staff_4",
        name: "陈兽医",
        role: StaffRole.VETERINARIAN,
        departmentId: dept1.id,
      },
    });
    const staff5 = await tx.staff.create({
      data: {
        id: "staff_5",
        name: "刘兽医",
        role: StaffRole.VETERINARIAN,
        departmentId: dept2.id,
      },
    });
    const staff6 = await tx.staff.create({
      data: {
        id: "staff_6",
        name: "赵财务",
        role: StaffRole.FINANCE,
        departmentId: null,
      },
    });
    console.log("✓ 员工数据已创建");

    const owner1 = await tx.owner.create({
      data: {
        id: "owner_1",
        name: "张小明",
        phone: "13800138001",
        idCard: "110101199001011234",
        address: "北京市朝阳区XX小区1号楼101室",
      },
    });
    const owner2 = await tx.owner.create({
      data: {
        id: "owner_2",
        name: "李女士",
        phone: "13900139002",
        idCard: null,
        address: "上海市浦东新区XX路88号",
      },
    });
    const owner3 = await tx.owner.create({
      data: {
        id: "owner_3",
        name: "王先生",
        phone: "13700137003",
        idCard: null,
        address: "广州市天河区XX花园",
      },
    });
    const owner4 = await tx.owner.create({
      data: {
        id: "owner_4",
        name: "赵小姐",
        phone: "13600136004",
        idCard: null,
        address: "深圳市南山区XX大厦",
      },
    });
    const owner5 = await tx.owner.create({
      data: {
        id: "owner_5",
        name: "孙先生",
        phone: "13500135005",
        idCard: null,
        address: "成都市武侯区XX街",
      },
    });
    console.log("✓ 主人数据已创建");

    const pet1 = await tx.pet.create({
      data: {
        id: "pet_1",
        name: "豆豆",
        type: PetType.DOG,
        breed: "金毛犬",
        age: 3,
        weight: 25.5,
        gender: "公",
        ownerId: owner1.id,
      },
    });
    const pet2 = await tx.pet.create({
      data: {
        id: "pet_2",
        name: "小白",
        type: PetType.CAT,
        breed: "英短蓝猫",
        age: 2,
        weight: 4.2,
        gender: "母",
        ownerId: owner2.id,
      },
    });
    const pet3 = await tx.pet.create({
      data: {
        id: "pet_3",
        name: "小灰",
        type: PetType.RABBIT,
        breed: "荷兰垂耳兔",
        age: 1.5,
        weight: 2.1,
        gender: "公",
        ownerId: owner3.id,
      },
    });
    const pet4 = await tx.pet.create({
      data: {
        id: "pet_4",
        name: "花花",
        type: PetType.DOG,
        breed: "泰迪犬",
        age: 5,
        weight: 6.8,
        gender: "母",
        ownerId: owner4.id,
      },
    });
    const pet5 = await tx.pet.create({
      data: {
        id: "pet_5",
        name: "咪咪",
        type: PetType.CAT,
        breed: "布偶猫",
        age: 4,
        weight: 5.5,
        gender: "母",
        ownerId: owner5.id,
      },
    });
    console.log("✓ 宠物数据已创建");

    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    const dayOffset = (days: number) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - days);
      return d;
    };

    const hosp1 = await tx.hospitalization.create({
      data: {
        id: "hosp_1",
        petId: pet1.id,
        departmentId: dept2.id,
        primaryDiagnosis: "股骨骨折",
        secondaryDiagnosis: "软组织损伤",
        admissionDate: dayOffset(10),
        dischargeDate: dayOffset(3),
        status: HospitalizationStatus.DISCHARGED,
        ward: "外科A区",
        cageNumber: "A-105",
        chiefComplaint: "被车撞伤，右后腿无法着地",
        anomalyType: AnomalyType.NONE,
        anomalyNote: null,
      },
    });

    const hosp2 = await tx.hospitalization.create({
      data: {
        id: "hosp_2",
        petId: pet2.id,
        departmentId: dept1.id,
        primaryDiagnosis: "猫瘟热病毒感染",
        secondaryDiagnosis: "严重脱水、电解质紊乱",
        admissionDate: dayOffset(5),
        dischargeDate: null,
        status: HospitalizationStatus.IN_TREATMENT,
        ward: "内科B区",
        cageNumber: "B-203",
        chiefComplaint: "持续呕吐腹泻3天，高热不退",
        anomalyType: AnomalyType.MEDICATION_MISSED,
        anomalyNote: "存在待确认医嘱",
      },
    });

    const hosp3 = await tx.hospitalization.create({
      data: {
        id: "hosp_3",
        petId: pet3.id,
        departmentId: dept1.id,
        primaryDiagnosis: "毛球症伴发胃肠停滞",
        secondaryDiagnosis: null,
        admissionDate: dayOffset(3),
        dischargeDate: null,
        status: HospitalizationStatus.IN_TREATMENT,
        ward: "内科A区",
        cageNumber: "A-112",
        chiefComplaint: "2天未进食，精神差",
        anomalyType: AnomalyType.NURSING_ABNORMAL,
        anomalyNote: "存在护理异常记录",
      },
    });

    const hosp4 = await tx.hospitalization.create({
      data: {
        id: "hosp_4",
        petId: pet4.id,
        departmentId: dept3.id,
        primaryDiagnosis: "过敏性皮炎",
        secondaryDiagnosis: "皮肤真菌感染",
        admissionDate: dayOffset(2),
        dischargeDate: null,
        status: HospitalizationStatus.IN_TREATMENT,
        ward: "皮肤科病区",
        cageNumber: "D-301",
        chiefComplaint: "全身瘙痒，频繁抓挠",
        anomalyType: AnomalyType.FEE_DISPUTE,
        anomalyNote: "存在费用争议，待协商解决",
      },
    });

    const hosp5 = await tx.hospitalization.create({
      data: {
        id: "hosp_5",
        petId: pet5.id,
        departmentId: dept4.id,
        primaryDiagnosis: "急性胰腺炎",
        secondaryDiagnosis: "低血糖",
        admissionDate: dayOffset(7),
        dischargeDate: dayOffset(1),
        status: HospitalizationStatus.DISCHARGED,
        ward: "急诊观察区",
        cageNumber: "E-008",
        chiefComplaint: "呕吐、腹痛、精神沉郁",
        anomalyType: AnomalyType.NONE,
        anomalyNote: null,
      },
    });
    console.log("✓ 住院记录已创建");

    await tx.medicalOrder.createMany({
      data: [
        {
          id: "order_1",
          hospitalizationId: hosp1.id,
          orderType: "手术治疗",
          content: "股骨骨折内固定术",
          dosage: null,
          frequency: null,
          startDate: dayOffset(9),
          endDate: dayOffset(9),
          status: OrderStatus.CONFIRMED,
          createdById: staff5.id,
          confirmedById: staff5.id,
          confirmedAt: dayOffset(9),
          note: "患肢肿胀消退后手术",
        },
        {
          id: "order_2",
          hospitalizationId: hosp1.id,
          orderType: "药物治疗",
          content: "头孢曲松钠注射液",
          dosage: "0.5g",
          frequency: "每日1次",
          startDate: dayOffset(9),
          endDate: dayOffset(4),
          status: OrderStatus.CONFIRMED,
          createdById: staff5.id,
          confirmedById: staff5.id,
          confirmedAt: dayOffset(9),
          note: "术后抗感染",
        },
        {
          id: "order_3",
          hospitalizationId: hosp1.id,
          orderType: "药物治疗",
          content: "美洛昔康注射液",
          dosage: "0.7ml",
          frequency: "每日1次",
          startDate: dayOffset(9),
          endDate: dayOffset(5),
          status: OrderStatus.CONFIRMED,
          createdById: staff5.id,
          confirmedById: staff5.id,
          confirmedAt: dayOffset(9),
          note: "镇痛消炎",
        },
        {
          id: "order_4",
          hospitalizationId: hosp2.id,
          orderType: "输液治疗",
          content: "乳酸林格氏液",
          dosage: "250ml",
          frequency: "每日2次",
          startDate: dayOffset(5),
          endDate: null,
          status: OrderStatus.CONFIRMED,
          createdById: staff4.id,
          confirmedById: staff4.id,
          confirmedAt: dayOffset(5),
          note: "补液纠正脱水",
        },
        {
          id: "order_5",
          hospitalizationId: hosp2.id,
          orderType: "药物治疗",
          content: "猫干扰素",
          dosage: "200万单位",
          frequency: "每日1次",
          startDate: dayOffset(5),
          endDate: null,
          status: OrderStatus.CONFIRMED,
          createdById: staff4.id,
          confirmedById: staff4.id,
          confirmedAt: dayOffset(5),
          note: "抗病毒治疗",
        },
        {
          id: "order_6",
          hospitalizationId: hosp2.id,
          orderType: "药物治疗",
          content: "胃复安 0.5ml 皮下注射",
          dosage: "0.5ml",
          frequency: "每日2次",
          startDate: dayOffset(4),
          endDate: null,
          status: OrderStatus.PENDING,
          createdById: staff4.id,
          confirmedById: null,
          confirmedAt: null,
          note: "止吐治疗呕吐症状",
        },
        {
          id: "order_7",
          hospitalizationId: hosp3.id,
          orderType: "药物治疗",
          content: "乳酶生片 口服",
          dosage: "2片",
          frequency: "每日3次",
          startDate: dayOffset(3),
          endDate: null,
          status: OrderStatus.CONFIRMED,
          createdById: staff4.id,
          confirmedById: staff4.id,
          confirmedAt: dayOffset(3),
          note: "助消化",
        },
        {
          id: "order_8",
          hospitalizationId: hosp3.id,
          orderType: "液体治疗",
          content: "皮下补液",
          dosage: "50ml",
          frequency: "每日2次",
          startDate: dayOffset(3),
          endDate: null,
          status: OrderStatus.CONFIRMED,
          createdById: staff4.id,
          confirmedById: staff4.id,
          confirmedAt: dayOffset(3),
          note: "补充水分",
        },
        {
          id: "order_9",
          hospitalizationId: hosp4.id,
          orderType: "药物治疗",
          content: "泼尼松龙片",
          dosage: "5mg",
          frequency: "每日1次",
          startDate: dayOffset(2),
          endDate: null,
          status: OrderStatus.CONFIRMED,
          createdById: staff4.id,
          confirmedById: staff4.id,
          confirmedAt: dayOffset(2),
          note: "抗过敏",
        },
        {
          id: "order_10",
          hospitalizationId: hosp4.id,
          orderType: "其他",
          content: "药浴治疗",
          dosage: null,
          frequency: "每日1次",
          startDate: dayOffset(2),
          endDate: null,
          status: OrderStatus.CONFIRMED,
          createdById: staff4.id,
          confirmedById: staff4.id,
          confirmedAt: dayOffset(2),
          note: "抗真菌药浴",
        },
        {
          id: "order_11",
          hospitalizationId: hosp5.id,
          orderType: "输液治疗",
          content: "复方氯化钠注射液",
          dosage: "200ml",
          frequency: "每日2次",
          startDate: dayOffset(7),
          endDate: dayOffset(2),
          status: OrderStatus.CONFIRMED,
          createdById: staff4.id,
          confirmedById: staff4.id,
          confirmedAt: dayOffset(7),
          note: "补液支持",
        },
        {
          id: "order_12",
          hospitalizationId: hosp5.id,
          orderType: "药物治疗",
          content: "乌司他丁",
          dosage: "5万单位",
          frequency: "每日2次",
          startDate: dayOffset(7),
          endDate: dayOffset(2),
          status: OrderStatus.CONFIRMED,
          createdById: staff4.id,
          confirmedById: staff4.id,
          confirmedAt: dayOffset(7),
          note: "抑制胰酶",
        },
      ],
    });
    console.log("✓ 医嘱数据已创建");

    const nursingRecords = [];

    for (let i = 7; i >= 1; i--) {
      const day = dayOffset(i);
      nursingRecords.push({
        hospitalizationId: hosp1.id,
        type: NursingType.VITAL_SIGNS,
        content: `第${8 - i}天生命体征监测：体温38.8℃，心率95次/分，呼吸22次/分，精神良好`,
        recordedById: staff3.id,
        recordTime: new Date(day.getTime() + 8 * 3600 * 1000),
        temperature: 38.8,
        heartRate: 95,
        respiratoryRate: 22,
        bloodPressure: null,
        weight: null,
        appetite: "良好",
        stool: "正常",
        urine: "正常",
        mentalStatus: "良好",
        isAbnormal: false,
        abnormalNote: null,
        orderId: null,
      });
    }

    nursingRecords.push({
      hospitalizationId: hosp2.id,
      type: NursingType.TREATMENT,
      content: "入院后立即进行补液和药物注射，患猫精神沉郁，食欲废绝",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(5).getTime() + 10 * 3600 * 1000),
      temperature: 40.2,
      heartRate: 160,
      respiratoryRate: 30,
      bloodPressure: null,
      weight: 4.2,
      appetite: "废绝",
      stool: "稀软",
      urine: "正常",
      mentalStatus: "沉郁",
      isAbnormal: false,
      abnormalNote: null,
      orderId: "order_4",
    });

    nursingRecords.push({
      hospitalizationId: hosp2.id,
      type: NursingType.VITAL_SIGNS,
      content: "第2天生命体征监测：体温39.5℃，心率150次/分，呼吸28次/分，仍有呕吐",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(4).getTime() + 8 * 3600 * 1000),
      temperature: 39.5,
      heartRate: 150,
      respiratoryRate: 28,
      bloodPressure: null,
      weight: null,
      appetite: "废绝",
      stool: "水样便",
      urine: "正常",
      mentalStatus: "沉郁",
      isAbnormal: false,
      abnormalNote: null,
      orderId: null,
    });

    nursingRecords.push({
      hospitalizationId: hosp2.id,
      type: NursingType.MEDICATION,
      content: "执行输液和药物注射",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(4).getTime() + 10 * 3600 * 1000),
      temperature: null,
      heartRate: null,
      respiratoryRate: null,
      bloodPressure: null,
      weight: null,
      appetite: null,
      stool: null,
      urine: null,
      mentalStatus: null,
      isAbnormal: false,
      abnormalNote: null,
      orderId: "order_4",
    });

    nursingRecords.push({
      hospitalizationId: hosp2.id,
      type: NursingType.VITAL_SIGNS,
      content: "第3天生命体征监测：体温39.0℃，心率130次/分，呼吸25次/分，呕吐减轻",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(3).getTime() + 8 * 3600 * 1000),
      temperature: 39.0,
      heartRate: 130,
      respiratoryRate: 25,
      bloodPressure: null,
      weight: null,
      appetite: "差",
      stool: "稀软",
      urine: "正常",
      mentalStatus: "一般",
      isAbnormal: false,
      abnormalNote: null,
      orderId: null,
    });

    nursingRecords.push({
      hospitalizationId: hosp2.id,
      type: NursingType.MEDICATION,
      content: "执行输液和药物注射",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(3).getTime() + 10 * 3600 * 1000),
      temperature: null,
      heartRate: null,
      respiratoryRate: null,
      bloodPressure: null,
      weight: null,
      appetite: null,
      stool: null,
      urine: null,
      mentalStatus: null,
      isAbnormal: false,
      abnormalNote: null,
      orderId: "order_5",
    });

    nursingRecords.push({
      hospitalizationId: hosp2.id,
      type: NursingType.VITAL_SIGNS,
      content: "第4天生命体征监测：体温38.7℃，心率120次/分，呼吸22次/分，开始少量进食",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(2).getTime() + 8 * 3600 * 1000),
      temperature: 38.7,
      heartRate: 120,
      respiratoryRate: 22,
      bloodPressure: null,
      weight: null,
      appetite: "一般",
      stool: "成形",
      urine: "正常",
      mentalStatus: "一般",
      isAbnormal: false,
      abnormalNote: null,
      orderId: null,
    });

    nursingRecords.push({
      hospitalizationId: hosp2.id,
      type: NursingType.MEDICATION,
      content: "执行输液和药物注射",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(2).getTime() + 10 * 3600 * 1000),
      temperature: null,
      heartRate: null,
      respiratoryRate: null,
      bloodPressure: null,
      weight: null,
      appetite: null,
      stool: null,
      urine: null,
      mentalStatus: null,
      isAbnormal: false,
      abnormalNote: null,
      orderId: "order_5",
    });

    nursingRecords.push({
      hospitalizationId: hosp2.id,
      type: NursingType.VITAL_SIGNS,
      content: "第5天生命体征监测：体温38.5℃，心率110次/分，呼吸20次/分，精神好转",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(1).getTime() + 8 * 3600 * 1000),
      temperature: 38.5,
      heartRate: 110,
      respiratoryRate: 20,
      bloodPressure: null,
      weight: null,
      appetite: "良好",
      stool: "正常",
      urine: "正常",
      mentalStatus: "活泼",
      isAbnormal: false,
      abnormalNote: null,
      orderId: null,
    });

    nursingRecords.push({
      hospitalizationId: hosp2.id,
      type: NursingType.MEDICATION,
      content: "执行输液和药物注射",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(1).getTime() + 10 * 3600 * 1000),
      temperature: null,
      heartRate: null,
      respiratoryRate: null,
      bloodPressure: null,
      weight: null,
      appetite: null,
      stool: null,
      urine: null,
      mentalStatus: null,
      isAbnormal: false,
      abnormalNote: null,
      orderId: "order_5",
    });

    nursingRecords.push({
      hospitalizationId: hosp3.id,
      type: NursingType.VITAL_SIGNS,
      content: "第1天生命体征监测：体温38.5℃，心率130次/分，呼吸30次/分，精神沉郁",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(3).getTime() + 9 * 3600 * 1000),
      temperature: 38.5,
      heartRate: 130,
      respiratoryRate: 30,
      bloodPressure: null,
      weight: 2.1,
      appetite: "废绝",
      stool: "干结",
      urine: "少",
      mentalStatus: "沉郁",
      isAbnormal: false,
      abnormalNote: null,
      orderId: null,
    });

    nursingRecords.push({
      hospitalizationId: hosp3.id,
      type: NursingType.TREATMENT,
      content: "皮下补液和口服药物",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(3).getTime() + 11 * 3600 * 1000),
      temperature: null,
      heartRate: null,
      respiratoryRate: null,
      bloodPressure: null,
      weight: null,
      appetite: null,
      stool: null,
      urine: null,
      mentalStatus: null,
      isAbnormal: false,
      abnormalNote: null,
      orderId: "order_8",
    });

    nursingRecords.push({
      hospitalizationId: hosp3.id,
      type: NursingType.VITAL_SIGNS,
      content: "第2天生命体征监测：体温偏低，精神沉郁，仍未进食",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(2).getTime() + 8 * 3600 * 1000),
      temperature: 37.2,
      heartRate: 110,
      respiratoryRate: 25,
      bloodPressure: null,
      weight: null,
      appetite: "废绝",
      stool: "未排",
      urine: "正常",
      mentalStatus: "沉郁",
      isAbnormal: true,
      abnormalNote: "体温偏低，精神状态差",
      orderId: null,
    });

    nursingRecords.push({
      hospitalizationId: hosp3.id,
      type: NursingType.OTHER,
      content: "异常情况处理记录：发现患兔精神沉郁、体温偏低后，立即给予保温处理，通知兽医。兽医检查后调整了治疗方案，增加了补液量和频次。",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(2).getTime() + 9 * 3600 * 1000),
      temperature: null,
      heartRate: null,
      respiratoryRate: null,
      bloodPressure: null,
      weight: null,
      appetite: null,
      stool: null,
      urine: null,
      mentalStatus: null,
      isAbnormal: true,
      abnormalNote: "体温偏低，精神状态差",
      orderId: null,
    });

    nursingRecords.push({
      hospitalizationId: hosp3.id,
      type: NursingType.TREATMENT,
      content: "皮下补液和口服药物",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(2).getTime() + 14 * 3600 * 1000),
      temperature: null,
      heartRate: null,
      respiratoryRate: null,
      bloodPressure: null,
      weight: null,
      appetite: null,
      stool: null,
      urine: null,
      mentalStatus: null,
      isAbnormal: false,
      abnormalNote: null,
      orderId: "order_8",
    });

    nursingRecords.push({
      hospitalizationId: hosp3.id,
      type: NursingType.VITAL_SIGNS,
      content: "第3天生命体征监测：体温38.0℃，心率120次/分，精神好转",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(1).getTime() + 8 * 3600 * 1000),
      temperature: 38.0,
      heartRate: 120,
      respiratoryRate: 28,
      bloodPressure: null,
      weight: null,
      appetite: "一般",
      stool: "排软便",
      urine: "正常",
      mentalStatus: "一般",
      isAbnormal: false,
      abnormalNote: null,
      orderId: null,
    });

    nursingRecords.push({
      hospitalizationId: hosp3.id,
      type: NursingType.TREATMENT,
      content: "皮下补液和口服药物",
      recordedById: staff2.id,
      recordTime: new Date(dayOffset(1).getTime() + 10 * 3600 * 1000),
      temperature: null,
      heartRate: null,
      respiratoryRate: null,
      bloodPressure: null,
      weight: null,
      appetite: null,
      stool: null,
      urine: null,
      mentalStatus: null,
      isAbnormal: false,
      abnormalNote: null,
      orderId: "order_7",
    });

    await tx.nursingRecord.createMany({
      data: nursingRecords,
    });
    console.log("✓ 护理记录已创建");

    const feeItems = [
      { hospitalizationId: hosp1.id, name: "挂号费", category: "挂号", quantity: 1, unitPrice: 50, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp1.id, name: "住院费", category: "住院", quantity: 7, unitPrice: 200, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp1.id, name: "护理费", category: "护理", quantity: 7, unitPrice: 150, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp1.id, name: "X光检查", category: "检查", quantity: 2, unitPrice: 300, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp1.id, name: "血常规", category: "检查", quantity: 1, unitPrice: 200, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp1.id, name: "生化检查", category: "检查", quantity: 1, unitPrice: 350, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp1.id, name: "骨折内固定术", category: "手术", quantity: 1, unitPrice: 3500, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp1.id, name: "麻醉费", category: "麻醉", quantity: 1, unitPrice: 800, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp1.id, name: "头孢曲松钠", category: "药品", quantity: 5, unitPrice: 80, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp1.id, name: "美洛昔康", category: "药品", quantity: 4, unitPrice: 60, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp1.id, name: "输液费", category: "治疗", quantity: 5, unitPrice: 50, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp1.id, name: "手术耗材", category: "耗材", quantity: 1, unitPrice: 600, status: FeeStatus.SETTLED },

      { hospitalizationId: hosp2.id, name: "挂号费", category: "挂号", quantity: 1, unitPrice: 50, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp2.id, name: "住院费", category: "住院", quantity: 5, unitPrice: 200, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp2.id, name: "护理费", category: "护理", quantity: 5, unitPrice: 150, status: FeeStatus.PENDING },
      { hospitalizationId: hosp2.id, name: "猫瘟检测", category: "检查", quantity: 1, unitPrice: 280, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp2.id, name: "血常规", category: "检查", quantity: 2, unitPrice: 200, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp2.id, name: "生化检查", category: "检查", quantity: 1, unitPrice: 350, status: FeeStatus.PENDING },
      { hospitalizationId: hosp2.id, name: "乳酸林格氏液", category: "药品", quantity: 10, unitPrice: 45, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp2.id, name: "猫干扰素", category: "药品", quantity: 5, unitPrice: 180, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp2.id, name: "输液费", category: "治疗", quantity: 10, unitPrice: 50, status: FeeStatus.PENDING },

      { hospitalizationId: hosp3.id, name: "挂号费", category: "挂号", quantity: 1, unitPrice: 50, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp3.id, name: "住院费", category: "住院", quantity: 3, unitPrice: 200, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp3.id, name: "护理费", category: "护理", quantity: 3, unitPrice: 150, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp3.id, name: "便常规", category: "检查", quantity: 1, unitPrice: 80, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp3.id, name: "乳酶生片", category: "药品", quantity: 1, unitPrice: 30, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp3.id, name: "补液", category: "治疗", quantity: 6, unitPrice: 40, status: FeeStatus.CONFIRMED },

      { hospitalizationId: hosp4.id, name: "挂号费", category: "挂号", quantity: 1, unitPrice: 50, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp4.id, name: "住院费", category: "住院", quantity: 2, unitPrice: 200, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp4.id, name: "护理费", category: "护理", quantity: 2, unitPrice: 150, status: FeeStatus.DISPUTED },
      { hospitalizationId: hosp4.id, name: "皮肤刮片检查", category: "检查", quantity: 1, unitPrice: 120, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp4.id, name: "真菌培养", category: "检查", quantity: 1, unitPrice: 200, status: FeeStatus.CONFIRMED },
      { hospitalizationId: hosp4.id, name: "泼尼松龙片", category: "药品", quantity: 1, unitPrice: 60, status: FeeStatus.DISPUTED },
      { hospitalizationId: hosp4.id, name: "药浴治疗", category: "治疗", quantity: 2, unitPrice: 180, status: FeeStatus.CONFIRMED },

      { hospitalizationId: hosp5.id, name: "急诊挂号费", category: "挂号", quantity: 1, unitPrice: 100, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp5.id, name: "住院费", category: "住院", quantity: 6, unitPrice: 200, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp5.id, name: "护理费", category: "护理", quantity: 6, unitPrice: 150, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp5.id, name: "血常规", category: "检查", quantity: 2, unitPrice: 200, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp5.id, name: "生化检查", category: "检查", quantity: 2, unitPrice: 350, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp5.id, name: "淀粉酶测定", category: "检查", quantity: 2, unitPrice: 150, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp5.id, name: "胰腺炎检测板", category: "检查", quantity: 1, unitPrice: 300, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp5.id, name: "复方氯化钠", category: "药品", quantity: 12, unitPrice: 40, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp5.id, name: "乌司他丁", category: "药品", quantity: 12, unitPrice: 200, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp5.id, name: "输液费", category: "治疗", quantity: 12, unitPrice: 50, status: FeeStatus.SETTLED },
      { hospitalizationId: hosp5.id, name: "重症监护费", category: "护理", quantity: 3, unitPrice: 300, status: FeeStatus.SETTLED },
    ];

    await tx.feeItem.createMany({
      data: feeItems.map((item) => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
        recordDate: new Date(),
        disputeNote: item.status === FeeStatus.DISPUTED ? "主人对费用有异议" : null,
      })),
    });
    console.log("✓ 费用数据已创建");

    const total1 = feeItems
      .filter((f) => f.hospitalizationId === hosp1.id)
      .reduce((sum, f) => sum + f.quantity * f.unitPrice, 0);

    await tx.feeReview.create({
      data: {
        hospitalizationId: hosp1.id,
        reviewedById: staff6.id,
        totalAmount: total1,
        actualAmount: total1,
        reviewNote: "费用核对无误，办理出院",
        isFinal: true,
        reviewedAt: dayOffset(3),
      },
    });

    const total5 = feeItems
      .filter((f) => f.hospitalizationId === hosp5.id)
      .reduce((sum, f) => sum + f.quantity * f.unitPrice, 0);

    await tx.feeReview.create({
      data: {
        hospitalizationId: hosp5.id,
        reviewedById: staff6.id,
        totalAmount: total5,
        actualAmount: total5,
        reviewNote: "治疗效果良好，康复出院",
        isFinal: true,
        reviewedAt: dayOffset(1),
      },
    });
    console.log("✓ 费用复核记录已创建");
  });

  console.log("种子数据播种完成！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

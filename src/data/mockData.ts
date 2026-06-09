import {
  PetType,
  StaffRole,
  HospitalizationStatus,
  OrderStatus,
  NursingType,
  FeeStatus,
  AnomalyType,
} from "../types/enums";

export interface Owner {
  id: string;
  name: string;
  phone: string;
  idCard?: string | null;
  address?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string | null;
  age?: number | null;
  weight?: number | null;
  gender?: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  departmentId?: string | null;
  createdAt: Date;
}

export interface Hospitalization {
  id: string;
  petId: string;
  departmentId: string;
  primaryDiagnosis: string;
  secondaryDiagnosis?: string | null;
  admissionDate: Date;
  dischargeDate?: Date | null;
  status: string;
  ward?: string | null;
  cageNumber?: string | null;
  chiefComplaint?: string | null;
  anomalyType: string;
  anomalyNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalOrder {
  id: string;
  hospitalizationId: string;
  orderType: string;
  content: string;
  dosage?: string | null;
  frequency?: string | null;
  startDate: Date;
  endDate?: Date | null;
  status: string;
  createdById: string;
  confirmedById?: string | null;
  confirmedAt?: Date | null;
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NursingRecord {
  id: string;
  hospitalizationId: string;
  type: string;
  content: string;
  recordedById: string;
  recordTime: Date;
  temperature?: number | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  bloodPressure?: string | null;
  weight?: number | null;
  appetite?: string | null;
  stool?: string | null;
  urine?: string | null;
  mentalStatus?: string | null;
  isAbnormal: boolean;
  abnormalNote?: string | null;
  orderId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeItem {
  id: string;
  hospitalizationId: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  disputeNote?: string | null;
  recordDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeReview {
  id: string;
  hospitalizationId: string;
  reviewedById: string;
  totalAmount: number;
  actualAmount?: number | null;
  reviewNote?: string | null;
  isFinal: boolean;
  reviewedAt: Date;
  createdAt: Date;
}

const now = new Date();
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const hoursAgo = (hours: number) =>
  new Date(now.getTime() - hours * 60 * 60 * 1000);

let idCounter = 1;
const genId = () => `mock_id_${idCounter++}`;

export const departments: Department[] = [
  { id: "dept_1", name: "内科", createdAt: daysAgo(30) },
  { id: "dept_2", name: "外科", createdAt: daysAgo(30) },
  { id: "dept_3", name: "皮肤科", createdAt: daysAgo(30) },
  { id: "dept_4", name: "急诊科", createdAt: daysAgo(30) },
];

export const staffList: Staff[] = [
  {
    id: "staff_1",
    name: "王前台",
    role: StaffRole.RECEPTIONIST,
    departmentId: "dept_4",
    createdAt: daysAgo(30),
  },
  {
    id: "staff_2",
    name: "李护士",
    role: StaffRole.NURSE,
    departmentId: "dept_1",
    createdAt: daysAgo(30),
  },
  {
    id: "staff_3",
    name: "张护士",
    role: StaffRole.NURSE,
    departmentId: "dept_2",
    createdAt: daysAgo(30),
  },
  {
    id: "staff_4",
    name: "陈兽医",
    role: StaffRole.VETERINARIAN,
    departmentId: "dept_1",
    createdAt: daysAgo(30),
  },
  {
    id: "staff_5",
    name: "刘兽医",
    role: StaffRole.VETERINARIAN,
    departmentId: "dept_2",
    createdAt: daysAgo(30),
  },
  {
    id: "staff_6",
    name: "赵财务",
    role: StaffRole.FINANCE,
    departmentId: "dept_4",
    createdAt: daysAgo(30),
  },
];

export const owners: Owner[] = [
  {
    id: "owner_1",
    name: "王先生",
    phone: "13800000001",
    idCard: "110101199001011234",
    address: "北京市朝阳区XX路1号",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },
  {
    id: "owner_2",
    name: "李女士",
    phone: "13800000002",
    idCard: "110101199202022345",
    address: "北京市海淀区XX路2号",
    createdAt: daysAgo(50),
    updatedAt: daysAgo(50),
  },
  {
    id: "owner_3",
    name: "张先生",
    phone: "13800000003",
    idCard: "110101198803033456",
    address: "北京市西城区XX路3号",
    createdAt: daysAgo(40),
    updatedAt: daysAgo(40),
  },
  {
    id: "owner_4",
    name: "赵女士",
    phone: "13800000004",
    idCard: "110101199504044567",
    address: "北京市东城区XX路4号",
    createdAt: daysAgo(35),
    updatedAt: daysAgo(35),
  },
  {
    id: "owner_5",
    name: "孙先生",
    phone: "13800000005",
    idCard: "110101198705055678",
    address: "北京市丰台区XX路5号",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(45),
  },
];

export const pets: Pet[] = [
  {
    id: "pet_1",
    name: "小黄",
    type: PetType.DOG,
    breed: "金毛犬",
    age: 2,
    weight: 25.5,
    gender: "公",
    ownerId: "owner_1",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },
  {
    id: "pet_2",
    name: "小白",
    type: PetType.CAT,
    breed: "英国短毛猫",
    age: 1.5,
    weight: 3.2,
    gender: "母",
    ownerId: "owner_2",
    createdAt: daysAgo(50),
    updatedAt: daysAgo(50),
  },
  {
    id: "pet_3",
    name: "小灰",
    type: PetType.RABBIT,
    breed: "荷兰垂耳兔",
    age: 1,
    weight: 1.8,
    gender: "公",
    ownerId: "owner_3",
    createdAt: daysAgo(40),
    updatedAt: daysAgo(40),
  },
  {
    id: "pet_4",
    name: "小花",
    type: PetType.BIRD,
    breed: "虎皮鹦鹉",
    age: 0.5,
    weight: 0.03,
    gender: "母",
    ownerId: "owner_4",
    createdAt: daysAgo(35),
    updatedAt: daysAgo(35),
  },
  {
    id: "pet_5",
    name: "大黑",
    type: PetType.DOG,
    breed: "拉布拉多",
    age: 3,
    weight: 30,
    gender: "公",
    ownerId: "owner_5",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(45),
  },
];

export const hospitalizations: Hospitalization[] = [
  {
    id: "hosp_1",
    petId: "pet_1",
    departmentId: "dept_1",
    primaryDiagnosis: "犬细小病毒感染",
    secondaryDiagnosis: "轻度脱水",
    admissionDate: daysAgo(7),
    dischargeDate: daysAgo(0),
    status: HospitalizationStatus.DISCHARGED,
    ward: "内科A区",
    cageNumber: "A-101",
    chiefComplaint: "呕吐、腹泻2天，精神萎靡",
    anomalyType: AnomalyType.NONE,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(0),
  },
  {
    id: "hosp_2",
    petId: "pet_2",
    departmentId: "dept_1",
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
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(2),
  },
  {
    id: "hosp_3",
    petId: "pet_3",
    departmentId: "dept_1",
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
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(5),
  },
  {
    id: "hosp_4",
    petId: "pet_4",
    departmentId: "dept_3",
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
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
  },
  {
    id: "hosp_5",
    petId: "pet_5",
    departmentId: "dept_2",
    primaryDiagnosis: "右前肢桡骨骨折",
    secondaryDiagnosis: "软组织挫伤",
    admissionDate: daysAgo(10),
    dischargeDate: daysAgo(3),
    status: HospitalizationStatus.DISCHARGED,
    ward: "外科A区",
    cageNumber: "S-102",
    chiefComplaint: "从高处跌落，右前肢不能着地",
    anomalyType: AnomalyType.NONE,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
  },
];

export const medicalOrders: MedicalOrder[] = [
  // 案例1
  {
    id: "order_1",
    hospitalizationId: "hosp_1",
    orderType: "输液治疗",
    content: "复方氯化钠注射液 500ml 静脉滴注",
    dosage: "500ml",
    frequency: "每日1次",
    startDate: daysAgo(7),
    endDate: daysAgo(2),
    status: OrderStatus.CONFIRMED,
    createdById: "staff_4",
    confirmedById: "staff_4",
    confirmedAt: daysAgo(7),
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  {
    id: "order_2",
    hospitalizationId: "hosp_1",
    orderType: "药物治疗",
    content: "干扰素 300万单位 皮下注射",
    dosage: "300万IU",
    frequency: "每日1次",
    startDate: daysAgo(7),
    endDate: daysAgo(2),
    status: OrderStatus.CONFIRMED,
    createdById: "staff_4",
    confirmedById: "staff_4",
    confirmedAt: daysAgo(7),
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  {
    id: "order_3",
    hospitalizationId: "hosp_1",
    orderType: "药物治疗",
    content: "头孢曲松钠 0.5g 静脉推注",
    dosage: "0.5g",
    frequency: "每日2次",
    startDate: daysAgo(7),
    endDate: daysAgo(2),
    status: OrderStatus.CONFIRMED,
    createdById: "staff_4",
    confirmedById: "staff_4",
    confirmedAt: daysAgo(7),
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  // 案例2
  {
    id: "order_4",
    hospitalizationId: "hosp_2",
    orderType: "输液治疗",
    content: "乳酸林格氏液 250ml 静脉滴注",
    dosage: "250ml",
    frequency: "每日2次",
    startDate: daysAgo(5),
    status: OrderStatus.CONFIRMED,
    createdById: "staff_4",
    confirmedById: "staff_4",
    confirmedAt: daysAgo(5),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "order_5",
    hospitalizationId: "hosp_2",
    orderType: "药物治疗",
    content: "猫干扰素 200万单位 皮下注射",
    dosage: "200万IU",
    frequency: "每日1次",
    startDate: daysAgo(5),
    status: OrderStatus.CONFIRMED,
    createdById: "staff_4",
    confirmedById: "staff_4",
    confirmedAt: daysAgo(5),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "order_6",
    hospitalizationId: "hosp_2",
    orderType: "药物治疗",
    content: "胃复安 0.5ml 皮下注射",
    dosage: "0.5ml",
    frequency: "每日2次",
    startDate: daysAgo(5),
    status: OrderStatus.PENDING,
    createdById: "staff_4",
    note: "待确认补执行",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  // 案例3
  {
    id: "order_7",
    hospitalizationId: "hosp_3",
    orderType: "液体治疗",
    content: "皮下补液 50ml",
    dosage: "50ml",
    frequency: "每日2次",
    startDate: daysAgo(3),
    status: OrderStatus.CONFIRMED,
    createdById: "staff_4",
    confirmedById: "staff_4",
    confirmedAt: daysAgo(3),
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: "order_8",
    hospitalizationId: "hosp_3",
    orderType: "药物治疗",
    content: "西沙必利 0.5mg 口服",
    dosage: "0.5mg",
    frequency: "每日2次",
    startDate: daysAgo(3),
    status: OrderStatus.CONFIRMED,
    createdById: "staff_4",
    confirmedById: "staff_4",
    confirmedAt: daysAgo(3),
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  // 案例4
  {
    id: "order_9",
    hospitalizationId: "hosp_4",
    orderType: "药物治疗",
    content: "多西环素 5mg 口服",
    dosage: "5mg",
    frequency: "每日2次",
    startDate: daysAgo(4),
    endDate: daysAgo(1),
    status: OrderStatus.CONFIRMED,
    createdById: "staff_5",
    confirmedById: "staff_5",
    confirmedAt: daysAgo(4),
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
  {
    id: "order_10",
    hospitalizationId: "hosp_4",
    orderType: "雾化治疗",
    content: "生理盐水雾化吸入",
    dosage: "2ml",
    frequency: "每日2次",
    startDate: daysAgo(4),
    endDate: daysAgo(1),
    status: OrderStatus.CONFIRMED,
    createdById: "staff_5",
    confirmedById: "staff_5",
    confirmedAt: daysAgo(4),
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
  // 案例5
  {
    id: "order_11",
    hospitalizationId: "hosp_5",
    orderType: "手术治疗",
    content: "骨折内固定术",
    dosage: "1次",
    frequency: "单次",
    startDate: daysAgo(9),
    status: OrderStatus.CONFIRMED,
    createdById: "staff_5",
    confirmedById: "staff_5",
    confirmedAt: daysAgo(9),
    createdAt: daysAgo(9),
    updatedAt: daysAgo(9),
  },
  {
    id: "order_12",
    hospitalizationId: "hosp_5",
    orderType: "药物治疗",
    content: "美洛昔康 7.5mg 口服",
    dosage: "7.5mg",
    frequency: "每日1次",
    startDate: daysAgo(9),
    endDate: daysAgo(3),
    status: OrderStatus.CONFIRMED,
    createdById: "staff_5",
    confirmedById: "staff_5",
    confirmedAt: daysAgo(9),
    createdAt: daysAgo(9),
    updatedAt: daysAgo(9),
  },
];

const generateNursingRecords = () => {
  const records: NursingRecord[] = [];
  let nid = 1;

  // 案例1 - 7天
  for (let day = 6; day >= 0; day--) {
    records.push({
      id: `nurse_${nid++}`,
      hospitalizationId: "hosp_1",
      type: NursingType.VITAL_SIGNS,
      content: `第${7 - day}天生命体征监测`,
      recordedById: "staff_2",
      recordTime: hoursAgo(day * 24 + 8),
      temperature: 38.5 + Math.random() * 0.5,
      heartRate: 90 + Math.floor(Math.random() * 20),
      respiratoryRate: 20 + Math.floor(Math.random() * 5),
      appetite: day < 4 ? "差" : "良好",
      stool: day < 3 ? "稀软" : "正常",
      mentalStatus: day < 3 ? "萎靡" : day < 5 ? "一般" : "活泼",
      isAbnormal: false,
      createdAt: hoursAgo(day * 24 + 8),
      updatedAt: hoursAgo(day * 24 + 8),
    });
    records.push({
      id: `nurse_${nid++}`,
      hospitalizationId: "hosp_1",
      type: NursingType.MEDICATION,
      content: "执行输液治疗和药物注射",
      recordedById: "staff_2",
      recordTime: hoursAgo(day * 24 + 10),
      orderId: "order_1",
      isAbnormal: false,
      createdAt: hoursAgo(day * 24 + 10),
      updatedAt: hoursAgo(day * 24 + 10),
    });
  }

  // 案例2 - 5天，第3天上午漏记
  for (let day = 4; day >= 0; day--) {
    records.push({
      id: `nurse_${nid++}`,
      hospitalizationId: "hosp_2",
      type: NursingType.VITAL_SIGNS,
      content: `第${5 - day}天生命体征监测`,
      recordedById: "staff_2",
      recordTime: hoursAgo(day * 24 + 8),
      temperature: 39.2 - day * 0.15,
      heartRate: 140 - day * 5,
      respiratoryRate: 28 - day * 2,
      appetite: day > 2 ? "极差" : "一般",
      stool: day > 1 ? "水样便" : "偏软",
      mentalStatus: day > 2 ? "沉郁" : "稍好转",
      isAbnormal: day === 4,
      abnormalNote: day === 4 ? "体温过高，心率偏快" : null,
      createdAt: hoursAgo(day * 24 + 8),
      updatedAt: hoursAgo(day * 24 + 8),
    });

    if (day !== 2) {
      records.push({
        id: `nurse_${nid++}`,
        hospitalizationId: "hosp_2",
        type: NursingType.MEDICATION,
        content: "执行输液和药物注射",
        recordedById: "staff_2",
        recordTime: hoursAgo(day * 24 + 10),
        orderId: "order_4",
        isAbnormal: false,
        createdAt: hoursAgo(day * 24 + 10),
        updatedAt: hoursAgo(day * 24 + 10),
      });
    }
  }

  // 案例3 - 3天，第2天有异常
  for (let day = 2; day >= 0; day--) {
    records.push({
      id: `nurse_${nid++}`,
      hospitalizationId: "hosp_3",
      type: NursingType.VITAL_SIGNS,
      content: `第${3 - day}天生命体征监测`,
      recordedById: "staff_3",
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
      createdAt: hoursAgo(day * 24 + 8),
      updatedAt: hoursAgo(day * 24 + 8),
    });
    records.push({
      id: `nurse_${nid++}`,
      hospitalizationId: "hosp_3",
      type: NursingType.MEDICATION,
      content: "皮下补液和口服药物",
      recordedById: "staff_3",
      recordTime: hoursAgo(day * 24 + 10),
      orderId: "order_7",
      isAbnormal: false,
      createdAt: hoursAgo(day * 24 + 10),
      updatedAt: hoursAgo(day * 24 + 10),
    });
  }

  records.push({
    id: `nurse_${nid++}`,
    hospitalizationId: "hosp_3",
    type: NursingType.OTHER,
    content:
      "异常情况处理记录：发现患兔精神沉郁、体温偏低后，立即给予保温处理，通知兽医。兽医检查后调整了治疗方案，增加了补液量和频次。",
    recordedById: "staff_3",
    recordTime: hoursAgo(2 * 24 + 12),
    isAbnormal: true,
    abnormalNote: "护理异常-体温下降，已处理并记录",
    createdAt: hoursAgo(2 * 24 + 12),
    updatedAt: hoursAgo(2 * 24 + 12),
  });

  // 案例4 - 4天
  for (let day = 3; day >= 0; day--) {
    records.push({
      id: `nurse_${nid++}`,
      hospitalizationId: "hosp_4",
      type: NursingType.VITAL_SIGNS,
      content: `第${4 - day}天观察记录`,
      recordedById: "staff_3",
      recordTime: hoursAgo(day * 24 + 9),
      appetite: day > 1 ? "一般" : "良好",
      mentalStatus: day > 1 ? "精神一般" : "精神良好",
      isAbnormal: false,
      createdAt: hoursAgo(day * 24 + 9),
      updatedAt: hoursAgo(day * 24 + 9),
    });
    records.push({
      id: `nurse_${nid++}`,
      hospitalizationId: "hosp_4",
      type: NursingType.TREATMENT,
      content: "雾化治疗和给药",
      recordedById: "staff_3",
      recordTime: hoursAgo(day * 24 + 11),
      orderId: "order_10",
      isAbnormal: false,
      createdAt: hoursAgo(day * 24 + 11),
      updatedAt: hoursAgo(day * 24 + 11),
    });
  }

  // 案例5 - 7天
  for (let day = 9; day >= 3; day--) {
    records.push({
      id: `nurse_${nid++}`,
      hospitalizationId: "hosp_5",
      type: NursingType.VITAL_SIGNS,
      content: `术后第${9 - day}天观察`,
      recordedById: "staff_3",
      recordTime: hoursAgo(day * 24 + 9),
      temperature: 38.2 + Math.random() * 0.3,
      heartRate: 85 + Math.floor(Math.random() * 15),
      respiratoryRate: 18 + Math.floor(Math.random() * 4),
      appetite: "良好",
      mentalStatus: day > 7 ? "一般" : "活泼",
      isAbnormal: false,
      createdAt: hoursAgo(day * 24 + 9),
      updatedAt: hoursAgo(day * 24 + 9),
    });
  }

  return records;
};

export const nursingRecords: NursingRecord[] = generateNursingRecords();

export const feeItems: FeeItem[] = [
  // 案例1
  { id: "fee_1", hospitalizationId: "hosp_1", name: "挂号费", category: "挂号", quantity: 1, unitPrice: 50, totalPrice: 50, status: FeeStatus.SETTLED, recordDate: daysAgo(7), createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  { id: "fee_2", hospitalizationId: "hosp_1", name: "住院费", category: "住院", quantity: 7, unitPrice: 200, totalPrice: 1400, status: FeeStatus.SETTLED, recordDate: daysAgo(7), createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  { id: "fee_3", hospitalizationId: "hosp_1", name: "护理费", category: "护理", quantity: 7, unitPrice: 150, totalPrice: 1050, status: FeeStatus.SETTLED, recordDate: daysAgo(7), createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  { id: "fee_4", hospitalizationId: "hosp_1", name: "输液治疗费", category: "治疗", quantity: 5, unitPrice: 180, totalPrice: 900, status: FeeStatus.SETTLED, recordDate: daysAgo(7), createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  { id: "fee_5", hospitalizationId: "hosp_1", name: "干扰素", category: "药品", quantity: 5, unitPrice: 120, totalPrice: 600, status: FeeStatus.SETTLED, recordDate: daysAgo(7), createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  { id: "fee_6", hospitalizationId: "hosp_1", name: "头孢曲松钠", category: "药品", quantity: 10, unitPrice: 45, totalPrice: 450, status: FeeStatus.SETTLED, recordDate: daysAgo(7), createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  { id: "fee_7", hospitalizationId: "hosp_1", name: "化验检查费", category: "检查", quantity: 2, unitPrice: 300, totalPrice: 600, status: FeeStatus.SETTLED, recordDate: daysAgo(7), createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  
  // 案例2
  { id: "fee_8", hospitalizationId: "hosp_2", name: "挂号费", category: "挂号", quantity: 1, unitPrice: 50, totalPrice: 50, status: FeeStatus.CONFIRMED, recordDate: daysAgo(5), createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: "fee_9", hospitalizationId: "hosp_2", name: "住院费", category: "住院", quantity: 5, unitPrice: 200, totalPrice: 1000, status: FeeStatus.PENDING, recordDate: daysAgo(5), createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: "fee_10", hospitalizationId: "hosp_2", name: "护理费", category: "护理", quantity: 5, unitPrice: 180, totalPrice: 900, status: FeeStatus.PENDING, recordDate: daysAgo(5), createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: "fee_11", hospitalizationId: "hosp_2", name: "输液治疗费", category: "治疗", quantity: 10, unitPrice: 120, totalPrice: 1200, status: FeeStatus.PENDING, recordDate: daysAgo(5), createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: "fee_12", hospitalizationId: "hosp_2", name: "猫干扰素", category: "药品", quantity: 5, unitPrice: 150, totalPrice: 750, status: FeeStatus.PENDING, recordDate: daysAgo(5), createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: "fee_13", hospitalizationId: "hosp_2", name: "化验检查费", category: "检查", quantity: 3, unitPrice: 350, totalPrice: 1050, status: FeeStatus.CONFIRMED, recordDate: daysAgo(5), createdAt: daysAgo(5), updatedAt: daysAgo(5) },

  // 案例3
  { id: "fee_14", hospitalizationId: "hosp_3", name: "挂号费", category: "挂号", quantity: 1, unitPrice: 50, totalPrice: 50, status: FeeStatus.CONFIRMED, recordDate: daysAgo(3), createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: "fee_15", hospitalizationId: "hosp_3", name: "住院费", category: "住院", quantity: 3, unitPrice: 150, totalPrice: 450, status: FeeStatus.PENDING, recordDate: daysAgo(3), createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: "fee_16", hospitalizationId: "hosp_3", name: "护理费", category: "护理", quantity: 3, unitPrice: 120, totalPrice: 360, status: FeeStatus.PENDING, recordDate: daysAgo(3), createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: "fee_17", hospitalizationId: "hosp_3", name: "皮下补液", category: "治疗", quantity: 6, unitPrice: 60, totalPrice: 360, status: FeeStatus.PENDING, recordDate: daysAgo(3), createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: "fee_18", hospitalizationId: "hosp_3", name: "西沙必利", category: "药品", quantity: 6, unitPrice: 25, totalPrice: 150, status: FeeStatus.PENDING, recordDate: daysAgo(3), createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: "fee_19", hospitalizationId: "hosp_3", name: "化验检查费", category: "检查", quantity: 2, unitPrice: 200, totalPrice: 400, status: FeeStatus.CONFIRMED, recordDate: daysAgo(3), createdAt: daysAgo(3), updatedAt: daysAgo(3) },

  // 案例4
  { id: "fee_20", hospitalizationId: "hosp_4", name: "挂号费", category: "挂号", quantity: 1, unitPrice: 50, totalPrice: 50, status: FeeStatus.CONFIRMED, recordDate: daysAgo(4), createdAt: daysAgo(4), updatedAt: daysAgo(4) },
  { id: "fee_21", hospitalizationId: "hosp_4", name: "住院费", category: "住院", quantity: 4, unitPrice: 300, totalPrice: 1200, status: FeeStatus.DISPUTED, disputeNote: "主人认为鸟类住院费不应与犬猫同价，费用过高", recordDate: daysAgo(4), createdAt: daysAgo(4), updatedAt: daysAgo(1) },
  { id: "fee_22", hospitalizationId: "hosp_4", name: "护理费", category: "护理", quantity: 4, unitPrice: 200, totalPrice: 800, status: FeeStatus.DISPUTED, disputeNote: "主人质疑护理内容和频次，认为收费过高", recordDate: daysAgo(4), createdAt: daysAgo(4), updatedAt: daysAgo(1) },
  { id: "fee_23", hospitalizationId: "hosp_4", name: "雾化治疗费", category: "治疗", quantity: 8, unitPrice: 80, totalPrice: 640, status: FeeStatus.CONFIRMED, recordDate: daysAgo(4), createdAt: daysAgo(4), updatedAt: daysAgo(4) },
  { id: "fee_24", hospitalizationId: "hosp_4", name: "多西环素", category: "药品", quantity: 8, unitPrice: 15, totalPrice: 120, status: FeeStatus.CONFIRMED, recordDate: daysAgo(4), createdAt: daysAgo(4), updatedAt: daysAgo(4) },
  { id: "fee_25", hospitalizationId: "hosp_4", name: "化验检查费", category: "检查", quantity: 1, unitPrice: 250, totalPrice: 250, status: FeeStatus.CONFIRMED, recordDate: daysAgo(4), createdAt: daysAgo(4), updatedAt: daysAgo(4) },

  // 案例5
  { id: "fee_26", hospitalizationId: "hosp_5", name: "挂号费", category: "挂号", quantity: 1, unitPrice: 50, totalPrice: 50, status: FeeStatus.SETTLED, recordDate: daysAgo(10), createdAt: daysAgo(10), updatedAt: daysAgo(10) },
  { id: "fee_27", hospitalizationId: "hosp_5", name: "住院费", category: "住院", quantity: 7, unitPrice: 250, totalPrice: 1750, status: FeeStatus.SETTLED, recordDate: daysAgo(10), createdAt: daysAgo(10), updatedAt: daysAgo(10) },
  { id: "fee_28", hospitalizationId: "hosp_5", name: "护理费", category: "护理", quantity: 7, unitPrice: 200, totalPrice: 1400, status: FeeStatus.SETTLED, recordDate: daysAgo(10), createdAt: daysAgo(10), updatedAt: daysAgo(10) },
  { id: "fee_29", hospitalizationId: "hosp_5", name: "骨折内固定术", category: "手术", quantity: 1, unitPrice: 5000, totalPrice: 5000, status: FeeStatus.SETTLED, recordDate: daysAgo(10), createdAt: daysAgo(10), updatedAt: daysAgo(10) },
  { id: "fee_30", hospitalizationId: "hosp_5", name: "麻醉费", category: "麻醉", quantity: 1, unitPrice: 800, totalPrice: 800, status: FeeStatus.SETTLED, recordDate: daysAgo(10), createdAt: daysAgo(10), updatedAt: daysAgo(10) },
  { id: "fee_31", hospitalizationId: "hosp_5", name: "X光检查", category: "检查", quantity: 3, unitPrice: 300, totalPrice: 900, status: FeeStatus.SETTLED, recordDate: daysAgo(10), createdAt: daysAgo(10), updatedAt: daysAgo(10) },
  { id: "fee_32", hospitalizationId: "hosp_5", name: "美洛昔康", category: "药品", quantity: 7, unitPrice: 30, totalPrice: 210, status: FeeStatus.SETTLED, recordDate: daysAgo(10), createdAt: daysAgo(10), updatedAt: daysAgo(10) },
];

export const feeReviews: FeeReview[] = [
  {
    id: "review_1",
    hospitalizationId: "hosp_1",
    reviewedById: "staff_6",
    totalAmount: 5050,
    actualAmount: 5050,
    reviewNote: "费用核对无误，正常结算",
    isFinal: true,
    reviewedAt: daysAgo(0),
    createdAt: daysAgo(0),
  },
  {
    id: "review_2",
    hospitalizationId: "hosp_4",
    reviewedById: "staff_6",
    totalAmount: 3060,
    actualAmount: null,
    reviewNote: "费用待确认，主人对住院费和护理费有异议，需进一步沟通协商",
    isFinal: false,
    reviewedAt: daysAgo(1),
    createdAt: daysAgo(1),
  },
  {
    id: "review_3",
    hospitalizationId: "hosp_5",
    reviewedById: "staff_6",
    totalAmount: 10110,
    actualAmount: 10110,
    reviewNote: "费用核对无误，已结算",
    isFinal: true,
    reviewedAt: daysAgo(3),
    createdAt: daysAgo(3),
  },
];

import { Project } from './types';
import { calculateAllLoads, getPeakLoads } from './calculations';

const now = new Date();
const iso = (daysAgo: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const sampleSignatureData1 =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMCAzMCAgUTUwIDEwIDEwMCAyNSBUMjAwIDE4IiBzdHJva2U9IiMwMDAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=';
const sampleSignatureData2 =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik01IDI4IFE0NSAxNSA5NSAzMCBUMjAwIDIyIiBzdHJva2U9IiMwMDAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=';

function buildProject1(): Project {
  const p: Project = {
    id: 'proj-001',
    code: 'WY-2026-001',
    name: '《飞天敦煌》第三幕 - 飞天群舞吊威亚',
    venue: '国家大剧院歌剧院',
    performance: '飞天敦煌',
    description:
      '第三幕飞天群舞场景，共6名演员同时吊威亚，从舞台后上方飘然而下，呈现敦煌飞天壁画意象。包含水平横飞、垂直下降、旋转等复合运动。',
    status: 'approved',
    liftPoints: [
      {
        id: 'lp-1-1',
        name: 'LP-A1 主吊点（左）',
        type: 'fixed',
        x: -8,
        y: 0,
        z: 18,
        maxLoad: 800,
        equipment: 'DEMAG DK-WINCH 500kg电动绞车',
        anchorMethod: '桁架主横梁M24U型螺栓双固定',
        materialSpec: '7×19镀锌钢丝绳 Φ10mm 破断力58kN',
      },
      {
        id: 'lp-1-2',
        name: 'LP-A2 主吊点（中）',
        type: 'fixed',
        x: 0,
        y: 0,
        z: 20,
        maxLoad: 1000,
        equipment: 'DEMAG DK-WINCH 1000kg电动绞车',
        anchorMethod: '屋顶承重环链双扣锁',
        materialSpec: '7×19镀锌钢丝绳 Φ12mm 破断力82kN',
      },
      {
        id: 'lp-1-3',
        name: 'LP-A3 主吊点（右）',
        type: 'fixed',
        x: 8,
        y: 0,
        z: 18,
        maxLoad: 800,
        equipment: 'DEMAG DK-WINCH 500kg电动绞车',
        anchorMethod: '桁架主横梁M24U型螺栓双固定',
        materialSpec: '7×19镀锌钢丝绳 Φ10mm 破断力58kN',
      },
      {
        id: 'lp-1-4',
        name: 'LP-B1 轨迹导向吊点',
        type: 'mobile',
        x: -6,
        y: 3,
        z: 15,
        maxLoad: 500,
        equipment: '轨道式滑车 + 手动微调',
        anchorMethod: '轻型铝制桁架移动滑车',
        materialSpec: '7×19不锈钢钢丝绳 Φ8mm 破断力38kN',
      },
      {
        id: 'lp-1-5',
        name: 'LP-B2 旋转吊点',
        type: 'rotation',
        x: 6,
        y: 3,
        z: 15,
        maxLoad: 500,
        equipment: '旋转卸扣 + 伺服旋转机构',
        anchorMethod: '360°万向旋转吊环',
        materialSpec: '7×19不锈钢钢丝绳 Φ8mm 破断力38kN',
      },
      {
        id: 'lp-1-6',
        name: 'LP-C1 应急备份吊点',
        type: 'fixed',
        x: 0,
        y: -2,
        z: 22,
        maxLoad: 1500,
        equipment: '双冗余液压紧急制动系统',
        anchorMethod: '建筑结构预埋吊环×2',
        materialSpec: '7×37镀锌钢丝绳 Φ16mm 破断力156kN',
      },
    ],
    performers: [
      {
        id: 'pf-1-1',
        name: '张晓燕',
        role: '飞天主角',
        weight: 52,
        costumeWeight: 8,
        propWeight: 5,
        totalWeight: 65,
        safetyHarness: 'Petzl Avao Sit Full Body Harness',
        remarks: '需佩戴长绸（约2kg），已计入道具重量',
      },
      {
        id: 'pf-1-2',
        name: '李梦瑶',
        role: '飞天女A',
        weight: 48,
        costumeWeight: 7,
        propWeight: 3,
        totalWeight: 58,
        safetyHarness: 'Petzl Avao Sit Full Body Harness',
      },
      {
        id: 'pf-1-3',
        name: '王诗涵',
        role: '飞天女B',
        weight: 50,
        costumeWeight: 7,
        propWeight: 4,
        totalWeight: 61,
        safetyHarness: 'Petzl Avao Sit Full Body Harness',
      },
      {
        id: 'pf-1-4',
        name: '陈思琪',
        role: '飞天女C',
        weight: 49,
        costumeWeight: 6,
        propWeight: 3,
        totalWeight: 58,
        safetyHarness: 'Petzl Avao Sit Full Body Harness',
      },
      {
        id: 'pf-1-5',
        name: '刘雅婷',
        role: '飞天女D',
        weight: 51,
        costumeWeight: 8,
        propWeight: 4,
        totalWeight: 63,
        safetyHarness: 'Petzl Avao Sit Full Body Harness',
      },
      {
        id: 'pf-1-6',
        name: '赵雨萱',
        role: '飞天女E',
        weight: 47,
        costumeWeight: 7,
        propWeight: 3,
        totalWeight: 57,
        safetyHarness: 'Petzl Avao Sit Full Body Harness',
      },
    ],
    motionPaths: [
      {
        id: 'mp-1-1',
        name: '主出场轨迹 - 从天而降',
        type: 'arc',
        duration: 18,
        maxSpeed: 2.5,
        maxAcceleration: 1.8,
        waypoints: [
          { id: 'w-1', sequence: 1, x: 0, y: -5, z: 17, timestamp: 0, velocity: 0, acceleration: 0 },
          { id: 'w-2', sequence: 2, x: -2, y: -3, z: 14, timestamp: 3, velocity: 1.2, acceleration: 0.8 },
          { id: 'w-3', sequence: 3, x: -4, y: 0, z: 10, timestamp: 7, velocity: 2.5, acceleration: 1.8 },
          { id: 'w-4', sequence: 4, x: -2, y: 2, z: 7, timestamp: 11, velocity: 2.0, acceleration: -0.6 },
          { id: 'w-5', sequence: 5, x: 0, y: 4, z: 5, timestamp: 14, velocity: 1.0, acceleration: -0.5 },
          { id: 'w-6', sequence: 6, x: 2, y: 5, z: 3, timestamp: 18, velocity: 0, acceleration: -0.3 },
        ],
      },
      {
        id: 'mp-1-2',
        name: '侧方入场 - 横飞轨迹',
        type: 'linear',
        duration: 12,
        maxSpeed: 3.0,
        maxAcceleration: 2.0,
        waypoints: [
          { id: 'w-1', sequence: 1, x: -10, y: 2, z: 12, timestamp: 0, velocity: 0, acceleration: 0 },
          { id: 'w-2', sequence: 2, x: -6, y: 2, z: 12, timestamp: 3, velocity: 3.0, acceleration: 2.0 },
          { id: 'w-3', sequence: 3, x: 0, y: 2, z: 10, timestamp: 7, velocity: 2.5, acceleration: 0 },
          { id: 'w-4', sequence: 4, x: 6, y: 2, z: 8, timestamp: 10, velocity: 2.0, acceleration: -1.0 },
          { id: 'w-5', sequence: 5, x: 10, y: 2, z: 6, timestamp: 12, velocity: 0, acceleration: -1.5 },
        ],
      },
    ],
    defaultSafetyFactor: 5,
    dynamicCoefficient: 1.3,
    impactCoefficient: 1.6,
    calculationResults: [],
    approvalSignatures: [
      {
        id: 'app-1-1',
        signerName: '王建国',
        signerRole: '项目经理',
        signatureData: sampleSignatureData1,
        signedAt: iso(3),
        comments: '吊点布置合理，同意进入复核阶段。',
      },
      {
        id: 'app-1-2',
        signerName: '李志强',
        signerRole: '技术总监',
        signatureData: sampleSignatureData2,
        signedAt: iso(2),
        comments: '绞车选型符合要求，钢丝绳规格满足安全系数。',
      },
      {
        id: 'app-1-3',
        signerName: '陈安全',
        signerRole: '安全主管',
        signatureData: sampleSignatureData1,
        signedAt: iso(1),
        comments: '应急备份吊点设置合理，同意执行。',
      },
    ],
    versionHistory: [],
    currentVersion: 'v1.2',
    currentBatch: 'B3821',
    createdAt: iso(14),
    updatedAt: iso(1),
    createdBy: '机械组 - 赵工',
    tags: ['大型舞剧', '群舞', '飞天系列', '已审批'],
    hasAbnormalData: false,
  };
  p.calculationResults = calculateAllLoads(
    p.liftPoints,
    p.performers,
    p.motionPaths,
    p.defaultSafetyFactor,
    p.dynamicCoefficient,
    p.impactCoefficient
  );
  const peak = getPeakLoads(p.calculationResults);
  p.hasAbnormalData = peak.some((r) => r.alertLevel === 'danger');
  return p;
}

function buildProject2(): Project {
  const p: Project = {
    id: 'proj-002',
    code: 'WY-2026-002',
    name: '跨年演唱会 - 歌手空中降落',
    venue: '上海梅赛德斯奔驰文化中心',
    performance: '2026跨年演唱会',
    description:
      '跨年倒计时环节，主唱从舞台正上方30米高空缓缓下降，配合烟火效果。需要精确控制下降速度，并考虑风载影响。',
    status: 'review',
    liftPoints: [
      {
        id: 'lp-2-1',
        name: 'LP-MAIN 主升降吊点',
        type: 'fixed',
        x: 0,
        y: 0,
        z: 32,
        maxLoad: 1200,
        equipment: 'PFEIFER FZL 1200重型变频绞车',
        anchorMethod: '屋架节点板M30高强度螺栓双固定',
        materialSpec: '7×37镀锌钢丝绳 Φ14mm 破断力120kN',
      },
      {
        id: 'lp-2-2',
        name: 'LP-GUIDE 导索吊点',
        type: 'fixed',
        x: 1.5,
        y: 0,
        z: 30,
        maxLoad: 300,
        equipment: '张紧导索 + 防摆阻尼器',
        anchorMethod: '附加桁架横担',
        materialSpec: '7×19不锈钢钢丝绳 Φ6mm 破断力22kN',
      },
      {
        id: 'lp-2-3',
        name: 'LP-SAFETY 安全冗余吊点',
        type: 'fixed',
        x: -1.5,
        y: 0,
        z: 30,
        maxLoad: 800,
        equipment: 'SALA Talon 坠落制动器 8kN',
        anchorMethod: '独立结构吊点',
        materialSpec: '7×37镀锌钢丝绳 Φ12mm 破断力82kN',
      },
      {
        id: 'lp-2-4',
        name: 'LP-WIND 风载测试点',
        type: 'fixed',
        x: 0,
        y: 1,
        z: 15,
        maxLoad: 500,
        equipment: '张力传感器 + 实时监控',
        anchorMethod: '辅助安装点',
        materialSpec: '7×19镀锌钢丝绳 Φ8mm 破断力38kN',
      },
    ],
    performers: [
      {
        id: 'pf-2-1',
        name: '周俊杰（歌手）',
        role: '主唱',
        weight: 68,
        costumeWeight: 12,
        propWeight: 8,
        totalWeight: 88,
        safetyHarness: 'Petzl Newton EASYFIT 全身安全带 + 胸升',
        remarks: '手持金属麦克风约0.8kg，佩戴无线耳返。服装含金属亮片装饰。',
      },
      {
        id: 'pf-2-2',
        name: '伴舞A',
        role: '空中伴舞',
        weight: 55,
        costumeWeight: 6,
        propWeight: 2,
        totalWeight: 63,
        safetyHarness: 'Petzl Avao Body',
      },
    ],
    motionPaths: [
      {
        id: 'mp-2-1',
        name: '30米垂直缓降',
        type: 'linear',
        duration: 45,
        maxSpeed: 1.2,
        maxAcceleration: 0.5,
        waypoints: [
          { id: 'w-1', sequence: 1, x: 0, y: 0, z: 30, timestamp: 0, velocity: 0, acceleration: 0 },
          { id: 'w-2', sequence: 2, x: 0, y: 0, z: 28, timestamp: 5, velocity: 0.5, acceleration: 0.3 },
          { id: 'w-3', sequence: 3, x: 0, y: 0, z: 22, timestamp: 15, velocity: 1.2, acceleration: 0.1 },
          { id: 'w-4', sequence: 4, x: 0, y: 0, z: 15, timestamp: 25, velocity: 1.0, acceleration: -0.1 },
          { id: 'w-5', sequence: 5, x: 0, y: 0, z: 8, timestamp: 35, velocity: 0.6, acceleration: -0.2 },
          { id: 'w-6', sequence: 6, x: 0, y: 0, z: 3, timestamp: 43, velocity: 0.2, acceleration: -0.3 },
          { id: 'w-7', sequence: 7, x: 0, y: 0, z: 1.5, timestamp: 45, velocity: 0, acceleration: -0.1 },
        ],
      },
    ],
    defaultSafetyFactor: 5,
    dynamicCoefficient: 1.2,
    impactCoefficient: 1.5,
    calculationResults: [],
    approvalSignatures: [
      {
        id: 'app-2-1',
        signerName: '张伟',
        signerRole: '项目经理',
        signatureData: sampleSignatureData2,
        signedAt: iso(0),
        comments: '已完成现场勘察，提交复核。',
      },
    ],
    versionHistory: [],
    currentVersion: 'v1.0',
    currentBatch: 'B4102',
    createdAt: iso(5),
    updatedAt: iso(0),
    createdBy: '技术组 - 钱工',
    tags: ['演唱会', '单人高空', '缓降', '待审批'],
    hasAbnormalData: false,
  };
  p.calculationResults = calculateAllLoads(
    p.liftPoints,
    p.performers,
    p.motionPaths,
    p.defaultSafetyFactor,
    p.dynamicCoefficient,
    p.impactCoefficient
  );
  return p;
}

function buildProject3(): Project {
  const p: Project = {
    id: 'proj-003',
    code: 'WY-2026-003',
    name: '杂技专场 - 双人空中翻转让位',
    venue: '广州杂技艺术中心剧场',
    performance: '《极限之翼》杂技专场',
    description:
      '高难度双人杂技动作：两名演员在8-12米高空完成翻转让位和对接。包含加速摆动和瞬时冲击载荷。',
    status: 'draft',
    liftPoints: [
      {
        id: 'lp-3-1',
        name: 'LP-1 演员A主吊点',
        type: 'swing',
        x: -3,
        y: 0,
        z: 14,
        maxLoad: 400,
        equipment: '高性能低摩擦滑车',
        anchorMethod: '弧形轨道滑车',
        materialSpec: '7×19航空钢丝绳 Φ10mm 破断力65kN',
      },
      {
        id: 'lp-3-2',
        name: 'LP-2 演员B主吊点',
        type: 'swing',
        x: 3,
        y: 0,
        z: 14,
        maxLoad: 400,
        equipment: '高性能低摩擦滑车',
        anchorMethod: '弧形轨道滑车',
        materialSpec: '7×19航空钢丝绳 Φ10mm 破断力65kN',
      },
      {
        id: 'lp-3-3',
        name: 'LP-3 交接点（超负载）',
        type: 'fixed',
        x: 0,
        y: 0,
        z: 12,
        maxLoad: 350,
        equipment: '固定位置吊点',
        anchorMethod: '标准桁架吊环',
        materialSpec: '7×19镀锌钢丝绳 Φ8mm 破断力38kN',
      },
      {
        id: 'lp-3-4',
        name: 'LP-4 动作辅助吊点',
        type: 'fixed',
        x: 0,
        y: 2,
        z: 10,
        maxLoad: 200,
        equipment: '轻载牵引绞车',
        anchorMethod: '轻型桁架',
        materialSpec: '7×19镀锌钢丝绳 Φ6mm 破断力22kN',
      },
    ],
    performers: [
      {
        id: 'pf-3-1',
        name: '吴云飞',
        role: '杂技演员A',
        weight: 62,
        costumeWeight: 4,
        propWeight: 3,
        totalWeight: 69,
        safetyHarness: '定制杂技全身安全吊带',
        remarks: '完成360°翻转动作，瞬时加速度可达8m/s²',
      },
      {
        id: 'pf-3-2',
        name: '郑浩然',
        role: '杂技演员B',
        weight: 58,
        costumeWeight: 4,
        propWeight: 2,
        totalWeight: 64,
        safetyHarness: '定制杂技全身安全吊带',
        remarks: '完成后空翻两周动作，最大摆角约60度',
      },
    ],
    motionPaths: [
      {
        id: 'mp-3-1',
        name: '双人摆动翻转',
        type: 'complex',
        duration: 12,
        maxSpeed: 4.5,
        maxAcceleration: 8.0,
        waypoints: [
          { id: 'w-1', sequence: 1, x: -2, y: 0, z: 10, timestamp: 0, velocity: 0, acceleration: 0 },
          { id: 'w-2', sequence: 2, x: 0, y: 0, z: 8, timestamp: 2, velocity: 2.5, acceleration: 3.0 },
          { id: 'w-3', sequence: 3, x: 2, y: 0, z: 9, timestamp: 4, velocity: 4.5, acceleration: 8.0 },
          { id: 'w-4', sequence: 4, x: 0, y: 0, z: 11, timestamp: 6, velocity: 3.0, acceleration: -5.0 },
          { id: 'w-5', sequence: 5, x: -2, y: 0, z: 10, timestamp: 8, velocity: 2.0, acceleration: 2.0 },
          { id: 'w-6', sequence: 6, x: 0, y: 0, z: 8, timestamp: 10, velocity: 1.5, acceleration: -1.5 },
          { id: 'w-7', sequence: 7, x: 0, y: 0, z: 8, timestamp: 12, velocity: 0, acceleration: 0 },
        ],
      },
    ],
    defaultSafetyFactor: 5,
    dynamicCoefficient: 1.8,
    impactCoefficient: 2.5,
    calculationResults: [],
    approvalSignatures: [],
    versionHistory: [],
    currentVersion: 'v0.3',
    currentBatch: 'B4155',
    createdAt: iso(2),
    updatedAt: iso(0),
    createdBy: '杂技团技术组',
    tags: ['杂技', '高难度', '双人', '草稿', '超负载警告'],
    hasAbnormalData: false,
    abnormalNotes: undefined,
  };
  p.calculationResults = calculateAllLoads(
    p.liftPoints,
    p.performers,
    p.motionPaths,
    p.defaultSafetyFactor,
    p.dynamicCoefficient,
    p.impactCoefficient
  );
  const peak = getPeakLoads(p.calculationResults);
  p.hasAbnormalData = peak.some((r) => r.alertLevel === 'danger');
  if (p.hasAbnormalData) {
    const names = peak.filter((r) => r.alertLevel === 'danger').map((r) => r.pointName);
    p.abnormalNotes = `危险吊点：${names.join('、')} - 交接点最大负载接近极限，需升级钢丝绳或降低冲击系数`;
  }
  return p;
}

function buildProject4(): Project {
  const p: Project = {
    id: 'proj-004',
    code: 'WY-2025-089',
    name: '儿童剧《彼得潘》 - 小演员群飞',
    venue: '北京天桥艺术中心',
    performance: '彼得潘',
    description: '第三幕"飞向梦幻岛"场景，5名小演员从舞台上方飞掠观众席上空，配合投影效果。',
    status: 'approved',
    liftPoints: [
      {
        id: 'lp-4-1',
        name: 'LP-1 前区主吊点',
        type: 'mobile',
        x: -5,
        y: 8,
        z: 10,
        maxLoad: 300,
        equipment: '轨道绞车 300kg',
        anchorMethod: '观众席上空桁架',
        materialSpec: '7×19钢丝绳 Φ8mm 破断力38kN',
      },
      {
        id: 'lp-4-2',
        name: 'LP-2 中区主吊点',
        type: 'mobile',
        x: 0,
        y: 12,
        z: 9,
        maxLoad: 300,
        equipment: '轨道绞车 300kg',
        anchorMethod: '观众席上空桁架',
        materialSpec: '7×19钢丝绳 Φ8mm 破断力38kN',
      },
      {
        id: 'lp-4-3',
        name: 'LP-3 后区主吊点',
        type: 'mobile',
        x: 5,
        y: 16,
        z: 9,
        maxLoad: 300,
        equipment: '轨道绞车 300kg',
        anchorMethod: '观众席上空桁架',
        materialSpec: '7×19钢丝绳 Φ8mm 破断力38kN',
      },
    ],
    performers: [
      { id: 'pf-4-1', name: '林子轩（12岁）', role: '彼得潘', weight: 38, costumeWeight: 4, propWeight: 2, totalWeight: 44, safetyHarness: '儿童专用全身安全带 Petzl Ouistiti' },
      { id: 'pf-4-2', name: '孙欣怡（11岁）', role: '温蒂', weight: 32, costumeWeight: 5, propWeight: 1, totalWeight: 38, safetyHarness: '儿童专用全身安全带 Petzl Ouistiti' },
      { id: 'pf-4-3', name: '周小宝（10岁）', role: '约翰', weight: 30, costumeWeight: 3, propWeight: 1, totalWeight: 34, safetyHarness: '儿童专用全身安全带 Petzl Ouistiti' },
      { id: 'pf-4-4', name: '李小美（9岁）', role: '迈克尔', weight: 26, costumeWeight: 3, propWeight: 2, totalWeight: 31, safetyHarness: '儿童专用全身安全带 Petzl Ouistiti' },
      { id: 'pf-4-5', name: '王朵朵（11岁）', role: '叮当小仙女', weight: 31, costumeWeight: 6, propWeight: 3, totalWeight: 40, safetyHarness: '儿童专用全身安全带 Petzl Ouistiti', remarks: '道具翅膀略重，已计入' },
    ],
    motionPaths: [
      {
        id: 'mp-4-1',
        name: '飞越观众席主轨迹',
        type: 'arc',
        duration: 22,
        maxSpeed: 2.0,
        maxAcceleration: 1.2,
        waypoints: [
          { id: 'w-1', sequence: 1, x: 0, y: 0, z: 8, timestamp: 0, velocity: 0, acceleration: 0 },
          { id: 'w-2', sequence: 2, x: -2, y: 4, z: 9, timestamp: 4, velocity: 1.5, acceleration: 1.0 },
          { id: 'w-3', sequence: 3, x: 0, y: 8, z: 10, timestamp: 9, velocity: 2.0, acceleration: 0.5 },
          { id: 'w-4', sequence: 4, x: 2, y: 12, z: 9, timestamp: 14, velocity: 1.8, acceleration: -0.3 },
          { id: 'w-5', sequence: 5, x: 0, y: 16, z: 8, timestamp: 19, velocity: 1.0, acceleration: -0.5 },
          { id: 'w-6', sequence: 6, x: 0, y: 18, z: 7, timestamp: 22, velocity: 0, acceleration: -0.2 },
        ],
      },
    ],
    defaultSafetyFactor: 6,
    dynamicCoefficient: 1.2,
    impactCoefficient: 1.5,
    calculationResults: [],
    approvalSignatures: [
      { id: 'a41', signerName: '刘指导', signerRole: '项目经理', signatureData: sampleSignatureData1, signedAt: iso(45), comments: '儿童项目，安全系数提升至6，同意。' },
      { id: 'a42', signerName: '高工程师', signerRole: '技术总监', signatureData: sampleSignatureData2, signedAt: iso(44), comments: '儿童专用安全带型号确认无误。' },
      { id: 'a43', signerName: '柴主任', signerRole: '安全主管', signatureData: sampleSignatureData1, signedAt: iso(43), comments: '观众席上空须设安全防护网，同意执行。' },
    ],
    versionHistory: [],
    currentVersion: 'v2.0',
    currentBatch: 'B2980',
    createdAt: iso(60),
    updatedAt: iso(43),
    createdBy: '儿童剧项目部',
    tags: ['儿童剧', '观众席飞越', '高安全系数', '历史项目'],
    hasAbnormalData: false,
  };
  p.calculationResults = calculateAllLoads(p.liftPoints, p.performers, p.motionPaths, p.defaultSafetyFactor, p.dynamicCoefficient, p.impactCoefficient);
  return p;
}

function buildProject5(): Project {
  const p: Project = {
    id: 'proj-005',
    code: 'WY-2026-004',
    name: '实验话剧《重力反转》 - 全舞台机械威亚联动',
    venue: '乌镇戏剧节·水剧场',
    performance: '重力反转',
    description:
      '实验性话剧，利用360°威亚系统实现演员在垂直舞台上"行走"的视觉效果。共12个吊点联动，精确控制姿态。',
    status: 'rejected',
    liftPoints: Array.from({ length: 8 }, (_, i) => ({
      id: `lp-5-${i + 1}`,
      name: `LP-${String.fromCharCode(65 + i)} 联动吊点-${i + 1}`,
      type: 'fixed',
      x: Math.cos((i / 8) * Math.PI * 2) * 6,
      y: Math.sin((i / 8) * Math.PI * 2) * 6,
      z: 10 + (i % 3) * 2,
      maxLoad: i < 4 ? 250 : 200,
      equipment: `精密伺服绞车 ${i < 4 ? 250 : 200}kg`,
      anchorMethod: '环形钢结构主桁架',
      materialSpec: '7×19航空钢丝绳 Φ7mm 破断力30kN',
    })),
    performers: [
      { id: 'pf-5-1', name: '冯一航', role: '男主角', weight: 70, costumeWeight: 5, propWeight: 2, totalWeight: 77, safetyHarness: '全身多点定位安全带' },
      { id: 'pf-5-2', name: '韩雪梅', role: '女主角', weight: 52, costumeWeight: 6, propWeight: 1, totalWeight: 59, safetyHarness: '全身多点定位安全带' },
      { id: 'pf-5-3', name: '徐东来', role: '男配角', weight: 65, costumeWeight: 4, propWeight: 0, totalWeight: 69, safetyHarness: '全身多点定位安全带' },
    ],
    motionPaths: [
      {
        id: 'mp-5-1',
        name: '垂直墙壁行走',
        type: 'complex',
        duration: 30,
        maxSpeed: 0.8,
        maxAcceleration: 0.6,
        waypoints: [
          { id: 'w-1', sequence: 1, x: 0, y: 5, z: 1, timestamp: 0, velocity: 0, acceleration: 0 },
          { id: 'w-2', sequence: 2, x: 0, y: 5, z: 3, timestamp: 5, velocity: 0.5, acceleration: 0.3 },
          { id: 'w-3', sequence: 3, x: 2, y: 5, z: 5, timestamp: 10, velocity: 0.8, acceleration: 0.6 },
          { id: 'w-4', sequence: 4, x: 4, y: 5, z: 4, timestamp: 15, velocity: 0.6, acceleration: -0.2 },
          { id: 'w-5', sequence: 5, x: 2, y: 5, z: 3, timestamp: 20, velocity: 0.5, acceleration: -0.3 },
          { id: 'w-6', sequence: 6, x: 0, y: 5, z: 2, timestamp: 25, velocity: 0.3, acceleration: -0.1 },
          { id: 'w-7', sequence: 7, x: 0, y: 5, z: 1, timestamp: 30, velocity: 0, acceleration: -0.1 },
        ],
      },
    ],
    defaultSafetyFactor: 5,
    dynamicCoefficient: 1.15,
    impactCoefficient: 1.4,
    calculationResults: [],
    approvalSignatures: [
      { id: 'a51', signerName: '实验艺术中心', signerRole: '项目经理', signatureData: sampleSignatureData1, signedAt: iso(7), comments: '概念创新，但风险过高。' },
    ],
    versionHistory: [],
    currentVersion: 'v0.5',
    currentBatch: 'B4001',
    createdAt: iso(10),
    updatedAt: iso(6),
    createdBy: '实验剧工作室',
    tags: ['实验话剧', '多吊点联动', '创意项目', '被拒绝'],
    hasAbnormalData: true,
    abnormalNotes: '安全审批未通过：联动系统冗余不足，部分吊点额定载荷偏低；建议升级至至少300kg绞车并增加4个冗余吊点。',
  };
  p.calculationResults = calculateAllLoads(p.liftPoints, p.performers, p.motionPaths, p.defaultSafetyFactor, p.dynamicCoefficient, p.impactCoefficient);
  const peak = getPeakLoads(p.calculationResults);
  p.hasAbnormalData = p.hasAbnormalData || peak.some((r) => r.alertLevel === 'danger');
  return p;
}

const seedProjects: Project[] = [
  buildProject1(),
  buildProject2(),
  buildProject3(),
  buildProject4(),
  buildProject5(),
];

for (const p of seedProjects) {
  if (p.calculationResults.length === 0) {
    p.calculationResults = calculateAllLoads(
      p.liftPoints,
      p.performers,
      p.motionPaths,
      p.defaultSafetyFactor,
      p.dynamicCoefficient,
      p.impactCoefficient
    );
  }
  if (p.versionHistory.length === 0 && p.currentVersion !== 'v1.0') {
    const major = parseFloat(p.currentVersion.replace('v', ''));
    p.versionHistory = [
      {
        version: `v${(major - 0.1).toFixed(1)}`,
        batch: `B${parseInt(p.currentBatch) - 100}`,
        createdAt: p.createdAt,
        createdBy: p.createdBy,
        changeLog: '初始版本创建，完成基础吊点布置和初步载荷计算。',
        snapshot: {
          liftPoints: JSON.parse(JSON.stringify(p.liftPoints.slice(0, Math.max(1, p.liftPoints.length - 1)))),
          performers: JSON.parse(JSON.stringify(p.performers)),
          motionPaths: JSON.parse(JSON.stringify(p.motionPaths)),
          defaultSafetyFactor: p.defaultSafetyFactor,
          dynamicCoefficient: p.dynamicCoefficient,
          impactCoefficient: p.impactCoefficient,
        },
        calculationResults: [],
      },
    ];
  }
}

export default seedProjects;

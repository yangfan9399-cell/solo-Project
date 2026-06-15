import {
  createMainRecord,
  createExposureDetail,
  createWashHistory,
  createResultRecord,
  createPhoto,
  cloneBatchForRecalc,
  archiveMainRecord,
  listMainRecords,
  updateMainRecord,
  updateResultRecord,
  getResultRecordByMain,
  deleteExposureDetail,
  listExposureDetails,
} from './db';
import type { FailTag } from './types';

const PLACEHOLDER_BLUE_STRIPE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='160'>
      <defs>
        <linearGradient id='g' x1='0' x2='1'>
          <stop offset='0' stop-color='%230e4d92'/>
          <stop offset='1' stop-color='%232a7de1'/>
        </linearGradient>
      </defs>
      <rect width='200' height='160' fill='url(%23g)'/>
      <g fill='white' opacity='0.85' font-family='sans-serif'>
        <rect x='20' y='40' width='160' height='6' fill='white'/>
        <rect x='20' y='55' width='120' height='4' fill='white' opacity='0.6'/>
        <rect x='20' y='80' width='80' height='80' fill='none' stroke='white' stroke-width='2'/>
        <text x='100' y='130' text-anchor='middle' font-size='11'>CYANOTYPE</text>
      </g>
    </svg>`
  );

export function seedIfEmpty() {
  if (listMainRecords({ includeArchived: true }).length > 0) return;
  seedSample1_NormalWithPhotos();
  seedSample2_ParamAnomaly();
  seedSample3_FailAndArchiveRollback();
}

function seedSample1_NormalWithPhotos() {
  const main = createMainRecord({
    solutionARatio: 25,
    solutionBRatio: 10,
    solutionC_Ratio: 5,
    totalVolumeMl: 200,
    paperType: '水彩纸 300g 粗纹',
    paperWeightGsm: 300,
    notes: '标准配方：25%柠檬酸铁铵 + 10%铁氰化钾 + 5%阿拉伯胶。首次使用新批次纸张，涂布均匀。',
    createdBy: '张显影师',
  });

  createExposureDetail({
    mainRecordId: main.id,
    sheetNo: 1,
    uvIntensityMwCm2: 6.8,
    exposureMinutes: 12,
    exposureSeconds: 30,
    uvIndex: 7.2,
    lightSource: '太阳光(正午)',
    distanceCm: 0,
  });

  createWashHistory({
    mainRecordId: main.id,
    orderIndex: 1,
    stage: 'first_wash',
    durationMinutes: 5,
    durationSeconds: 0,
    waterTempC: 20,
    phValue: 6.8,
    agitationHz: 0.5,
    operatorNote: '水流缓慢，观察到大量黄色溶出',
  });
  createWashHistory({
    mainRecordId: main.id,
    orderIndex: 2,
    stage: 'acid_bath',
    durationMinutes: 2,
    durationSeconds: 30,
    waterTempC: 20,
    phValue: 3.5,
    agitationHz: 0.3,
    operatorNote: '2%醋酸浴，蓝色迅速显现',
  });
  createWashHistory({
    mainRecordId: main.id,
    orderIndex: 3,
    stage: 'second_wash',
    durationMinutes: 10,
    durationSeconds: 0,
    waterTempC: 20,
    phValue: 7.0,
    agitationHz: 0.4,
    operatorNote: '流动水冲洗至水不再泛黄',
  });
  createWashHistory({
    mainRecordId: main.id,
    orderIndex: 4,
    stage: 'final_rinse',
    durationMinutes: 1,
    durationSeconds: 30,
    waterTempC: 20,
    phValue: 7.0,
    agitationHz: 0.2,
    operatorNote: '去离子水最终漂洗',
  });

  createResultRecord({
    mainRecordId: main.id,
    roomTempC: 23.5,
    humidityPct: 55,
    solutionTempC: 21.0,
    dryingTempC: 25,
    dryingMethod: '自然阴干',
    visualGrade: 8,
    densityGrade: 8,
    contrastGrade: 7,
    overallScore: 78,
    failTags: [] as FailTag[],
    isSuccess: true,
    evaluator: '李工艺师',
    evaluationNote: '蓝色饱和，对比度良好，阴干后无明显泛黄。粗纹纸呈现出自然的纹理。',
    evaluatedAt: Date.now() - 86400000 * 2,
    recalculationCount: 0,
    lastRecalculatedAt: null,
    recalculationNote: null,
  });

  createPhoto({
    batchId: main.id,
    stage: 'before_exposure',
    caption: '涂布后晾干状态，颜色呈淡黄绿色',
    dataUrl: PLACEHOLDER_BLUE_STRIPE,
  });
  createPhoto({
    batchId: main.id,
    stage: 'after_exposure',
    caption: '曝光完成，图案已显示',
    dataUrl: PLACEHOLDER_BLUE_STRIPE,
  });
  createPhoto({
    batchId: main.id,
    stage: 'after_wash',
    caption: '水洗后蓝色显现',
    dataUrl: PLACEHOLDER_BLUE_STRIPE,
  });
  createPhoto({
    batchId: main.id,
    stage: 'dried',
    caption: '最终成品 - 植物蓝晒图案',
    dataUrl: PLACEHOLDER_BLUE_STRIPE,
  });
}

function seedSample2_ParamAnomaly() {
  const main = createMainRecord({
    solutionARatio: 40,
    solutionBRatio: 6,
    solutionC_Ratio: 2,
    totalVolumeMl: 350,
    paperType: '素描纸 160g 细纹',
    paperWeightGsm: 160,
    notes: '参数偏差：A液加量到40g试图加深蓝色，B液减少，总容量偏大。',
    createdBy: '王实验员',
  });

  createExposureDetail({
    mainRecordId: main.id,
    sheetNo: 1,
    uvIntensityMwCm2: 11.5,
    exposureMinutes: 22,
    exposureSeconds: 0,
    uvIndex: 10.5,
    lightSource: 'UV灯箱(365nm)',
    distanceCm: 25,
  });

  createWashHistory({
    mainRecordId: main.id,
    orderIndex: 1,
    stage: 'first_wash',
    durationMinutes: 2,
    durationSeconds: 0,
    waterTempC: 27,
    phValue: 7.2,
    agitationHz: 0.2,
    operatorNote: '水温偏高，冲洗时间缩短',
  });
  createWashHistory({
    mainRecordId: main.id,
    orderIndex: 2,
    stage: 'acid_bath',
    durationMinutes: 2,
    durationSeconds: 0,
    waterTempC: 27,
    phValue: 3.6,
    agitationHz: 0.2,
    operatorNote: '醋酸浴',
  });
  createWashHistory({
    mainRecordId: main.id,
    orderIndex: 3,
    stage: 'second_wash',
    durationMinutes: 4,
    durationSeconds: 0,
    waterTempC: 27,
    phValue: 7.1,
    agitationHz: 0.2,
    operatorNote: '水质未见明显转清',
  });
  createWashHistory({
    mainRecordId: main.id,
    orderIndex: 4,
    stage: 'final_rinse',
    durationMinutes: 0,
    durationSeconds: 45,
    waterTempC: 27,
    phValue: 7.0,
    agitationHz: 0.2,
    operatorNote: '快速漂洗',
  });

  createResultRecord({
    mainRecordId: main.id,
    roomTempC: 31.0,
    humidityPct: 78,
    solutionTempC: 28.5,
    dryingTempC: 32,
    dryingMethod: '烘干加速',
    visualGrade: 3,
    densityGrade: 2,
    contrastGrade: 3,
    overallScore: 28,
    failTags: ['over_exposure', 'washing_insufficient', 'yellowing', 'poor_contrast'] as FailTag[],
    isSuccess: false,
    evaluator: '王实验员',
    evaluationNote: '高温高湿+过曝，画面大面积泛黄；水洗严重不足导致残留，对比度极差。',
    evaluatedAt: Date.now() - 86400000,
    recalculationCount: 0,
    lastRecalculatedAt: null,
    recalculationNote: null,
  });

  createPhoto({
    batchId: main.id,
    stage: 'after_wash',
    caption: '水洗后已出现大面积泛黄迹象',
    dataUrl: PLACEHOLDER_BLUE_STRIPE,
  });
  createPhoto({
    batchId: main.id,
    stage: 'dried',
    caption: '干燥后成品 - 大面积黄染，对比度差',
    dataUrl: PLACEHOLDER_BLUE_STRIPE,
  });
}

function seedSample3_FailAndArchiveRollback() {
  const v1 = createMainRecord({
    solutionARatio: 20,
    solutionBRatio: 12,
    solutionC_Ratio: 4,
    totalVolumeMl: 180,
    paperType: '棉浆纸 250g 中粗',
    paperWeightGsm: 250,
    notes: '第一次尝试：A液减少，B液增加，试图提升对比度。涂布出现条纹。',
    createdBy: '赵工艺师',
  });

  createExposureDetail({
    mainRecordId: v1.id,
    sheetNo: 1,
    uvIntensityMwCm2: 5.5,
    exposureMinutes: 8,
    exposureSeconds: 0,
    uvIndex: 6.0,
    lightSource: '太阳光(上午)',
    distanceCm: 0,
  });
  createWashHistory({
    mainRecordId: v1.id,
    orderIndex: 1, stage: 'first_wash',
    durationMinutes: 4, durationSeconds: 0,
    waterTempC: 19, phValue: 6.9, agitationHz: 0.4,
    operatorNote: '初洗',
  });
  createWashHistory({
    mainRecordId: v1.id,
    orderIndex: 2, stage: 'acid_bath',
    durationMinutes: 2, durationSeconds: 0,
    waterTempC: 19, phValue: 3.5, agitationHz: 0.3,
    operatorNote: '酸浴',
  });
  createWashHistory({
    mainRecordId: v1.id,
    orderIndex: 3, stage: 'second_wash',
    durationMinutes: 8, durationSeconds: 0,
    waterTempC: 19, phValue: 7.0, agitationHz: 0.4,
    operatorNote: '二洗',
  });
  createWashHistory({
    mainRecordId: v1.id,
    orderIndex: 4, stage: 'final_rinse',
    durationMinutes: 1, durationSeconds: 0,
    waterTempC: 19, phValue: 7.0, agitationHz: 0.2,
    operatorNote: '漂洗',
  });

  createResultRecord({
    mainRecordId: v1.id,
    roomTempC: 21.0, humidityPct: 60, solutionTempC: 20.0,
    dryingTempC: 24, dryingMethod: '自然阴干',
    visualGrade: 4, densityGrade: 5, contrastGrade: 4,
    overallScore: 44,
    failTags: ['uneven_coating', 'under_exposure', 'poor_contrast'] as FailTag[],
    isSuccess: false,
    evaluator: '赵工艺师',
    evaluationNote: '涂布条纹明显，曝光不足导致偏淡，对比度低于预期。需要回滚到标准配方重新实验。',
    evaluatedAt: Date.now() - 86400000 * 5,
    recalculationCount: 0,
    lastRecalculatedAt: null,
    recalculationNote: null,
  });

  archiveMainRecord(v1.id, '参数不理想，涂布失败，作为对照样本归档');

  const v2 = cloneBatchForRecalc(v1.id, '赵工艺师');
  if (v2) {
    updateMainRecord(v2.id, {
      solutionARatio: 25,
      solutionBRatio: 10,
      totalVolumeMl: 200,
      notes: '[重算版本 v2] 回到标准配方，修正涂布手法以消除条纹。',
    });
    const res2 = getResultRecordByMain(v2.id);
    if (res2) {
      updateResultRecord(res2.id, {
        overallScore: 68,
        visualGrade: 7,
        densityGrade: 7,
        contrastGrade: 6,
        failTags: ['uneven_coating'] as FailTag[],
        isSuccess: true,
        evaluationNote: 'v2 配方回归后蓝色饱和度显著提高，但仍有轻微涂布痕迹需继续改进。',
        recalculationCount: 1,
        lastRecalculatedAt: Date.now() - 86400000 * 3,
        recalculationNote: '从 v1 重算：回归标准25:10比例，总容量加至200ml',
      });
    }
  }

  const v3Init = cloneBatchForRecalc(v2?.id || v1.id, '赵工艺师');
  if (v3Init) {
    updateMainRecord(v3Init.id, {
      paperType: '棉浆纸 250g 中粗（新批次）',
      notes: '[重算版本 v3] 更换新批次纸张，调整曝光时间，目标是完全消除涂布条纹。',
    });
    const oldExps = listExposureDetails(v3Init.id);
    for (const oe of oldExps) deleteExposureDetail(oe.id);
    createExposureDetail({
      mainRecordId: v3Init.id,
      sheetNo: 1,
      uvIntensityMwCm2: 7.0,
      exposureMinutes: 11,
      exposureSeconds: 0,
      uvIndex: 7.0,
      lightSource: '太阳光(正午)',
      distanceCm: 0,
    });
  }
}

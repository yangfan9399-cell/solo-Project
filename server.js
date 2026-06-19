const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return initDefaultData();
  }
  try {
    let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    let migrated = false;
    if (data.specimens) {
      data.specimens.forEach(s => {
        if ((s.id === 1 || s.id === 2) && !s.retest_group) {
          s.retest_group = {
            group_id: 'GG-2026-SPORE-01',
            group_name: '贡嘎山东坡孢子异常跨季节复测组',
            season: s.id === 1 ? '春季' : '秋季',
            paired_specimen_id: s.id === 1 ? 2 : 1,
            is_first_sample: s.id === 1,
            category_change_summary: s.id === 1
              ? '首次采集判定为A类疑似新亚种，秋季复测后归属调整为B类环境胁迫'
              : '春季首次采集判定为A类疑似新亚种，本次秋季复测后归属调整为B类环境胁迫'
          };
          migrated = true;
        }
      });
    }
    if (migrated) {
      saveData(data);
      console.log('数据迁移完成：已为 LC-2026-0012/0145 补充跨季节复测关联信息');
    }
    return data;
  } catch (e) {
    console.error('数据文件损坏，重新初始化', e);
    return initDefaultData();
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function nowISO() {
  return new Date().toISOString();
}

function initDefaultData() {
  const responsiblePersons = [
    { id: 1, name: '张明远', role: '高级分类学家', status: '在岗' },
    { id: 2, name: '李雪梅', role: '标本鉴定师', status: '在岗' },
    { id: 3, name: '王建国', role: '分子实验员', status: '在岗' },
    { id: 4, name: '陈思琪', role: '野外采集员', status: '休假' },
    { id: 5, name: '刘浩然', role: '质量监督员', status: '在岗' }
  ];

  const createdAt = (offsetDays = 0, offsetHours = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    d.setHours(d.getHours() - offsetHours);
    return d.toISOString();
  };

  const specimens = [
    {
      id: 1,
      specimen_no: 'LC-2026-0012',
      species: '黄髓叶梅衣',
      collection_location: '横断山脉-贡嘎山-东坡',
      collection_coords: '29.6248, 101.9265',
      altitude: 3200,
      substrate: '酸性岩石（花岗岩）',
      spore_density: '异常偏高（均值的3.2倍）',
      humidity_exposure: '中度暴露（林缘）',
      micro_slide: '子囊孢子排列紊乱，大小不均',
      collection_date: '2026-03-15',
      collector: '陈思琪',
      abnormal_type: '孢子密度异常',
      abnormal_desc: '春季孢子数量远超同海拔同类标本，疑似环境胁迫或遗传变异',
      belong_category: 'A类-疑似新亚种',
      retest_group: {
        group_id: 'GG-2026-SPORE-01',
        group_name: '贡嘎山东坡孢子异常跨季节复测组',
        season: '春季',
        paired_specimen_id: 2,
        is_first_sample: true,
        category_change_summary: '首次采集判定为A类疑似新亚种，秋季复测后归属调整为B类环境胁迫'
      },
      triage_status: '待分诊',
      triage_result: null,
      triage_note: null,
      deadline: null,
      responsible_id: 1,
      close_reason: null,
      close_note: null,
      created_at: createdAt(5, 2),
      triaged_at: null
    },
    {
      id: 2,
      specimen_no: 'LC-2026-0145',
      species: '黄髓叶梅衣',
      collection_location: '横断山脉-贡嘎山-东坡',
      collection_coords: '29.6248, 101.9265',
      altitude: 3200,
      substrate: '酸性岩石（花岗岩）',
      spore_density: '异常偏高（均值的3.5倍）',
      humidity_exposure: '中度暴露（林缘）',
      micro_slide: '子囊孢子壁增厚，隔膜异常，部分孢子畸形',
      collection_date: '2026-09-22',
      collector: '王建国',
      abnormal_type: '孢子密度+形态异常',
      abnormal_desc: '【跨季节复测】同一坐标点秋季复测标本，孢子密度仍偏高且出现形态变异，春季原分类为A类疑似新亚种，当前表现更符合环境胁迫特征，需确认归属分类是否从A类调整为B类',
      belong_category: 'B类-环境胁迫',
      retest_group: {
        group_id: 'GG-2026-SPORE-01',
        group_name: '贡嘎山东坡孢子异常跨季节复测组',
        season: '秋季',
        paired_specimen_id: 1,
        is_first_sample: false,
        category_change_summary: '春季首次采集判定为A类疑似新亚种，本次秋季复测后归属调整为B类环境胁迫'
      },
      triage_status: '待分诊',
      triage_result: null,
      triage_note: null,
      deadline: null,
      responsible_id: 2,
      close_reason: null,
      close_note: null,
      created_at: createdAt(3, 8),
      triaged_at: null
    },
    {
      id: 3,
      specimen_no: 'LC-2026-0078',
      species: '黄髓叶梅衣',
      collection_location: '横断山脉-贡嘎山-东坡',
      collection_coords: '29.6252, 101.9270',
      altitude: 3250,
      substrate: '酸性岩石（花岗岩）',
      spore_density: '偏高（均值的1.8倍）',
      humidity_exposure: '中度暴露（林缘）',
      micro_slide: '孢子形态正常但数量偏多，子囊结构完整',
      collection_date: '2026-06-10',
      collector: '李雪梅',
      abnormal_type: '孢子密度异常',
      abnormal_desc: '距离0012号采集点约50米，夏季标本孢子数偏高，位于异常聚集区内',
      belong_category: '待判定',
      triage_status: '处理中',
      triage_result: '需补证',
      triage_note: '建议补充该样方的微环境数据，包括土壤pH、光照时长等',
      deadline: addDays(5),
      responsible_id: 2,
      close_reason: null,
      close_note: null,
      created_at: createdAt(7, 4),
      triaged_at: createdAt(2, 1)
    },
    {
      id: 4,
      specimen_no: 'LC-2026-0091',
      species: '黄髓叶梅衣（近缘种）',
      collection_location: '横断山脉-贡嘎山-西坡',
      collection_coords: '29.6230, 101.9180',
      altitude: 3180,
      substrate: '微碱性岩石（片麻岩）',
      spore_density: '异常偏高（均值的2.9倍）',
      humidity_exposure: '弱度暴露（林下）',
      micro_slide: '孢子大小变异系数达45%，正常范围<20%',
      collection_date: '2026-04-05',
      collector: '陈思琪',
      abnormal_type: '孢子密度异常',
      abnormal_desc: '西坡同海拔对比样，基质pH不同（片麻岩vs花岗岩），但孢子密度同样异常，排除单一基质因素',
      belong_category: '待判定',
      triage_status: '待分诊',
      triage_result: null,
      triage_note: null,
      deadline: null,
      responsible_id: 1,
      close_reason: null,
      close_note: null,
      created_at: createdAt(6, 10),
      triaged_at: null
    },
    {
      id: 5,
      specimen_no: 'LC-2026-0203',
      species: '拟金丝带',
      collection_location: '云南-玉龙雪山-云杉坪',
      collection_coords: '27.1056, 100.2233',
      altitude: 3450,
      substrate: '树皮（丽江云杉）',
      spore_density: '正常',
      humidity_exposure: '异常高湿（相对湿度95%+，连续阴雨12天）',
      micro_slide: '菌丝膨胀变形，叶绿体破损率约60%，共生藻层大面积损伤',
      collection_date: '2026-07-18',
      collector: '张明远',
      abnormal_type: '湿度暴露异常',
      abnormal_desc: '罕见持续强降雨后采集，高湿导致共生藻层大面积损伤，该种通常适应湿度波动但此次超出阈值',
      belong_category: 'C类-生境异常',
      triage_status: '处理中',
      triage_result: '需复核',
      triage_note: '建议一周后回访同一样方，观察恢复情况并采集平行样',
      deadline: addDays(3),
      responsible_id: 3,
      close_reason: null,
      close_note: null,
      created_at: createdAt(4, 6),
      triaged_at: createdAt(1, 12)
    },
    {
      id: 6,
      specimen_no: 'LC-2026-0211',
      species: '拟金丝带',
      collection_location: '云南-玉龙雪山-牦牛坪',
      collection_coords: '27.1189, 100.2156',
      altitude: 3600,
      substrate: '树皮（丽江云杉）',
      spore_density: '正常',
      humidity_exposure: '高湿（相对湿度88%）',
      micro_slide: '部分菌丝空泡化，叶绿体轻度损伤（约20%）',
      collection_date: '2026-07-20',
      collector: '张明远',
      abnormal_type: '湿度暴露异常',
      abnormal_desc: '相邻区域（直线距离约2km）海拔略高，高湿导致菌丝轻度损伤，损伤程度与海拔呈负相关趋势',
      belong_category: 'C类-生境异常',
      triage_status: '待分诊',
      triage_result: null,
      triage_note: null,
      deadline: null,
      responsible_id: 3,
      close_reason: null,
      close_note: null,
      created_at: createdAt(4, 3),
      triaged_at: null
    },
    {
      id: 7,
      specimen_no: 'LC-2026-0256',
      species: '金丝带',
      collection_location: '四川-四姑娘山-长坪沟',
      collection_coords: '31.0897, 102.9123',
      altitude: 3550,
      substrate: '树皮（冷杉）',
      spore_density: '正常',
      humidity_exposure: '异常高湿（相对湿度92%）',
      micro_slide: '藻细胞溶解，菌丝断裂，结构完整性受损',
      collection_date: '2026-08-02',
      collector: '李雪梅',
      abnormal_type: '湿度暴露异常',
      abnormal_desc: '与拟金丝带同属不同种，西南高海拔山地高湿生境下出现类似损伤模式，跨种一致性显著',
      belong_category: '待判定',
      triage_status: '待分诊',
      triage_result: null,
      triage_note: null,
      deadline: null,
      responsible_id: 2,
      close_reason: null,
      close_note: null,
      created_at: createdAt(2, 14),
      triaged_at: null
    },
    {
      id: 8,
      specimen_no: 'LC-2026-0301',
      species: '大花松萝',
      collection_location: '西藏-林芝-鲁朗',
      collection_coords: '29.7688, 94.7645',
      altitude: 3700,
      substrate: '苔藓层附生',
      spore_density: '正常',
      humidity_exposure: '正常',
      micro_slide: '地衣体结构中发现不明真菌菌丝体，疑似寄生真菌感染，分布于髓层',
      collection_date: '2026-05-12',
      collector: '王建国',
      abnormal_type: '显微切片异常',
      abnormal_desc: '疑似寄生真菌感染，需进一步分离培养鉴定菌种，评估对宿主种群的影响',
      belong_category: '待判定',
      triage_status: '待分诊',
      triage_result: null,
      triage_note: null,
      deadline: null,
      responsible_id: 4,
      close_reason: null,
      close_note: null,
      created_at: createdAt(8, 1),
      triaged_at: null
    },
    {
      id: 9,
      specimen_no: 'LC-2026-0334',
      species: '裂芽梅衣',
      collection_location: '青海-祁连山-冰沟',
      collection_coords: '37.9234, 101.5678',
      altitude: 3950,
      substrate: '高山草甸土壤',
      spore_density: '偏低（均值的0.4倍）',
      humidity_exposure: '强度暴露（开阔地，强紫外线）',
      micro_slide: '孢子数量稀少但形态正常，发育进程滞后',
      collection_date: '2026-06-28',
      collector: '陈思琪',
      abnormal_type: '海拔+孢子密度异常',
      abnormal_desc: '采自该种已知分布上限以上200米（原记录上限3750m），种群稀疏且孢子产量显著降低，疑似极端生境边缘种群',
      belong_category: '待判定',
      triage_status: '已关闭',
      triage_result: '误报',
      triage_note: '经复核，该分布点已有2023年馆藏记录（标本馆编号QH-2023-0456），属于已知分布范围。孢子密度偏低为高海拔正常表现',
      deadline: null,
      responsible_id: 5,
      close_reason: '数据录入错误',
      close_note: '分布上限数据未及时更新，已同步至标本数据库',
      created_at: createdAt(10, 5),
      triaged_at: createdAt(8, 2)
    },
    {
      id: 10,
      specimen_no: 'LC-2026-0412',
      species: '地图衣（未知种）',
      collection_location: '新疆-天山-天池西岸',
      collection_coords: '43.8956, 88.1234',
      altitude: 2100,
      substrate: '钙质岩石（石灰岩）',
      spore_density: '异常偏低',
      humidity_exposure: '正常',
      micro_slide: '子囊盘结构与已知种均不匹配，子囊孢子壁纹饰独特，8孢/子囊但排列方式异常',
      collection_date: '2026-07-08',
      collector: '刘浩然',
      abnormal_type: '孢子形态+结构异常',
      abnormal_desc: '疑似地图衣属新种（Rhizocarpon sp. nov.），与近缘种R. geographicum和R. lecanorinum均有显著形态差异，需DNA条形码确认',
      belong_category: 'D类-疑似新种',
      triage_status: '处理中',
      triage_result: '需复核',
      triage_note: '已安排与俄罗斯科学院地衣实验室联合复核，需补充ITS和nuLSU序列数据',
      deadline: addDays(14),
      responsible_id: 1,
      close_reason: null,
      close_note: null,
      created_at: createdAt(1, 9),
      triaged_at: createdAt(0, 20)
    },
    {
      id: 11,
      specimen_no: 'LC-2026-0445',
      species: '针芽肺衣',
      collection_location: '内蒙古-大兴安岭-莫尔道嘎',
      collection_coords: '51.2678, 120.7543',
      altitude: 850,
      substrate: '树皮（兴安落叶松）',
      spore_density: '正常',
      humidity_exposure: '正常',
      micro_slide: '共生藻细胞形态异常，藻层中检测到两种不同形态的绿藻细胞，疑似杂藻污染或共生藻替换',
      collection_date: '2026-08-15',
      collector: '张明远',
      abnormal_type: '显微切片异常',
      abnormal_desc: '肺衣属共生藻通常为单一Trebouxia属，此次发现两种不同形态藻细胞共存，需进一步荧光原位杂交确认',
      belong_category: '待判定',
      triage_status: '待分诊',
      triage_result: null,
      triage_note: null,
      deadline: null,
      responsible_id: 3,
      close_reason: null,
      close_note: null,
      created_at: createdAt(1, 3),
      triaged_at: null
    },
    {
      id: 12,
      specimen_no: 'LC-2026-0498',
      species: '网脊肺衣',
      collection_location: '浙江-天目山-仙人顶',
      collection_coords: '30.3245, 119.4456',
      altitude: 1500,
      substrate: '落叶腐殖层',
      spore_density: '偏高（均值的2.1倍）',
      humidity_exposure: '偏高（相对湿度82%）',
      micro_slide: '多指标联合异常：孢子偏大（+35%）+ 髓层菌丝异常增生 + 皮层色素沉积异常',
      collection_date: '2026-09-10',
      collector: '李雪梅',
      abnormal_type: '多指标联合异常',
      abnormal_desc: '华东低海拔地区罕见肺衣属异常表现，该种通常分布于1800m以上山地，此次在1500m发现且多指标偏离，疑为气候变化下的分布下移伴随的生理调整',
      belong_category: '待判定',
      triage_status: '待分诊',
      triage_result: null,
      triage_note: null,
      deadline: null,
      responsible_id: 5,
      close_reason: null,
      close_note: null,
      created_at: createdAt(0, 18),
      triaged_at: null
    }
  ];

  const similarCaseLinks = [
    { id: 1, specimen_a: 1, specimen_b: 2, similarity_score: 0.97, similarity_reason: '完全同一采集点（横断山脉-贡嘎山-东坡3200m，坐标完全重合）同一物种，跨春/秋两季复测，孢子密度均异常偏高。注意：0012原归属A类疑似新亚种，0145复测后更倾向B类环境胁迫，归属变化需重点关注' },
    { id: 2, specimen_a: 1, specimen_b: 3, similarity_score: 0.89, similarity_reason: '同一东坡区域，相距仅约50米，海拔接近（3200/3250m），同种花岗岩基质，孢子密度均偏高，构成同一异常聚集区' },
    { id: 3, specimen_a: 1, specimen_b: 4, similarity_score: 0.83, similarity_reason: '贡嘎山东西坡对比，同种近缘，海拔接近（3200/3180m），虽基质pH不同（酸/微碱）但孢子密度异常模式高度相似，排除单一基质因素' },
    { id: 4, specimen_a: 2, specimen_b: 3, similarity_score: 0.86, similarity_reason: '同一山脉东坡，相同花岗岩基质，孢子密度异常表现一致，0145与0078为同区域不同季节/微海拔的关联异常' },
    { id: 5, specimen_a: 2, specimen_b: 4, similarity_score: 0.80, similarity_reason: '跨坡向对比，孢子均表现为密度异常+形态变异的组合异常，具有区域共性' },
    { id: 6, specimen_a: 3, specimen_b: 4, similarity_score: 0.78, similarity_reason: '贡嘎山区域同种孢子异常聚集现象，建议作为整体区域异常课题研究' },
    { id: 7, specimen_a: 5, specimen_b: 6, similarity_score: 0.91, similarity_reason: '玉龙雪山相邻区域（相距约2km），同种同云杉树皮基质，同期高湿事件导致的梯度损伤，损伤程度与海拔/微生境相关' },
    { id: 8, specimen_a: 5, specimen_b: 7, similarity_score: 0.79, similarity_reason: '同属（金丝带属）不同种（拟金丝带/金丝带），西南高海拔山地不同山系，高湿生境导致的菌丝损伤模式高度一致，跨种跨区域共性' },
    { id: 9, specimen_a: 6, specimen_b: 7, similarity_score: 0.75, similarity_reason: '高湿致伤模式在金丝带属内的跨种一致性，可作为属级生境胁迫响应特征' }
  ];

  const triageRecords = [
    { id: 1, specimen_id: 1, action: '创建', detail: '系统导入异常标本数据，初始状态：待分诊。标记为贡嘎山孢子异常组核心样本', operator: 'system', created_at: createdAt(5, 2) },
    { id: 2, specimen_id: 2, action: '创建', detail: '跨季节复测标本：关联LC-2026-0012，同一坐标点。重点关注归属变化：春季0012归A类疑似新亚种，秋季0145复测表现更符合B类环境胁迫，需分诊确认是否调整分类', operator: 'system', created_at: createdAt(3, 8) },
    { id: 3, specimen_id: 5, action: '创建', detail: '高湿损伤组首条记录，已预分类C类-生境异常。玉龙雪山2026年雨季异常气候事件关联样本', operator: 'system', created_at: createdAt(4, 6) },
    { id: 4, specimen_id: 6, action: '创建', detail: '与LC-2026-0203关联，玉龙雪山高湿组平行样，构成梯度损伤对比', operator: 'system', created_at: createdAt(4, 3) },
    { id: 5, specimen_id: 10, action: '创建', detail: '疑似新种标记，D类优先级，需专家联合复核', operator: 'system', created_at: createdAt(1, 9) },
    { id: 6, specimen_id: 3, action: '分诊', detail: '分诊判定：需补证；备注：建议补充该样方的微环境数据，包括土壤pH、光照时长等；处理时限：' + addDays(5), operator: '当前用户', created_at: createdAt(2, 1) },
    { id: 7, specimen_id: 5, action: '分诊', detail: '分诊判定：需复核；备注：建议一周后回访同一样方，观察恢复情况并采集平行样；处理时限：' + addDays(3), operator: '当前用户', created_at: createdAt(1, 12) },
    { id: 8, specimen_id: 9, action: '分诊', detail: '分诊判定：误报；备注：经复核，该分布点已有2023年馆藏记录（标本馆编号QH-2023-0456），属于已知分布范围。孢子密度偏低为高海拔正常表现；关闭原因：数据录入错误；补充说明：分布上限数据未及时更新，已同步至标本数据库', operator: '当前用户', created_at: createdAt(8, 2) },
    { id: 9, specimen_id: 3, action: '改派', detail: '改派至：李雪梅（标本鉴定师）；原因：该区域为李雪梅夏季实地采样，熟悉现场情况', operator: '当前用户', created_at: createdAt(2, 0) },
    { id: 10, specimen_id: 10, action: '分诊', detail: '分诊判定：需复核；备注：已安排与俄罗斯科学院地衣实验室联合复核，需补充ITS和nuLSU序列数据；处理时限：' + addDays(14), operator: '当前用户', created_at: createdAt(0, 20) }
  ];

  const data = { responsiblePersons, specimens, similarCaseLinks, triageRecords, _meta: { nextSpecimenId: 13, nextRecordId: 11, nextLinkId: 10, initializedAt: nowISO() } };
  saveData(data);
  console.log('预置数据初始化完成：12条异常标本、9组相似案例关联（贡嘎山组4条、金丝带组3条互为相似）');
  return data;
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

app.get('/api/stats', (req, res) => {
  const data = loadData();
  const total = data.specimens.length;
  const pending = data.specimens.filter(s => s.triage_status === '待分诊').length;
  const processing = data.specimens.filter(s => s.triage_status === '处理中').length;
  const closed = data.specimens.filter(s => s.triage_status === '已关闭').length;
  const resultMap = {};
  data.specimens.forEach(s => {
    if (s.triage_result) resultMap[s.triage_result] = (resultMap[s.triage_result] || 0) + 1;
  });
  const result = Object.entries(resultMap).map(([k, v]) => ({ triage_result: k, c: v }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const warnLimit = new Date(today);
  warnLimit.setDate(warnLimit.getDate() + 3);
  const deadlineWarning = data.specimens.filter(s => {
    if (s.triage_status === '已关闭' || !s.deadline) return false;
    const dl = new Date(s.deadline);
    return dl <= warnLimit;
  }).length;

  res.json({ total, pending, processing, closed, result, deadlineWarning });
});

app.get('/api/specimens/queue', (req, res) => {
  const data = loadData();
  const { status } = req.query;
  let list = data.specimens.slice();
  if (status) list = list.filter(s => s.triage_status === status);
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const result = list.map(s => {
    const r = data.responsiblePersons.find(p => p.id === s.responsible_id);
    return { ...s, responsible_name: r ? r.name : null, responsible_role: r ? r.role : null };
  });
  res.json(result);
});

app.get('/api/specimens/:id', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const s = data.specimens.find(x => x.id === id);
  if (!s) return res.status(404).json({ error: '标本未找到' });

  const r = data.responsiblePersons.find(p => p.id === s.responsible_id);
  const records = data.triageRecords
    .filter(t => t.specimen_id === id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const similar = data.similarCaseLinks
    .filter(l => l.specimen_a === id || l.specimen_b === id)
    .map(l => {
      const similarId = l.specimen_a === id ? l.specimen_b : l.specimen_a;
      const simSpec = data.specimens.find(x => x.id === similarId);
      if (!simSpec) return null;
      return {
        similar_id: similarId,
        similarity_score: l.similarity_score,
        similarity_reason: l.similarity_reason,
        specimen_no: simSpec.specimen_no,
        species: simSpec.species,
        collection_location: simSpec.collection_location,
        altitude: simSpec.altitude,
        substrate: simSpec.substrate,
        triage_status: simSpec.triage_status,
        triage_result: simSpec.triage_result,
        belong_category: simSpec.belong_category
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.similarity_score - a.similarity_score);

  let retest_comparison = null;
  if (s.retest_group) {
    const paired = data.specimens.find(x => x.id === s.retest_group.paired_specimen_id);
    if (paired) {
      const firstSample = s.retest_group.is_first_sample ? s : paired;
      const secondSample = s.retest_group.is_first_sample ? paired : s;
      retest_comparison = {
        group_id: s.retest_group.group_id,
        group_name: s.retest_group.group_name,
        current_season: s.retest_group.season,
        category_change_summary: s.retest_group.category_change_summary,
        paired_specimen_no: paired.specimen_no,
        paired_season: paired.retest_group ? paired.retest_group.season : '未知',
        first: {
          specimen_no: firstSample.specimen_no,
          season: firstSample.retest_group ? firstSample.retest_group.season : '春季',
          collection_date: firstSample.collection_date,
          collector: firstSample.collector,
          abnormal_type: firstSample.abnormal_type,
          belong_category: firstSample.belong_category,
          spore_density: firstSample.spore_density,
          micro_slide: firstSample.micro_slide,
          triage_status: firstSample.triage_status,
          triage_result: firstSample.triage_result
        },
        second: {
          specimen_no: secondSample.specimen_no,
          season: secondSample.retest_group ? secondSample.retest_group.season : '秋季',
          collection_date: secondSample.collection_date,
          collector: secondSample.collector,
          abnormal_type: secondSample.abnormal_type,
          belong_category: secondSample.belong_category,
          spore_density: secondSample.spore_density,
          micro_slide: secondSample.micro_slide,
          triage_status: secondSample.triage_status,
          triage_result: secondSample.triage_result
        },
        category_change: {
          from: firstSample.belong_category,
          to: secondSample.belong_category,
          changed: firstSample.belong_category !== secondSample.belong_category
        },
        shared_context: {
          species: s.species,
          collection_location: s.collection_location,
          collection_coords: s.collection_coords,
          altitude: s.altitude,
          substrate: s.substrate,
          humidity_exposure: s.humidity_exposure
        },
        key_differences: [
          { field: '异常类型', first: firstSample.abnormal_type, second: secondSample.abnormal_type },
          { field: '孢子密度', first: firstSample.spore_density, second: secondSample.spore_density },
          { field: '显微切片', first: firstSample.micro_slide, second: secondSample.micro_slide },
          { field: '采集人', first: firstSample.collector, second: secondSample.collector }
        ]
      };
    }
  }

  res.json({
    ...s,
    responsible_name: r ? r.name : null,
    responsible_role: r ? r.role : null,
    triage_records: records,
    similar_cases: similar,
    retest_comparison
  });
});

app.get('/api/responsible-persons', (req, res) => {
  const data = loadData();
  const list = data.responsiblePersons.slice().sort((a, b) => {
    if (a.status !== b.status) return a.status === '在岗' ? -1 : 1;
    return a.name.localeCompare(b.name, 'zh');
  });
  res.json(list);
});

app.post('/api/specimens/:id/triage', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const idx = data.specimens.findIndex(x => x.id === id);
  if (idx < 0) return res.status(404).json({ error: '标本未找到' });

  const { result, note, deadline, close_reason, close_note, operator } = req.body;
  const validResults = ['误报', '需补证', '需复核', '已确认'];
  if (result && !validResults.includes(result)) {
    return res.status(400).json({ error: '无效的分诊判定' });
  }

  const spec = data.specimens[idx];
  let status = spec.triage_status;
  if (result) {
    status = (result === '误报' || result === '已确认') ? '已关闭' : '处理中';
    spec.triage_result = result;
    spec.triage_status = status;
  }
  if (note !== undefined) spec.triage_note = note || null;
  if (deadline !== undefined) spec.deadline = deadline || null;
  if (close_reason !== undefined) spec.close_reason = close_reason || null;
  if (close_note !== undefined) spec.close_note = close_note || null;
  spec.triaged_at = nowISO();

  let detailParts = [];
  if (result) detailParts.push(`分诊判定：${result}`);
  if (note) detailParts.push(`备注：${note}`);
  if (deadline) detailParts.push(`处理时限：${deadline}`);
  if (close_reason) detailParts.push(`关闭原因：${close_reason}`);
  if (close_note && detailParts.length) detailParts.push(`补充说明：${close_note}`);
  if (detailParts.length === 0 && deadline) detailParts.push(`处理时限更新为：${deadline}`);

  if (detailParts.length > 0) {
    const record = {
      id: data._meta.nextRecordId++,
      specimen_id: id,
      action: '分诊',
      detail: detailParts.join('；'),
      operator: operator || 'system',
      created_at: nowISO()
    };
    data.triageRecords.push(record);
  }

  data.specimens[idx] = spec;
  saveData(data);

  const r = data.responsiblePersons.find(p => p.id === spec.responsible_id);
  res.json({ ...spec, responsible_name: r ? r.name : null, responsible_role: r ? r.role : null });
});

app.post('/api/specimens/:id/reassign', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const idx = data.specimens.findIndex(x => x.id === id);
  if (idx < 0) return res.status(404).json({ error: '标本未找到' });

  const { responsible_id, reason, operator } = req.body;
  if (!responsible_id) return res.status(400).json({ error: '请选择责任人' });

  const person = data.responsiblePersons.find(p => p.id === responsible_id);
  if (!person) return res.status(404).json({ error: '责任人不存在' });

  data.specimens[idx].responsible_id = responsible_id;

  const record = {
    id: data._meta.nextRecordId++,
    specimen_id: id,
    action: '改派',
    detail: `改派至：${person.name}（${person.role}）；原因：${reason || '未填写'}`,
    operator: operator || 'system',
    created_at: nowISO()
  };
  data.triageRecords.push(record);

  saveData(data);

  const spec = data.specimens[idx];
  res.json({ ...spec, responsible_name: person.name, responsible_role: person.role });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌿 地衣标本异常分诊台服务已启动`);
  console.log(`📡 访问地址: http://localhost:${PORT}`);
});

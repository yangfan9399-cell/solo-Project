import type { AffectedSample } from '../../shared/types';

export const samples: AffectedSample[] = [
  {
    id: 'smp-clarity-001',
    packageId: 'pkg-clarity-001',
    sampleName: '西安碑林唐井铭拓片',
    sampleCode: 'XA-BL-001',
    status: 'locked',
    reason: '正在进行人工复核，暂不参与新版本计算',
    affectedAt: '2025-06-11T09:30:00Z',
    resolver: '李文博'
  },
  {
    id: 'smp-clarity-002',
    packageId: 'pkg-clarity-001',
    sampleName: '洛阳出土隋代井栏拓片',
    sampleCode: 'LY-CW-023',
    status: 'conflict',
    reason: '新旧版本清晰度评级差异超过2级，需人工确认',
    affectedAt: '2025-06-11T10:15:00Z'
  },
  {
    id: 'smp-clarity-003',
    packageId: 'pkg-clarity-001',
    sampleName: '大同北魏古井拓片',
    sampleCode: 'DT-BW-045',
    status: 'recalc_needed',
    reason: '低光照增强算法更新后需重新计算评分',
    affectedAt: '2025-06-10T14:30:00Z'
  },
  {
    id: 'smp-clarity-004',
    packageId: 'pkg-clarity-001',
    sampleName: '邺城遗址东魏井铭',
    sampleCode: 'YC-YZ-067',
    status: 'normal',
    reason: '新版本评估结果与人工一致，无异常',
    affectedAt: '2025-06-10T15:00:00Z'
  },
  {
    id: 'smp-clarity-005',
    packageId: 'pkg-clarity-001',
    sampleName: '太原晋祠宋井拓片',
    sampleCode: 'TY-JC-089',
    status: 'recalc_needed',
    reason: '局部清晰度检测功能启用，需重新生成热力图',
    affectedAt: '2025-06-10T15:45:00Z'
  },
  {
    id: 'smp-clarity-006',
    packageId: 'pkg-clarity-001',
    sampleName: '开封龙亭古井拓片',
    sampleCode: 'KF-LT-101',
    status: 'conflict',
    reason: '边缘区域误判修复后评级变化，待确认',
    affectedAt: '2025-06-11T08:20:00Z'
  },
  {
    id: 'smp-clarity-007',
    packageId: 'pkg-clarity-001',
    sampleName: '杭州西湖明井铭',
    sampleCode: 'HZ-XH-112',
    status: 'locked',
    reason: '文物出借展览期间，数据锁定',
    affectedAt: '2025-06-09T11:00:00Z',
    resolver: '张馆长'
  },
  {
    id: 'smp-clarity-008',
    packageId: 'pkg-clarity-001',
    sampleName: '成都武侯祠古井',
    sampleCode: 'CD-WH-134',
    status: 'recalc_needed',
    reason: '训练样本更新后需重新评估',
    affectedAt: '2025-06-10T16:30:00Z'
  },
  {
    id: 'smp-clarity-009',
    packageId: 'pkg-clarity-001',
    sampleName: '苏州园林清代井栏',
    sampleCode: 'SZ-YL-156',
    status: 'normal',
    reason: '新版本评分与历史数据吻合',
    affectedAt: '2025-06-10T17:00:00Z'
  },
  {
    id: 'smp-clarity-010',
    packageId: 'pkg-clarity-001',
    sampleName: '南京明孝陵井铭',
    sampleCode: 'NJ-MX-178',
    status: 'conflict',
    reason: '低光照处理前后评级差异较大',
    affectedAt: '2025-06-11T09:00:00Z'
  },
  {
    id: 'smp-clarity-011',
    packageId: 'pkg-clarity-001',
    sampleName: '武汉黄鹤楼古井',
    sampleCode: 'WH-HL-201',
    status: 'recalc_needed',
    reason: '新增训练样本包含相似类型，需重算',
    affectedAt: '2025-06-10T14:45:00Z'
  },
  {
    id: 'smp-clarity-012',
    packageId: 'pkg-clarity-001',
    sampleName: '南昌滕王阁井铭',
    sampleCode: 'NC-TW-223',
    status: 'normal',
    reason: '清晰度评估结果稳定',
    affectedAt: '2025-06-10T15:30:00Z'
  },
  {
    id: 'smp-clarity-013',
    packageId: 'pkg-clarity-001',
    sampleName: '长沙岳麓山古井',
    sampleCode: 'CS-YL-245',
    status: 'locked',
    reason: '正在进行文物修复工作，数据冻结',
    affectedAt: '2025-06-08T10:00:00Z',
    resolver: '修复科'
  },
  {
    id: 'smp-clarity-014',
    packageId: 'pkg-clarity-001',
    sampleName: '福州三坊七巷井栏',
    sampleCode: 'FZ-SF-267',
    status: 'recalc_needed',
    reason: '局部清晰度算法优化后需重新计算',
    affectedAt: '2025-06-10T16:00:00Z'
  },
  {
    id: 'smp-clarity-015',
    packageId: 'pkg-clarity-001',
    sampleName: '广州南越王宫井铭',
    sampleCode: 'GZ-NY-289',
    status: 'conflict',
    reason: '新旧版本对模糊类型判断不一致',
    affectedAt: '2025-06-11T11:30:00Z'
  },
  {
    id: 'smp-clarity-016',
    packageId: 'pkg-clarity-001',
    sampleName: '桂林独秀峰古井',
    sampleCode: 'GL-DX-301',
    status: 'normal',
    reason: '评估结果无异常',
    affectedAt: '2025-06-10T17:15:00Z'
  },
  {
    id: 'smp-clarity-017',
    packageId: 'pkg-clarity-001',
    sampleName: '昆明大观楼井铭',
    sampleCode: 'KM-DG-323',
    status: 'recalc_needed',
    reason: '低光照增强模块更新后需重算',
    affectedAt: '2025-06-10T14:20:00Z'
  },
  {
    id: 'smp-clarity-018',
    packageId: 'pkg-clarity-001',
    sampleName: '贵阳甲秀楼古井',
    sampleCode: 'GY-JX-345',
    status: 'normal',
    reason: '新版本评分正常',
    affectedAt: '2025-06-10T16:45:00Z'
  },
  {
    id: 'smp-clarity-019',
    packageId: 'pkg-clarity-001',
    sampleName: '成都杜甫草堂井栏',
    sampleCode: 'CD-DF-367',
    status: 'conflict',
    reason: '边缘区域清晰度评级存在争议',
    affectedAt: '2025-06-11T10:45:00Z'
  },
  {
    id: 'smp-clarity-020',
    packageId: 'pkg-clarity-001',
    sampleName: '拉萨布达拉宫古井',
    sampleCode: 'LS-BD-389',
    status: 'locked',
    reason: '特殊文物，需专人审核后才能更新',
    affectedAt: '2025-06-07T15:00:00Z',
    resolver: '文保中心'
  },
  {
    id: 'smp-clarity-021',
    packageId: 'pkg-clarity-001',
    sampleName: '呼和浩特昭君墓井铭',
    sampleCode: 'HT-ZJ-401',
    status: 'recalc_needed',
    reason: '模型参数调整后需重新计算',
    affectedAt: '2025-06-10T15:15:00Z'
  },
  {
    id: 'smp-clarity-022',
    packageId: 'pkg-clarity-001',
    sampleName: '沈阳故宫古井',
    sampleCode: 'SY-GG-423',
    status: 'normal',
    reason: '清晰度评级稳定',
    affectedAt: '2025-06-10T17:30:00Z'
  },
  {
    id: 'smp-clarity-023',
    packageId: 'pkg-clarity-001',
    sampleName: '长春伪满皇宫井栏',
    sampleCode: 'CC-WM-445',
    status: 'conflict',
    reason: '低光照拓片处理结果与人工判断有差异',
    affectedAt: '2025-06-11T08:45:00Z'
  },
  {
    id: 'smp-rust-001',
    packageId: 'pkg-rust-level-002',
    sampleName: '湖北曾侯乙墓铜井圈',
    sampleCode: 'HB-ZH-001',
    status: 'locked',
    reason: '一级文物，锈蚀检测需专家在场',
    affectedAt: '2025-06-10T09:00:00Z',
    resolver: '考古队'
  },
  {
    id: 'smp-rust-002',
    packageId: 'pkg-rust-level-002',
    sampleName: '河南殷墟商代铜井',
    sampleCode: 'HN-YX-012',
    status: 'conflict',
    reason: '锈蚀类型判断不一致，需进一步检测',
    affectedAt: '2025-06-11T11:00:00Z'
  },
  {
    id: 'smp-rust-003',
    packageId: 'pkg-rust-level-002',
    sampleName: '陕西法门寺唐代井栏',
    sampleCode: 'SX-FM-023',
    status: 'recalc_needed',
    reason: '锈蚀预测模型更新后需重新计算',
    affectedAt: '2025-06-12T14:30:00Z'
  },
  {
    id: 'smp-rust-004',
    packageId: 'pkg-rust-level-002',
    sampleName: '江苏南京明故宫铜井',
    sampleCode: 'JS-MG-034',
    status: 'normal',
    reason: '锈蚀级别评估结果一致',
    affectedAt: '2025-06-12T15:00:00Z'
  },
  {
    id: 'smp-rust-005',
    packageId: 'pkg-rust-level-002',
    sampleName: '四川三星堆青铜井饰',
    sampleCode: 'SC-SD-045',
    status: 'conflict',
    reason: '青铜器与铁器锈蚀混淆，需人工判定',
    affectedAt: '2025-06-11T14:20:00Z'
  },
  {
    id: 'smp-rust-006',
    packageId: 'pkg-rust-level-002',
    sampleName: '浙江绍兴越王允常墓',
    sampleCode: 'ZJ-SX-056',
    status: 'recalc_needed',
    reason: '保存建议库更新后需重新生成报告',
    affectedAt: '2025-06-12T16:00:00Z'
  },
  {
    id: 'smp-rust-007',
    packageId: 'pkg-rust-level-002',
    sampleName: '安徽寿县楚王墓铜井',
    sampleCode: 'AH-SX-067',
    status: 'locked',
    reason: '正在进行现场保护处理，数据锁定',
    affectedAt: '2025-06-09T10:30:00Z',
    resolver: '保护科'
  },
  {
    id: 'smp-rust-008',
    packageId: 'pkg-rust-level-002',
    sampleName: '江西海昏侯墓铜器',
    sampleCode: 'JX-HH-078',
    status: 'normal',
    reason: '锈蚀程度评估稳定',
    affectedAt: '2025-06-12T15:30:00Z'
  },
  {
    id: 'smp-rust-009',
    packageId: 'pkg-rust-level-002',
    sampleName: '湖南马王堆汉墓井栏',
    sampleCode: 'HN-MW-089',
    status: 'conflict',
    reason: '锈蚀发展趋势预测与实际观测有差异',
    affectedAt: '2025-06-11T16:45:00Z'
  },
  {
    id: 'smp-rust-010',
    packageId: 'pkg-rust-level-002',
    sampleName: '福建泉州开元寺古井',
    sampleCode: 'FJ-QZ-100',
    status: 'recalc_needed',
    reason: '新增年份维度统计，需重新计算数据',
    affectedAt: '2025-06-12T13:45:00Z'
  },
  {
    id: 'smp-rust-011',
    packageId: 'pkg-rust-level-002',
    sampleName: '广东南越王墓铜器',
    sampleCode: 'GD-NY-111',
    status: 'normal',
    reason: '检测结果与之前一致',
    affectedAt: '2025-06-12T14:15:00Z'
  },
  {
    id: 'smp-rust-012',
    packageId: 'pkg-rust-level-002',
    sampleName: '广西合浦汉墓群井栏',
    sampleCode: 'GX-HP-122',
    status: 'locked',
    reason: '文物出土后暂存，数据待确认',
    affectedAt: '2025-06-08T11:00:00Z',
    resolver: '考古队'
  },
  {
    id: 'smp-rust-013',
    packageId: 'pkg-rust-level-002',
    sampleName: '云南晋宁石寨山古墓',
    sampleCode: 'YN-JN-133',
    status: 'conflict',
    reason: '锈蚀边界检测精度有争议',
    affectedAt: '2025-06-11T09:30:00Z'
  },
  {
    id: 'smp-rust-014',
    packageId: 'pkg-rust-level-002',
    sampleName: '贵州遵义海龙屯井铭',
    sampleCode: 'GZ-ZY-144',
    status: 'recalc_needed',
    reason: '验证样本更新后需重新评估模型',
    affectedAt: '2025-06-12T15:15:00Z'
  },
  {
    id: 'smp-rust-015',
    packageId: 'pkg-rust-level-002',
    sampleName: '四川成都金沙遗址',
    sampleCode: 'SC-JS-155',
    status: 'normal',
    reason: '金器锈蚀检测结果正常',
    affectedAt: '2025-06-12T16:30:00Z'
  },
  {
    id: 'smp-rust-016',
    packageId: 'pkg-rust-level-002',
    sampleName: '陕西秦始皇陵铜井',
    sampleCode: 'SX-QS-166',
    status: 'locked',
    reason: '特级文物，数据访问受限',
    affectedAt: '2025-06-01T09:00:00Z',
    resolver: '文物局'
  },
  {
    id: 'smp-rust-017',
    packageId: 'pkg-rust-level-002',
    sampleName: '山东临淄齐国故城',
    sampleCode: 'SD-LZ-177',
    status: 'conflict',
    reason: '锈蚀类型分类存在歧义',
    affectedAt: '2025-06-11T13:00:00Z'
  },
  {
    id: 'smp-rust-018',
    packageId: 'pkg-rust-level-002',
    sampleName: '山西太原晋侯墓地',
    sampleCode: 'SX-JH-188',
    status: 'recalc_needed',
    reason: '保存环境数据更新，需重新预测',
    affectedAt: '2025-06-12T14:00:00Z'
  },
  {
    id: 'smp-rust-019',
    packageId: 'pkg-rust-level-002',
    sampleName: '河北满城中山靖王墓',
    sampleCode: 'HB-MC-199',
    status: 'normal',
    reason: '锈蚀级别评估无变化',
    affectedAt: '2025-06-12T17:00:00Z'
  },
  {
    id: 'smp-rust-020',
    packageId: 'pkg-rust-level-002',
    sampleName: '北京大葆台汉墓铜井',
    sampleCode: 'BJ-DB-210',
    status: 'conflict',
    reason: '锈蚀发展速度预测偏高，需复核',
    affectedAt: '2025-06-11T15:30:00Z'
  },
  {
    id: 'smp-rust-021',
    packageId: 'pkg-rust-level-002',
    sampleName: '内蒙古和林格尔汉墓',
    sampleCode: 'NM-HL-221',
    status: 'recalc_needed',
    reason: '新增锈蚀类型需重新分类',
    affectedAt: '2025-06-12T13:30:00Z'
  },
  {
    id: 'smp-orient-001',
    packageId: 'pkg-orientation-004',
    sampleName: '西安汉长安城井圈',
    sampleCode: 'XA-HC-001',
    status: 'conflict',
    reason: '磁偏角校正后方位变化超过5度',
    affectedAt: '2025-06-15T10:00:00Z'
  },
  {
    id: 'smp-orient-002',
    packageId: 'pkg-orientation-004',
    sampleName: '洛阳东周王城古井',
    sampleCode: 'LY-DZ-002',
    status: 'recalc_needed',
    reason: 'GIS坐标系统整合后需重新校准',
    affectedAt: '2025-06-15T11:30:00Z'
  },
  {
    id: 'smp-orient-003',
    packageId: 'pkg-orientation-004',
    sampleName: '北京元大都井栏',
    sampleCode: 'BJ-YD-003',
    status: 'locked',
    reason: '城市建设考古现场，数据暂时锁定',
    affectedAt: '2025-06-14T09:00:00Z',
    resolver: '市文物局'
  },
  {
    id: 'smp-orient-004',
    packageId: 'pkg-orientation-004',
    sampleName: '南京明故宫井圈',
    sampleCode: 'NJ-MG-004',
    status: 'normal',
    reason: '方位计算结果与文献记载一致',
    affectedAt: '2025-06-15T14:00:00Z'
  },
  {
    id: 'smp-orient-005',
    packageId: 'pkg-orientation-004',
    sampleName: '开封北宋东京城遗址',
    sampleCode: 'KF-DJ-005',
    status: 'conflict',
    reason: '铭文方向与地理方位存在偏差',
    affectedAt: '2025-06-14T15:30:00Z'
  },
  {
    id: 'smp-orient-006',
    packageId: 'pkg-orientation-004',
    sampleName: '杭州南宋临安城古井',
    sampleCode: 'HZ-LA-006',
    status: 'recalc_needed',
    reason: '历史地磁数据更新后需重算',
    affectedAt: '2025-06-15T09:30:00Z'
  },
  {
    id: 'smp-orient-007',
    packageId: 'pkg-orientation-004',
    sampleName: '苏州平江路历史街区',
    sampleCode: 'SZ-PJ-007',
    status: 'normal',
    reason: '方位校准结果正常',
    affectedAt: '2025-06-15T13:00:00Z'
  },
  {
    id: 'smp-orient-008',
    packageId: 'pkg-orientation-004',
    sampleName: '太原晋祠圣母殿井',
    sampleCode: 'TY-SM-008',
    status: 'locked',
    reason: '文物建筑修缮期间，数据冻结',
    affectedAt: '2025-06-10T11:00:00Z',
    resolver: '古建筑保护所'
  },
  {
    id: 'smp-orient-009',
    packageId: 'pkg-orientation-004',
    sampleName: '成都都江堰古井',
    sampleCode: 'CD-DJ-009',
    status: 'conflict',
    reason: '精确角度计算与历史记录有差异',
    affectedAt: '2025-06-14T14:00:00Z'
  },
  {
    id: 'smp-orient-010',
    packageId: 'pkg-orientation-004',
    sampleName: '广州南越王宫署井',
    sampleCode: 'GZ-NY-010',
    status: 'recalc_needed',
    reason: '批量方位校准功能启用后需重算',
    affectedAt: '2025-06-15T10:45:00Z'
  },
  {
    id: 'smp-orient-011',
    packageId: 'pkg-orientation-004',
    sampleName: '长沙马王堆井圈',
    sampleCode: 'CS-MW-011',
    status: 'normal',
    reason: '井圈方位与墓葬朝向一致',
    affectedAt: '2025-06-15T15:30:00Z'
  },
  {
    id: 'smp-orient-012',
    packageId: 'pkg-orientation-004',
    sampleName: '曲阜孔庙古井',
    sampleCode: 'QF-KM-012',
    status: 'conflict',
    reason: '碑文方向与建筑轴线关系待确认',
    affectedAt: '2025-06-14T16:30:00Z'
  },
  {
    id: 'smp-ins-001',
    packageId: 'pkg-inscription-003',
    sampleName: '西安碑林唐井铭拓片',
    sampleCode: 'XA-BL-INS-001',
    status: 'conflict',
    reason: '残缺铭文补读结果与2019版人工释文冲突，姓名「文」vs「文远」、表字「士」vs「士弘」存在争议',
    affectedAt: '2025-06-13T10:20:00Z',
    resolver: '金石学专家委员会'
  },
  {
    id: 'smp-ins-002',
    packageId: 'pkg-inscription-003',
    sampleName: '洛阳出土隋代井栏铭文',
    sampleCode: 'LY-CW-INS-023',
    status: 'conflict',
    reason: '口径「三尺五寸」补读与考古实测「三尺」存在偏差，需确认铭文磨损程度与补读准确性',
    affectedAt: '2025-06-13T14:05:00Z'
  },
  {
    id: 'smp-ins-003',
    packageId: 'pkg-inscription-003',
    sampleName: '开封龙亭古井铭文',
    sampleCode: 'KF-LT-INS-101',
    status: 'recalc_needed',
    reason: '新补读建议「州署东偏」与原释文「州署东」位置描述差异，需重新生成残缺标注',
    affectedAt: '2025-06-12T11:30:00Z'
  },
  {
    id: 'smp-ins-004',
    packageId: 'pkg-inscription-003',
    sampleName: '杭州西湖明井铭',
    sampleCode: 'HZ-XH-INS-112',
    status: 'normal',
    reason: '残缺检测结果与人工释文一致，无异常',
    affectedAt: '2025-06-11T15:00:00Z'
  },
  {
    id: 'smp-ins-005',
    packageId: 'pkg-inscription-003',
    sampleName: '苏州园林清代井栏题字',
    sampleCode: 'SZ-YL-INS-156',
    status: 'locked',
    reason: '该样本为一级文物拓片，残缺补读结果需经文保专家二次审核后方可覆盖',
    affectedAt: '2025-06-10T09:45:00Z',
    resolver: '文保审核组'
  },
  {
    id: 'smp-ins-006',
    packageId: 'pkg-inscription-003',
    sampleName: '南京明孝陵井碑铭文',
    sampleCode: 'NJ-MX-INS-178',
    status: 'recalc_needed',
    reason: '铭文修复建议生成模块更新后，需重新计算12处残缺区域的置信度评分',
    affectedAt: '2025-06-13T16:20:00Z'
  },
  {
    id: 'smp-ins-007',
    packageId: 'pkg-inscription-003',
    sampleName: '北京大葆台汉墓井栏刻字',
    sampleCode: 'BJ-DB-INS-210',
    status: 'conflict',
    reason: '篆书「年」字识别结果：旧版「五凤二年」vs补读「五凤三年」，相差一年需历史学家核实',
    affectedAt: '2025-06-14T08:50:00Z'
  },
  {
    id: 'smp-ins-008',
    packageId: 'pkg-inscription-003',
    sampleName: '成都武侯祠古井题咏',
    sampleCode: 'CD-WH-INS-134',
    status: 'normal',
    reason: '残缺文字推断结果与《八琼室金石补正》记载一致',
    affectedAt: '2025-06-11T14:10:00Z'
  },
  {
    id: 'smp-ins-009',
    packageId: 'pkg-inscription-003',
    sampleName: '大同云冈石窟附近北魏井铭',
    sampleCode: 'DT-YG-INS-045',
    status: 'recalc_needed',
    reason: '同朝代铭文对照数据库补充北魏平城时期样本后，需重新比对7处残缺字',
    affectedAt: '2025-06-14T10:30:00Z'
  },
  {
    id: 'smp-ins-010',
    packageId: 'pkg-inscription-003',
    sampleName: '拉萨布达拉宫古井藏汉双语铭文',
    sampleCode: 'LS-BD-INS-389',
    status: 'locked',
    reason: '藏文残缺释读需经西藏文物局宗教事务部门审批，数据暂时锁定',
    affectedAt: '2025-06-08T13:00:00Z',
    resolver: '西藏文保中心'
  },
  {
    id: 'smp-ins-011',
    packageId: 'pkg-inscription-003',
    sampleName: '武汉黄鹤楼南宋井栏题记',
    sampleCode: 'WH-HL-INS-201',
    status: 'conflict',
    reason: '补读「淳祐十一年」与旧释文「淳祐十年」相差一年，对断代研究有影响',
    affectedAt: '2025-06-14T15:40:00Z'
  },
  {
    id: 'smp-ins-012',
    packageId: 'pkg-inscription-003',
    sampleName: '太原晋祠圣母殿井铭',
    sampleCode: 'TY-SM-INS-008',
    status: 'normal',
    reason: '残缺检测结果稳定，与历史文献吻合',
    affectedAt: '2025-06-11T13:20:00Z'
  },
  {
    id: 'smp-ins-013',
    packageId: 'pkg-inscription-003',
    sampleName: '河北满城中山靖王墓铜井铭文',
    sampleCode: 'HB-MC-INS-199',
    status: 'locked',
    reason: '特级文物考古资料，残缺补读结果需经国家文物局专家组审核',
    affectedAt: '2025-06-05T10:00:00Z',
    resolver: '国家文物局专家组'
  },
  {
    id: 'smp-ins-014',
    packageId: 'pkg-inscription-003',
    sampleName: '长沙马王堆三号墓井栏墨书',
    sampleCode: 'CS-MW-INS-011',
    status: 'recalc_needed',
    reason: '置信度评分算法升级后，需对15处疑似残缺区域重新计算置信度',
    affectedAt: '2025-06-13T09:15:00Z'
  },
  {
    id: 'smp-ins-015',
    packageId: 'pkg-inscription-003',
    sampleName: '广州南越王宫署井砖刻文',
    sampleCode: 'GZ-NY-INS-010',
    status: 'conflict',
    reason: '南越国时期古越文字符3个，补读模型推断为「番禺」，旧释为「南海」，需考古文字学家裁定',
    affectedAt: '2025-06-15T11:30:00Z'
  },
  {
    id: 'smp-ins-016',
    packageId: 'pkg-inscription-003',
    sampleName: '福州三坊七巷古井题刻',
    sampleCode: 'FZ-SF-INS-267',
    status: 'normal',
    reason: '残缺文字补读与清代《闽中金石志》记载一致',
    affectedAt: '2025-06-12T16:45:00Z'
  },
  {
    id: 'smp-ins-017',
    packageId: 'pkg-inscription-003',
    sampleName: '南昌滕王阁唐代井铭',
    sampleCode: 'NC-TW-INS-223',
    status: 'conflict',
    reason: '「上元二年」vs「上元三年」补读冲突，对王勃作序时间考证有关键影响',
    affectedAt: '2025-06-15T14:20:00Z'
  }
];

export default samples;

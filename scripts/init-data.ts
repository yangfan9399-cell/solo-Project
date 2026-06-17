import { createProject, getProjectByCode } from '../src/lib/projects';
import { createUnit, getUnitByNumber } from '../src/lib/units';
import { createRelation } from '../src/lib/relations';
import { createArtifact } from '../src/lib/artifacts';
import { createPhoto } from '../src/lib/photos';
import type { StratigraphicRelation, Artifact, Photo } from '../src/types';

const sampleProjects = [
  {
    code: 'XZ-2024-001',
    name: '西周遗址T0101探方',
    location: '陕西省西安市周原遗址',
    description: '周原遗址核心区T0101探方发掘，主要探索西周时期的聚落布局和文化层堆积。探方规格5×5米，目前已发掘至西周早期文化层。',
    startDate: '2024-03-15',
    endDate: null,
    director: '张明华',
    status: 'active' as const
  },
  {
    code: 'HN-2023-015',
    name: '汉代墓葬群M12',
    location: '河南省洛阳市邙山墓葬群',
    description: '邙山东汉墓葬群M12号墓抢救性发掘，该墓为东汉中期贵族墓葬，曾遭多次盗扰，但仍出土大量珍贵文物。',
    startDate: '2023-06-10',
    endDate: '2023-12-20',
    director: '李文博',
    status: 'completed' as const
  },
  {
    code: 'SD-2024-003',
    name: '龙山文化遗址T2',
    location: '山东省济南市城子崖遗址',
    description: '城子崖龙山文化遗址T2探方，重点研究龙山文化时期的城墙营建技术和社会结构。',
    startDate: '2024-04-01',
    endDate: null,
    director: '王建国',
    status: 'paused' as const
  }
];

const sampleUnits = {
  'XZ-2024-001': [
    {
      unitNumber: '第1层',
      type: 'layer' as const,
      designation: '表土层',
      description: '现代耕土层，含大量植物根系和近现代遗物。土质疏松，颜色较浅。',
      depthTop: 0,
      depthBottom: 0.3,
      thickness: 0.3,
      color: '黄褐色',
      texture: '砂质壤土',
      includes: '植物根系、现代瓷片、砖块',
      notes: '受现代农耕活动扰动较大',
      excavatedBy: '刘芳',
      excavationDate: '2024-03-16'
    },
    {
      unitNumber: '第2层',
      type: 'layer' as const,
      designation: '晚期文化层',
      description: '明清时期文化层，出土少量青花瓷片和砖瓦。土质较致密。',
      depthTop: 0.3,
      depthBottom: 0.7,
      thickness: 0.4,
      color: '灰褐色',
      texture: '粉砂质壤土',
      includes: '青花瓷片、布纹瓦、铁钉',
      notes: '层位较薄，分布不均',
      excavatedBy: '刘芳',
      excavationDate: '2024-03-18'
    },
    {
      unitNumber: '第3层',
      type: 'layer' as const,
      designation: '西周晚期文化层',
      description: '西周晚期文化堆积，出土大量绳纹陶片、鬲足等典型西周遗物。包含灰坑和居住面遗迹。',
      depthTop: 0.7,
      depthBottom: 1.5,
      thickness: 0.8,
      color: '深灰褐色',
      texture: '粘壤土',
      includes: '绳纹陶片、鬲足、簋残片、兽骨、炭粒',
      notes: '出土遗物丰富，含多个灰坑打破关系',
      excavatedBy: '陈刚',
      excavationDate: '2024-03-25'
    },
    {
      unitNumber: '第4层',
      type: 'layer' as const,
      designation: '西周中期文化层',
      description: '西周中期文化层，出土青铜器残片和原始瓷器。土质细腻，含红烧土颗粒。',
      depthTop: 1.5,
      depthBottom: 2.2,
      thickness: 0.7,
      color: '红褐色',
      texture: '粘质壤土',
      includes: '青铜残片、原始瓷片、卜骨、蚌器、红烧土',
      notes: '发现疑似铸铜作坊遗迹',
      excavatedBy: '陈刚',
      excavationDate: '2024-04-05'
    },
    {
      unitNumber: '第5层',
      type: 'layer' as const,
      designation: '西周早期文化层',
      description: '西周早期文化层，出土商末周初风格的陶片。层位保存较好。',
      depthTop: 2.2,
      depthBottom: 2.9,
      thickness: 0.7,
      color: '黑褐色',
      texture: '重壤土',
      includes: '陶鬲、陶簋、骨器、玉饰、贝币',
      notes: '出土高领袋足鬲，具有先周文化特征',
      excavatedBy: '陈刚',
      excavationDate: '2024-04-15'
    },
    {
      unitNumber: '第6层',
      type: 'layer' as const,
      designation: '先周文化层',
      description: '先周时期文化堆积，目前尚未完全发掘。',
      depthTop: 2.9,
      depthBottom: 3.5,
      thickness: 0.6,
      color: '深灰色',
      texture: '粘质重壤土',
      includes: '高领鬲、罐、瓮残片',
      notes: '正在发掘中',
      excavatedBy: '赵伟',
      excavationDate: '2024-04-28'
    },
    {
      unitNumber: 'H1',
      type: 'feature' as const,
      designation: '灰坑',
      description: '第3层下的灰坑遗迹，平面近圆形，坑壁较规整。坑内包含大量陶片和兽骨。',
      depthTop: 0.9,
      depthBottom: 1.4,
      thickness: 0.5,
      color: '深灰色',
      texture: '松软，含炭粒',
      includes: '完整陶鬲、卜甲、兽骨、炭化谷物',
      notes: '出土完整器物30余件，为祭祀坑性质',
      excavatedBy: '陈刚',
      excavationDate: '2024-03-28'
    },
    {
      unitNumber: 'M1',
      type: 'feature' as const,
      designation: '墓葬',
      description: '第4层下的小型土坑墓，仰身直肢葬，随葬品较少。',
      depthTop: 1.6,
      depthBottom: 2.1,
      thickness: 0.5,
      color: '五花土',
      texture: '夯土',
      includes: '陶豆、陶鬲各1件，贝壳数枚',
      notes: '墓主身份为平民',
      excavatedBy: '陈刚',
      excavationDate: '2024-04-08'
    },
    {
      unitNumber: 'D1',
      type: 'disturbance' as const,
      designation: '现代盗洞',
      description: '近现代盗洞，垂直向下，打破第1-3层。盗洞内发现现代矿泉水瓶。',
      depthTop: 0,
      depthBottom: 1.2,
      thickness: 1.2,
      color: '混杂土',
      texture: '杂乱',
      includes: '现代垃圾、扰乱的陶片',
      notes: '对H1灰坑造成部分破坏',
      excavatedBy: '刘芳',
      excavationDate: '2024-03-20'
    }
  ],
  'HN-2023-015': [
    {
      unitNumber: '第1层',
      type: 'layer' as const,
      designation: '表土层',
      description: '现代农耕土层',
      depthTop: 0,
      depthBottom: 0.4,
      thickness: 0.4,
      color: '黄褐色',
      texture: '壤土',
      includes: '植物根系、现代遗物',
      notes: '',
      excavatedBy: '张伟',
      excavationDate: '2023-06-12'
    },
    {
      unitNumber: '第2层',
      type: 'layer' as const,
      designation: '唐宋层',
      description: '唐宋时期文化层，较薄',
      depthTop: 0.4,
      depthBottom: 0.6,
      thickness: 0.2,
      color: '灰褐色',
      texture: '粉砂土',
      includes: '瓷片、砖瓦',
      notes: '',
      excavatedBy: '张伟',
      excavationDate: '2023-06-13'
    },
    {
      unitNumber: '墓道',
      type: 'feature' as const,
      designation: 'M12墓道',
      description: '东汉M12号墓斜坡墓道，长约8米',
      depthTop: 0.6,
      depthBottom: 4.5,
      thickness: 3.9,
      color: '五花土',
      texture: '夯土',
      includes: '少量汉砖',
      notes: '被盗扰严重',
      excavatedBy: '李文博',
      excavationDate: '2023-07-01'
    },
    {
      unitNumber: '墓室',
      type: 'feature' as const,
      designation: 'M12墓室',
      description: '砖室墓，由前室、后室和左右耳室组成',
      depthTop: 4.5,
      depthBottom: 6.8,
      thickness: 2.3,
      color: '',
      texture: '',
      includes: '陶俑、陶模型明器、残玉器',
      notes: '多次被盗，出土物位置被扰乱',
      excavatedBy: '李文博',
      excavationDate: '2023-08-15'
    }
  ],
  'SD-2024-003': [
    {
      unitNumber: '第1层',
      type: 'layer' as const,
      designation: '表土层',
      description: '现代耕土层',
      depthTop: 0,
      depthBottom: 0.25,
      thickness: 0.25,
      color: '黄褐色',
      texture: '砂壤土',
      includes: '植物根系',
      notes: '',
      excavatedBy: '王磊',
      excavationDate: '2024-04-02'
    },
    {
      unitNumber: '第2层',
      type: 'layer' as const,
      designation: '汉代层',
      description: '汉代文化层',
      depthTop: 0.25,
      depthBottom: 0.5,
      thickness: 0.25,
      color: '灰褐色',
      texture: '壤土',
      includes: '绳纹板瓦、陶片',
      notes: '',
      excavatedBy: '王磊',
      excavationDate: '2024-04-05'
    },
    {
      unitNumber: '第3层',
      type: 'layer' as const,
      designation: '龙山文化层',
      description: '龙山文化晚期堆积，出土蛋壳陶片',
      depthTop: 0.5,
      depthBottom: 1.2,
      thickness: 0.7,
      color: '黑褐色',
      texture: '粘壤土',
      includes: '蛋壳黑陶、鼎足、罐口沿',
      notes: '典型龙山文化遗存',
      excavatedBy: '王磊',
      excavationDate: '2024-04-10'
    }
  ]
};

const sampleRelations = {
  'XZ-2024-001': [
    ['第1层', '第2层', 'above' as const],
    ['第2层', '第3层', 'above' as const],
    ['第3层', '第4层', 'above' as const],
    ['第4层', '第5层', 'above' as const],
    ['第5层', '第6层', 'above' as const],
    ['H1', '第3层', 'cut' as const],
    ['H1', '第4层', 'above' as const],
    ['M1', '第4层', 'cut' as const],
    ['M1', '第5层', 'above' as const],
    ['D1', '第1层', 'cut' as const],
    ['D1', '第2层', 'cut' as const],
    ['D1', 'H1', 'cut' as const]
  ],
  'HN-2023-015': [
    ['第1层', '第2层', 'above' as const],
    ['第2层', '墓道', 'above' as const],
    ['墓道', '墓室', 'fills' as const]
  ],
  'SD-2024-003': [
    ['第1层', '第2层', 'above' as const],
    ['第2层', '第3层', 'above' as const]
  ]
};

const sampleArtifacts = {
  'XZ-2024-001': [
    {
      catalogNumber: 'T0101:001',
      name: '绳纹灰陶鬲',
      type: '陶器',
      material: '陶',
      description: '西周晚期夹砂灰陶鬲，口沿外折，袋足，通体饰绳纹。H1出土，完整器。',
      quantity: 1,
      depthFound: 1.1,
      coordinates: 'N34°26\'23" E107°58\'45"',
      notes: 'H1出土完整器物',
      catalogedBy: '陈刚',
      catalogDate: '2024-03-30',
      unitNumber: 'H1'
    },
    {
      catalogNumber: 'T0101:002',
      name: '原始瓷豆',
      type: '瓷器',
      material: '原始瓷',
      description: '西周中期原始青瓷豆，直口浅盘，假腹，圈足。青釉施釉不均。',
      quantity: 1,
      depthFound: 1.8,
      coordinates: '',
      notes: '第4层出土，口沿微残',
      catalogedBy: '陈刚',
      catalogDate: '2024-04-08',
      unitNumber: '第4层'
    },
    {
      catalogNumber: 'T0101:003',
      name: '卜骨',
      type: '骨器',
      material: '兽骨',
      description: '牛肩胛骨卜骨，有钻有凿，灼痕明显。刻辞待考。',
      quantity: 1,
      depthFound: 1.9,
      coordinates: '',
      notes: '第4层出土',
      catalogedBy: '陈刚',
      catalogDate: '2024-04-10',
      unitNumber: '第4层'
    },
    {
      catalogNumber: 'T0101:004',
      name: '玉玦',
      type: '玉器',
      material: '青玉',
      description: '西周早期青玉玦，素面，有缺，磨制光滑。',
      quantity: 2,
      depthFound: 2.5,
      coordinates: '',
      notes: '第5层出土，疑似耳饰',
      catalogedBy: '陈刚',
      catalogDate: '2024-04-18',
      unitNumber: '第5层'
    },
    {
      catalogNumber: 'T0101:005',
      name: '高领袋足鬲',
      type: '陶器',
      material: '陶',
      description: '先周时期高领袋足鬲，夹砂红陶，领部较高，袋足肥硕。',
      quantity: 1,
      depthFound: 3.0,
      coordinates: '',
      notes: '第6层出土，具有典型先周文化特征',
      catalogedBy: '赵伟',
      catalogDate: '2024-04-30',
      unitNumber: '第6层'
    },
    {
      catalogNumber: 'T0101:006',
      name: '青铜残片',
      type: '青铜器',
      material: '铜',
      description: '青铜器残片，可能为鼎的口沿部分，饰有饕餮纹。',
      quantity: 3,
      depthFound: 1.7,
      coordinates: '',
      notes: '第4层出土，疑为铸铜作坊废弃物',
      catalogedBy: '陈刚',
      catalogDate: '2024-04-12',
      unitNumber: '第4层'
    },
    {
      catalogNumber: 'T0101:007',
      name: '贝币',
      type: '货币',
      material: '贝',
      description: '海贝磨制而成的贝币，背部磨平。',
      quantity: 12,
      depthFound: 2.6,
      coordinates: '',
      notes: '第5层出土，作为随葬品',
      catalogedBy: '陈刚',
      catalogDate: '2024-04-20',
      unitNumber: '第5层'
    },
    {
      catalogNumber: 'T0101:008',
      name: '骨锥',
      type: '骨器',
      material: '骨',
      description: '动物骨骼磨制而成的锥子，尖端锐利。',
      quantity: 2,
      depthFound: 1.0,
      coordinates: '',
      notes: '第3层出土',
      catalogedBy: '陈刚',
      catalogDate: '2024-03-28',
      unitNumber: '第3层'
    }
  ],
  'HN-2023-015': [
    {
      catalogNumber: 'M12:001',
      name: '陶侍俑',
      type: '陶器',
      material: '陶',
      description: '东汉灰陶侍俑，站立姿态，头部微残。',
      quantity: 4,
      depthFound: 5.2,
      coordinates: '',
      notes: '前室出土',
      catalogedBy: '李文博',
      catalogDate: '2023-09-10',
      unitNumber: '墓室'
    },
    {
      catalogNumber: 'M12:002',
      name: '陶仓模型',
      type: '陶器',
      material: '陶',
      description: '东汉陶仓明器，悬山顶，有门窗。',
      quantity: 2,
      depthFound: 5.5,
      coordinates: '',
      notes: '耳室出土',
      catalogedBy: '李文博',
      catalogDate: '2023-09-15',
      unitNumber: '墓室'
    }
  ],
  'SD-2024-003': [
    {
      catalogNumber: 'T2:001',
      name: '蛋壳黑陶杯',
      type: '陶器',
      material: '陶',
      description: '龙山文化蛋壳黑陶杯残件，陶胎极薄，乌黑光亮。',
      quantity: 1,
      depthFound: 0.8,
      coordinates: '',
      notes: '第3层出土，典型龙山文化遗物',
      catalogedBy: '王磊',
      catalogDate: '2024-04-12',
      unitNumber: '第3层'
    }
  ]
};

const samplePhotos = {
  'XZ-2024-001': [
    {
      fileName: 'T0101_北壁剖面.jpg',
      filePath: '/photos/T0101_north_section.jpg',
      thumbnailPath: '/photos/thumbs/T0101_north_section.jpg',
      description: 'T0101探方北壁剖面图，显示各文化层堆积',
      photoType: 'section' as const,
      takenBy: '刘芳',
      takenDate: '2024-03-20',
      coordinates: '',
      scale: '1:20',
      northDirection: '↑'
    },
    {
      fileName: 'H1_发掘全景.jpg',
      filePath: '/photos/H1_overview.jpg',
      thumbnailPath: '/photos/thumbs/H1_overview.jpg',
      description: 'H1灰坑发掘完成后全景照',
      photoType: 'overview' as const,
      takenBy: '陈刚',
      takenDate: '2024-03-28',
      coordinates: '',
      scale: '',
      northDirection: ''
    },
    {
      fileName: '陶鬲_出土照.jpg',
      filePath: '/photos/li_vessel_in_situ.jpg',
      thumbnailPath: '/photos/thumbs/li_vessel_in_situ.jpg',
      description: 'H1出土陶鬲原位照',
      photoType: 'detail' as const,
      takenBy: '陈刚',
      takenDate: '2024-03-28',
      coordinates: '',
      scale: '',
      northDirection: ''
    },
    {
      fileName: 'T0101_平面图.jpg',
      filePath: '/photos/T0101_plan.jpg',
      thumbnailPath: '/photos/thumbs/T0101_plan.jpg',
      description: 'T0101探方第3层平面图',
      photoType: 'plan' as const,
      takenBy: '刘芳',
      takenDate: '2024-03-26',
      coordinates: '',
      scale: '1:50',
      northDirection: '↑北'
    },
    {
      fileName: '玉玦_特写.jpg',
      filePath: '/photos/jade_jue_detail.jpg',
      thumbnailPath: '/photos/thumbs/jade_jue_detail.jpg',
      description: '第5层出土玉玦特写',
      photoType: 'artifact' as const,
      takenBy: '陈刚',
      takenDate: '2024-04-20',
      coordinates: '',
      scale: '',
      northDirection: ''
    },
    {
      fileName: 'M1_清理照.jpg',
      filePath: '/photos/M1_cleaning.jpg',
      thumbnailPath: '/photos/thumbs/M1_cleaning.jpg',
      description: 'M1墓葬清理过程照',
      photoType: 'detail' as const,
      takenBy: '陈刚',
      takenDate: '2024-04-08',
      coordinates: '',
      scale: '',
      northDirection: ''
    }
  ],
  'HN-2023-015': [
    {
      fileName: 'M12_全景.jpg',
      filePath: '/photos/M12_overview.jpg',
      thumbnailPath: '/photos/thumbs/M12_overview.jpg',
      description: 'M12墓葬发掘全景',
      photoType: 'overview' as const,
      takenBy: '李文博',
      takenDate: '2023-08-20',
      coordinates: '',
      scale: '',
      northDirection: ''
    },
    {
      fileName: '陶俑_出土照.jpg',
      filePath: '/photos/figurines_in_situ.jpg',
      thumbnailPath: '/photos/thumbs/figurines_in_situ.jpg',
      description: '陶俑出土原位照',
      photoType: 'artifact' as const,
      takenBy: '李文博',
      takenDate: '2023-09-10',
      coordinates: '',
      scale: '',
      northDirection: ''
    }
  ],
  'SD-2024-003': [
    {
      fileName: 'T2_北壁剖面.jpg',
      filePath: '/photos/T2_north_section.jpg',
      thumbnailPath: '/photos/thumbs/T2_north_section.jpg',
      description: 'T2探方北壁剖面',
      photoType: 'section' as const,
      takenBy: '王磊',
      takenDate: '2024-04-08',
      coordinates: '',
      scale: '1:20',
      northDirection: '↑'
    }
  ]
};

export function initSampleData() {
  console.log('开始初始化样例数据...');
  
  for (const projectData of sampleProjects) {
    let project = getProjectByCode(projectData.code);
    
    if (!project) {
      project = createProject(projectData);
      console.log(`  创建项目: ${project.code} - ${project.name}`);
    } else {
      console.log(`  项目已存在: ${project.code}`);
      continue;
    }
    
    const projectId = project.id;
    
    const units = sampleUnits[projectData.code as keyof typeof sampleUnits];
    if (units) {
      for (const unitData of units) {
        const existing = getUnitByNumber(projectId, unitData.unitNumber);
        if (!existing) {
          createUnit({ ...unitData, projectId });
          console.log(`    创建层位: ${unitData.unitNumber}`);
        }
      }
    }
    
    const relations = sampleRelations[projectData.code as keyof typeof sampleRelations];
    if (relations) {
      for (const [fromNum, toNum, relType] of relations) {
        const fromUnit = getUnitByNumber(projectId, fromNum);
        const toUnit = getUnitByNumber(projectId, toNum);
        if (fromUnit && toUnit) {
          createRelation({
            projectId,
            fromUnitId: fromUnit.id,
            toUnitId: toUnit.id,
            relationType: relType as StratigraphicRelation['relationType'],
            confirmed: true,
            notes: ''
          });
        }
      }
      console.log(`    创建 ${relations.length} 条层位关系`);
    }
    
    const artifacts = sampleArtifacts[projectData.code as keyof typeof sampleArtifacts];
    if (artifacts) {
      for (const artifactData of artifacts) {
        const unit = getUnitByNumber(projectId, artifactData.unitNumber);
        if (unit) {
          const { unitNumber, ...rest } = artifactData;
          createArtifact({ ...rest, projectId, unitId: unit.id, condition: null, recordedBy: null, recordedDate: null } as Omit<Artifact, 'photos' | 'id' | 'createdAt' | 'updatedAt'>);
        }
      }
      console.log(`    创建 ${artifacts.length} 件出土物`);
    }
    
    const photos = samplePhotos[projectData.code as keyof typeof samplePhotos];
    if (photos) {
      for (const photoData of photos) {
        createPhoto({ ...photoData, projectId, unitId: null, artifactId: null, notes: null } as Omit<Photo, 'id' | 'createdAt'>);
      }
      console.log(`    创建 ${photos.length} 张照片`);
    }
    
    console.log('');
  }
  
  console.log('样例数据初始化完成！');
}

initSampleData();
